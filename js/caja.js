// =================================
// CAJA PRO V2 + SUPABASE - LO DE FAUSTI
// =================================

let caja = [];
let aperturas = [];
let ventasCache = [];

// =================================
// HELPERS
// =================================

function formatoMoneda(valor) {
  return `$${Number(valor || 0).toLocaleString("es-AR")}`;
}

function setTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.innerText = valor;
}

function avisar(mensaje, tipo = "info") {
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
  } else {
    alert(mensaje);
  }
}

function obtenerUsuario() {
  return JSON.parse(localStorage.getItem("usuario"))?.nombre || "Lodefausti";
}

function formatearMetodo(metodo) {
  const nombres = {
    efectivo: "EFECTIVO",
    transferencia: "TRANSFERENCIA",
    mp: "MERCADO PAGO",
    qr: "QR",
    qr_banco: "QR BANCO",
    promo_bn: "PROMO NACIÓN"
  };

  return nombres[metodo] || metodo || "-";
}

function guardarCajaLocal() {
  localStorage.setItem("caja", JSON.stringify(caja));
  localStorage.setItem("aperturasCaja", JSON.stringify(aperturas));
}

function guardarVentasLocal() {
  localStorage.setItem("ventas", JSON.stringify(ventasCache));
}

function esApertura(m) {
  return (
    m.tipo === "apertura" ||
    String(m.motivo || "").toLowerCase().includes("apertura")
  );
}

function esCierre(m) {
  return (
    m.tipo === "cierre" ||
    String(m.motivo || "").toLowerCase().includes("cierre")
  );
}

// =================================
// CARGAR DATOS SUPABASE
// =================================

async function cargarDatosSupabase() {
  if (typeof supabaseClient === "undefined") {
    caja = JSON.parse(localStorage.getItem("caja")) || [];
    ventasCache = JSON.parse(localStorage.getItem("ventas")) || [];
    aperturas = JSON.parse(localStorage.getItem("aperturasCaja")) || [];
    return;
  }

  const { data: cajaData, error: cajaError } = await supabaseClient
    .from("caja")
    .select("*")
    .order("fecha", { ascending: false });

  if (cajaError) {
    console.error(cajaError);
    avisar("Error cargando caja", "error");
    caja = JSON.parse(localStorage.getItem("caja")) || [];
  } else {
    caja = (cajaData || []).map(m => ({
      id: m.id,
      ventaId: m.venta_id,
      tipo: m.tipo,
      metodo: m.metodo,
      motivo: m.motivo,
      subtotal: Number(m.subtotal || 0),
      descuento: Number(m.descuento || 0),
      monto: Number(m.monto || 0),
      usuario: m.usuario || "Lodefausti",
      fecha: m.fecha
        ? new Date(m.fecha).toLocaleString("es-AR")
        : "-"
    }));
  }

  const { data: ventasData, error: ventasError } = await supabaseClient
    .from("ventas")
    .select("*")
    .order("fecha", { ascending: false });

  if (ventasError) {
    console.error(ventasError);
    avisar("Error cargando ventas", "error");
    ventasCache = JSON.parse(localStorage.getItem("ventas")) || [];
  } else {
    ventasCache = (ventasData || []).map(v => ({
      id: v.id,
      supabaseId: v.id,
      fecha: v.fecha
        ? new Date(v.fecha).toLocaleString("es-AR")
        : "-",
      metodo: v.metodo,
      subtotal: Number(v.subtotal || 0),
      descuentoProductos: Number(v.descuento_productos || 0),
      descuentoCarrito: Number(v.descuento_carrito || 0),
      descuento: Number(v.descuento_total || 0),
      total: Number(v.total || 0),
      costoTotal: Number(v.costo_total || 0),
      ganancia: Number(v.ganancia || 0),
      usuario: v.usuario || "Lodefausti",
      detalle: []
    }));
  }

  aperturas = caja.filter(m => esApertura(m) || esCierre(m));

  guardarCajaLocal();
  guardarVentasLocal();
}

// =================================
// OBTENER VENTAS
// =================================

function obtenerVentas() {
  return ventasCache.length
    ? ventasCache
    : JSON.parse(localStorage.getItem("ventas")) || [];
}

// =================================
// CALCULAR CAJA
// =================================

function calcularCaja() {
  const ventas = obtenerVentas();

  const porMetodo = metodo =>
    ventas
      .filter(v => v.metodo === metodo)
      .reduce((acc, v) => acc + Number(v.total || 0), 0);

  const efectivo = porMetodo("efectivo");
  const transferencia = porMetodo("transferencia");
  const mercadoPago = porMetodo("mp");
  const qr = porMetodo("qr");
  const qrBanco = porMetodo("qr_banco");
  const promoNacion = porMetodo("promo_bn");

  const totalDigital =
    transferencia + mercadoPago + qr + qrBanco + promoNacion;

  const totalVendido = ventas.reduce(
    (acc, v) => acc + Number(v.total || 0),
    0
  );

  const aperturasMonto = caja
    .filter(m => esApertura(m))
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  const ingresosManuales = caja
    .filter(m => m.tipo === "ingreso" && !m.ventaId && !esApertura(m))
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  const egresos = caja
    .filter(m => m.tipo === "egreso" && !esCierre(m))
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  const cierresMonto = caja
    .filter(m => esCierre(m))
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  const saldo =
    aperturasMonto + efectivo + ingresosManuales - egresos - cierresMonto;

  const diezPorciento = totalVendido * 0.10;

  const ultimoMovimiento = [...caja].reverse()[0];

  const cajaAbierta =
    caja.some(m => esApertura(m)) &&
    !esCierre(ultimoMovimiento || {});

  return {
    efectivo,
    transferencia,
    mercadoPago,
    qr,
    qrBanco,
    promoNacion,
    totalDigital,
    totalVendido,
    aperturasMonto,
    ingresosManuales,
    egresos,
    cierresMonto,
    saldo,
    diezPorciento,
    cajaAbierta,
    movimientos: caja.length
  };
}

// =================================
// MODAL
// =================================

function abrirModalCaja(tipo) {
  const modal = document.getElementById("modalCaja");
  const titulo = document.getElementById("modalCajaTitulo");
  const texto = document.getElementById("modalCajaTexto");
  const tipoInput = document.getElementById("modalCajaTipo");
  const monto = document.getElementById("modalCajaMonto");
  const motivo = document.getElementById("modalCajaMotivo");

  if (!modal || !titulo || !texto || !tipoInput || !monto || !motivo) return;

  tipoInput.value = tipo;
  monto.value = "";
  motivo.value = "";

  const config = {
    apertura: {
      titulo: "Abrir caja",
      texto: "Ingresá el monto inicial de efectivo.",
      motivo: "Apertura de caja"
    },
    ingreso: {
      titulo: "Registrar ingreso",
      texto: "Agregá dinero manual a la caja.",
      motivo: ""
    },
    egreso: {
      titulo: "Registrar egreso",
      texto: "Registrá un gasto o retiro de caja.",
      motivo: ""
    },
    cierre: {
      titulo: "Cerrar caja",
      texto: "Ingresá el efectivo retirado al cierre.",
      motivo: "Cierre de caja"
    }
  };

  titulo.innerText = config[tipo].titulo;
  texto.innerText = config[tipo].texto;
  motivo.value = config[tipo].motivo;

  modal.classList.remove("hidden");
  monto.focus();
}

function cerrarModalCaja() {
  document.getElementById("modalCaja")?.classList.add("hidden");

  const monto = document.getElementById("modalCajaMonto");
  const motivo = document.getElementById("modalCajaMotivo");

  if (monto) monto.value = "";
  if (motivo) motivo.value = "";
}

// =================================
// GUARDAR MOVIMIENTO
// =================================

async function guardarMovimientoCajaSupabase(movimiento) {
  if (typeof supabaseClient === "undefined") {
    return null;
  }

  const { data, error } = await supabaseClient
    .from("caja")
    .insert([{
      tipo: movimiento.tipo,
      metodo: movimiento.metodo || null,
      motivo: movimiento.motivo,
      subtotal: movimiento.subtotal || 0,
      descuento: movimiento.descuento || 0,
      monto: movimiento.monto,
      usuario: movimiento.usuario,
      fecha: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

async function confirmarModalCaja() {
  const tipo = document.getElementById("modalCajaTipo")?.value;
  const monto = Number(document.getElementById("modalCajaMonto")?.value || 0);
  const motivo = document.getElementById("modalCajaMotivo")?.value.trim();

  if (!tipo) return;

  if (isNaN(monto) || monto <= 0) {
    avisar("Monto inválido", "error");
    return;
  }

  const resumen = calcularCaja();

  if ((tipo === "egreso" || tipo === "cierre") && monto > resumen.saldo) {
    avisar("No podés retirar más del saldo disponible", "error");
    return;
  }

  const usuario = obtenerUsuario();

  const movimiento = {
    id: Date.now(),
    tipo,
    monto,
    motivo:
      motivo ||
      (tipo === "apertura"
        ? "Apertura de caja"
        : tipo === "cierre"
        ? "Cierre de caja"
        : tipo === "ingreso"
        ? "Ingreso manual"
        : "Egreso manual"),
    usuario,
    fecha: new Date().toLocaleString("es-AR")
  };

  try {
    const movSupabase = await guardarMovimientoCajaSupabase(movimiento);

    if (movSupabase) {
      movimiento.id = movSupabase.id;
      movimiento.fecha = movSupabase.fecha
        ? new Date(movSupabase.fecha).toLocaleString("es-AR")
        : movimiento.fecha;
    }

    caja.push(movimiento);

    if (tipo === "apertura" || tipo === "cierre") {
      aperturas.push(movimiento);
    }

    guardarCajaLocal();

    cerrarModalCaja();
    actualizarCaja();

    avisar(
      tipo === "apertura"
        ? "Caja abierta correctamente"
        : tipo === "cierre"
        ? "Caja cerrada"
        : tipo === "ingreso"
        ? "Ingreso registrado"
        : "Egreso registrado",
      tipo === "egreso" || tipo === "cierre" ? "info" : "success"
    );

  } catch (error) {
    console.error(error);
    avisar("Error guardando movimiento", "error");
  }
}

// =================================
// STATS
// =================================

function renderStatsCaja() {
  const r = calcularCaja();

  setTexto("saldoCaja", formatoMoneda(r.saldo));
  setTexto("totalEfectivo", formatoMoneda(r.efectivo));
  setTexto("totalDigital", formatoMoneda(r.totalDigital));
  setTexto("totalVendido", formatoMoneda(r.totalVendido));

  setTexto("ingresosCaja", formatoMoneda(r.ingresosManuales));
  setTexto("egresosCaja", formatoMoneda(r.egresos));
  setTexto("diezPorciento", formatoMoneda(r.diezPorciento));
  setTexto("movimientosCaja", r.movimientos);

  setTexto("totalTransferencia", formatoMoneda(r.transferencia));
  setTexto("totalMP", formatoMoneda(r.mercadoPago));
  setTexto("totalQR", formatoMoneda(r.qr));
  setTexto("totalQRBanco", formatoMoneda(r.qrBanco));
  setTexto("totalPromoBN", formatoMoneda(r.promoNacion));

  const estado = document.getElementById("estadoCaja");

  if (estado) {
    estado.innerText = r.cajaAbierta ? "Caja abierta" : "Caja cerrada";
    estado.className = r.cajaAbierta
      ? "caja-status status-open"
      : "caja-status status-closed";
  }
}

// =================================
// MOVIMIENTOS
// =================================

function renderMovimientos() {
  const cont = document.getElementById("listaCaja");
  if (!cont) return;

  cont.innerHTML = "";

  if (caja.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        No hay movimientos registrados
      </div>
    `;
    return;
  }

  cont.innerHTML = [...caja]
    .reverse()
    .slice(0, 20)
    .map(m => {
      const ingreso = m.tipo === "ingreso" || m.tipo === "apertura";
      const clase = ingreso ? "movement-green" : "movement-red";
      const badge = ingreso ? "badge-success" : "badge-danger";
      const signo = ingreso ? "+" : "-";

      return `
        <div class="movement-card ${clase}">
          <div>
            <span class="${badge}">
              ${String(m.tipo || "-").toUpperCase()}
            </span>

            <h4>${m.motivo || "-"}</h4>

            <small>${m.fecha || "-"} · ${m.usuario || "Lodefausti"}</small>
          </div>

          <strong class="${ingreso ? "money-in" : "money-out"}">
            ${signo}${formatoMoneda(m.monto)}
          </strong>
        </div>
      `;
    })
    .join("");
}

// =================================
// HISTORIAL VENTAS
// =================================

function renderHistorialVentas() {
  const cont = document.getElementById("historialVentas");
  if (!cont) return;

  const ventas = obtenerVentas();

  if (ventas.length === 0) {
    cont.innerHTML = `
      <tr>
        <td colspan="4">No hay ventas registradas</td>
      </tr>
    `;
    return;
  }

  cont.innerHTML = ventas
    .slice(0, 12)
    .map(venta => `
      <tr>
        <td>${venta.fecha || "-"}</td>

        <td>
          <span class="method-badge">
            ${formatearMetodo(venta.metodo)}
          </span>
        </td>

        <td>
          <strong>${formatoMoneda(venta.total)}</strong>
          ${
            Number(venta.descuento || 0) > 0
              ? `<small class="discount-note">Desc: -${formatoMoneda(venta.descuento)}</small>`
              : ""
          }
        </td>

        <td>
          <button
            type="button"
            class="detail-btn"
            onclick="verDetalleVenta('${venta.id}')"
          >
            Ver
          </button>
        </td>
      </tr>
    `)
    .join("");
}

// =================================
// DETALLE VENTA
// =================================

async function obtenerDetalleVenta(id) {
  const ventaLocal = ventasCache.find(v => String(v.id) === String(id));

  if (!ventaLocal) return null;

  if (ventaLocal.detalle && ventaLocal.detalle.length > 0) {
    return ventaLocal;
  }

  if (typeof supabaseClient === "undefined") return ventaLocal;

  const { data, error } = await supabaseClient
    .from("venta_detalle")
    .select("*")
    .eq("venta_id", id);

  if (error) {
    console.error(error);
    return ventaLocal;
  }

  ventaLocal.detalle = (data || []).map(item => ({
    nombre: item.nombre,
    cantidad: Number(item.cantidad || 0),
    precio: Number(item.precio || 0),
    total: Number(item.total || 0),
    subtotal: Number(item.subtotal || 0),
    descuento: Number(item.descuento || 0)
  }));

  return ventaLocal;
}

async function verDetalleVenta(id) {
  const venta = await obtenerDetalleVenta(id);

  if (!venta) {
    avisar("Venta no encontrada", "error");
    return;
  }

  const detalleHTML = (venta.detalle || [])
    .map(item => `
      <div class="detail-item">
        <div>
          <strong>${item.nombre}</strong>
          <small>${item.cantidad} x ${formatoMoneda(item.precio)}</small>
        </div>

        <span>
          ${formatoMoneda(item.total || item.subtotal || 0)}
        </span>
      </div>
    `)
    .join("");

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal caja-modal">
      <h3>Detalle de venta</h3>

      <p>
        ${venta.fecha || "-"} · ${formatearMetodo(venta.metodo)}
      </p>

      <div class="detail-list">
        ${detalleHTML || `<div class="empty-state">Sin detalle</div>`}
      </div>

      <hr>

      <div class="caja-detail-summary">
        <div>
          <span>Subtotal</span>
          <strong>${formatoMoneda(venta.subtotal || venta.total)}</strong>
        </div>

        <div>
          <span>Descuento</span>
          <strong>-${formatoMoneda(venta.descuento || 0)}</strong>
        </div>

        <div class="final">
          <span>Total</span>
          <strong>${formatoMoneda(venta.total)}</strong>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector(".btn-cancel").onclick = () => overlay.remove();

  overlay.onclick = e => {
    if (e.target === overlay) overlay.remove();
  };
}

// =================================
// LIMPIAR CAJA
// =================================

async function limpiarCaja() {
  if (caja.length === 0) {
    avisar("No hay movimientos", "info");
    return;
  }

  const confirmar = confirm("¿Limpiar caja completa? También se borrarán movimientos en Supabase.");

  if (!confirmar) return;

  if (typeof supabaseClient !== "undefined") {
    const { error } = await supabaseClient
      .from("caja")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error(error);
      avisar("Error limpiando caja en Supabase", "error");
      return;
    }
  }

  caja = [];
  aperturas = [];

  guardarCajaLocal();
  actualizarCaja();

  avisar("Caja limpiada", "success");
}

// =================================
// ACTUALIZAR
// =================================

function actualizarCaja() {
  renderStatsCaja();
  renderMovimientos();
  renderHistorialVentas();
}

// =================================
// INIT
// =================================

document.addEventListener("DOMContentLoaded", async () => {
  await cargarDatosSupabase();
  actualizarCaja();
});