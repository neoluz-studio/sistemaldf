// =================================
// CAJA PRO V2 - LO DE FAUSTI
// =================================

let caja = JSON.parse(localStorage.getItem("caja")) || [];
let aperturas = JSON.parse(localStorage.getItem("aperturasCaja")) || [];

// HELPERS
function obtenerVentas() {
  return JSON.parse(localStorage.getItem("ventas")) || [];
}

function obtenerUsuario() {
  return JSON.parse(localStorage.getItem("usuario"))?.nombre || "Local";
}

function guardarCaja() {
  localStorage.setItem("caja", JSON.stringify(caja));
  localStorage.setItem("aperturasCaja", JSON.stringify(aperturas));
}

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

// CALCULAR CAJA
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

  const totalDescuentos = ventas.reduce(
    (acc, v) => acc + Number(v.descuento || 0),
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
    totalDescuentos,
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

// MODAL
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

function confirmarModalCaja() {
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

  const fecha = new Date().toLocaleString();
  const usuario = obtenerUsuario();

  if (tipo === "apertura") {
    caja.push({
      id: Date.now(),
      tipo: "apertura",
      monto,
      motivo: motivo || "Apertura de caja",
      usuario,
      fecha
    });

    aperturas.push({
      id: Date.now(),
      tipo: "apertura",
      monto,
      usuario,
      fecha
    });

    avisar("Caja abierta correctamente", "success");
  }

  if (tipo === "ingreso") {
    caja.push({
      id: Date.now(),
      tipo: "ingreso",
      monto,
      motivo: motivo || "Ingreso manual",
      usuario,
      fecha
    });

    avisar("Ingreso registrado", "success");
  }

  if (tipo === "egreso") {
    caja.push({
      id: Date.now(),
      tipo: "egreso",
      monto,
      motivo: motivo || "Egreso manual",
      usuario,
      fecha
    });

    avisar("Egreso registrado", "info");
  }

  if (tipo === "cierre") {
    caja.push({
      id: Date.now(),
      tipo: "cierre",
      monto,
      motivo: motivo || "Cierre de caja",
      usuario,
      fecha
    });

    aperturas.push({
      id: Date.now(),
      tipo: "cierre",
      monto,
      usuario,
      fecha
    });

    avisar("Caja cerrada", "info");
  }

  guardarCaja();
  cerrarModalCaja();
  actualizarCaja();
}

// STATS
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

// MOVIMIENTOS
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

            <small>${m.fecha || "-"} · ${m.usuario || "Local"}</small>
          </div>

          <strong class="${ingreso ? "money-in" : "money-out"}">
            ${signo}${formatoMoneda(m.monto)}
          </strong>
        </div>
      `;
    })
    .join("");
}

// HISTORIAL VENTAS
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

  cont.innerHTML = [...ventas]
    .reverse()
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
            onclick="verDetalleVenta(${venta.id})"
          >
            Ver
          </button>
        </td>
      </tr>
    `)
    .join("");
}

// DETALLE VENTA
function verDetalleVenta(id) {
  const venta = obtenerVentas().find(v => Number(v.id) === Number(id));

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

// LIMPIAR
function limpiarCaja() {
  if (caja.length === 0) {
    avisar("No hay movimientos", "info");
    return;
  }

  const confirmar = confirm("¿Limpiar caja completa?");

  if (!confirmar) return;

  caja = [];
  aperturas = [];

  guardarCaja();
  actualizarCaja();

  avisar("Caja limpiada", "success");
}

// ACTUALIZAR
function actualizarCaja() {
  caja = JSON.parse(localStorage.getItem("caja")) || [];
  aperturas = JSON.parse(localStorage.getItem("aperturasCaja")) || [];

  renderStatsCaja();
  renderMovimientos();
  renderHistorialVentas();
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  actualizarCaja();
});