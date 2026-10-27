// =================================
// DASHBOARD PRO + SUPABASE
// LO DE FAUSTI
// =================================

let metodosChartInstance = null;
let ventasChartInstance = null;

let ventas = [];
let productos = [];
let historial = [];
let caja = [];

let filtroDashboard = "hoy";
let fechaDashboardSeleccionada = "";
let dashboardCargando = false;

// =================================
// HELPERS
// =================================

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("es-AR")}`;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function fechaAR(fecha) {
  if (!fecha) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(fecha));
}

function fechaHoraAR(fecha) {
  if (!fecha) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(new Date(fecha));
}

function fechaISOArgentina(fecha) {
  if (!fecha) return "";

  if (Number.isNaN(new Date(fecha).getTime())) return "";

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(fecha));

  const obj = {};

  partes.forEach(p => {
    if (p.type !== "literal") {
      obj[p.type] = p.value;
    }
  });

  return `${obj.year}-${obj.month}-${obj.day}`;
}

function hoyISOArgentina() {
  return fechaISOArgentina(new Date());
}

function sumarDiasISO(iso, dias) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

function ayerISOArgentina() {
  return sumarDiasISO(hoyISOArgentina(), -1);
}

// Lunes de la semana actual, calculado con la fecha de Argentina
// (no depende de la zona horaria configurada en la computadora)
function inicioSemanaISOArgentina() {
  const hoy = hoyISOArgentina();
  const [y, m, d] = hoy.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
  return sumarDiasISO(hoy, -(diaSemana === 0 ? 6 : diaSemana - 1));
}

function inicioMesISOArgentina() {
  const hoy = fechaISOArgentina(new Date()).split("-");
  return `${hoy[0]}-${hoy[1]}-01`;
}

// Período seleccionado en el tablero (una sola fuente de verdad)
function rangoPeriodoDashboard() {
  const hoy = hoyISOArgentina();

  if (filtroDashboard === "semana") {
    return { desde: inicioSemanaISOArgentina(), hasta: hoy };
  }

  if (filtroDashboard === "mes") {
    return { desde: inicioMesISOArgentina(), hasta: hoy };
  }

  if (filtroDashboard === "custom" && fechaDashboardSeleccionada) {
    return { desde: fechaDashboardSeleccionada, hasta: fechaDashboardSeleccionada };
  }

  return { desde: hoy, hasta: hoy };
}

function textoFechaISO(iso) {
  if (!iso) return "—";
  return String(iso).split("-").reverse().join("/");
}

function escaparHTML(valor) {
  return String(valor ?? "-").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function esHoy(fecha) {
  return fechaISOArgentina(fecha) === hoyISOArgentina();
}

function esAyer(fecha) {
  return fechaISOArgentina(fecha) === ayerISOArgentina();
}

function avisar(mensaje, tipo = "info") {
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
  } else {
    console.log(mensaje);
  }
}

// =================================
// FILTROS
// =================================

function ventaActivaDashboard(v) {
  return v && v.estado !== "anulada" && v.anulada !== true;
}

function filtrarVentasPorPeriodo(lista = ventas) {
  const { desde, hasta } = rangoPeriodoDashboard();

  return lista.filter(ventaActivaDashboard).filter(v => {
    const f = fechaISOArgentina(v.fecha);
    return f >= desde && f <= hasta;
  });
}

function filtrarDashboard(tipo) {
  const nuevoFiltro = ["hoy", "semana", "mes", "custom"].includes(tipo) ? tipo : "hoy";
  const inputFecha = document.getElementById("fechaDashboard");

  if (nuevoFiltro === "custom") {
    const fecha = inputFecha?.value || "";

    if (!fecha) {
      avisar("Elegí una fecha para consultar.", "info");
      return;
    }

    fechaDashboardSeleccionada = fecha;
  } else if (inputFecha) {
    // Al volver a Hoy / Semana / Mes se limpia la fecha elegida
    inputFecha.value = "";
  }

  filtroDashboard = nuevoFiltro;

  document.querySelectorAll(".filter-btn[data-filter]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filtroDashboard);
  });

  renderDashboardReal();
}

// =================================
// SUPABASE
// =================================

// =================================
// CARGA COMPLETA DESDE SUPABASE
// (Supabase devuelve como máximo 1000 filas por consulta)
// =================================

async function traerTodoPaginado(armarConsulta) {
  const TAM = 1000;
  let desde = 0;
  let filas = [];

  while (true) {
    const { data, error } = await armarConsulta().range(desde, desde + TAM - 1);

    if (error) return { data: null, error };

    filas = filas.concat(data || []);

    if (!data || data.length < TAM) break;

    desde += TAM;
  }

  return { data: filas, error: null };
}

// Trae el detalle de TODAS las ventas en lotes
// (antes se hacía una consulta por cada venta)
async function traerDetallesPorVenta(ids) {
  const porVenta = {};
  const LOTE = 40;
  const PARALELO = 4;
  const lotes = [];

  for (let i = 0; i < ids.length; i += LOTE) {
    lotes.push(ids.slice(i, i + LOTE));
  }

  for (let i = 0; i < lotes.length; i += PARALELO) {
    const grupo = lotes.slice(i, i + PARALELO);

    const resultados = await Promise.all(
      grupo.map(lote =>
        traerTodoPaginado(() =>
          supabaseClient.from("venta_detalle").select("*").in("venta_id", lote)
        )
      )
    );

    resultados.forEach(r => {
      if (r.error) throw r.error;

      r.data.forEach(fila => {
        const clave = String(fila.venta_id);
        (porVenta[clave] = porVenta[clave] || []).push(fila);
      });
    });
  }

  return porVenta;
}

async function cargarDashboardSupabase() {
  if (dashboardCargando) return;
  dashboardCargando = true;

  try {
    const productosRes = await traerTodoPaginado(() =>
      supabaseClient.from("productos").select("*").eq("activo", true).order("id")
    );

    if (productosRes.error) {
      console.error(productosRes.error);
    } else {
      productos = productosRes.data || [];
      localStorage.setItem("productos", JSON.stringify(productos));
    }

    const ventasRes = await traerTodoPaginado(() =>
      supabaseClient
        .from("ventas")
        .select("*")
        .order("fecha", { ascending: false })
        .order("id", { ascending: false })
    );

    if (ventasRes.error) {
      console.error(ventasRes.error);
    } else {
      const ventasData = ventasRes.data || [];
      const detalles = await traerDetallesPorVenta(ventasData.map(v => v.id));

      ventas = ventasData.map(venta => ({
        id: venta.id,
        fecha: venta.fecha,
        fechaTexto: fechaHoraAR(venta.fecha),
        metodo: venta.metodo,
        subtotal: Number(venta.subtotal || 0),
        descuento: Number(venta.descuento_total || 0),
        total: Number(venta.total || 0),
        costoTotal: Number(venta.costo_total || 0),
        ganancia: venta.ganancia == null ? null : Number(venta.ganancia),
        estado: venta.estado || "activa",
        anulada: venta.anulada === true,
        usuario: venta.usuario || "Local",
        detalle: detalles[String(venta.id)] || []
      }));

      localStorage.setItem("ventas", JSON.stringify(ventas));
    }

    // Solo se necesitan las aperturas de caja (para la alerta "Abrí caja")
    const cajaRes = await traerTodoPaginado(() =>
      supabaseClient.from("caja").select("*").eq("tipo", "apertura").order("id")
    );

    if (cajaRes.error) {
      console.error(cajaRes.error);
    } else {
      caja = cajaRes.data || [];
    }

    historial =
      JSON.parse(localStorage.getItem("historial")) || [];

    renderDashboardReal();
    renderInventarioSemanal();
  } catch (error) {
    console.error("Error al cargar el informe:", error);
    avisar("No se pudieron actualizar los datos. Revisá la conexión.", "error");
  } finally {
    dashboardCargando = false;
  }
}

// =================================
// DASHBOARD
// =================================

function renderDashboardReal() {
  const ventasFiltradas = filtrarVentasPorPeriodo(ventas);

  let ventasHoy = 0;
  let ventasAyer = 0;
  let ventasPeriodo = 0;
  let ganancia = 0;
  let productosVendidos = 0;

  ventas.filter(ventaActivaDashboard).forEach(v => {
    const total = Number(v.total || 0);

    if (esHoy(v.fecha)) ventasHoy += total;
    if (esAyer(v.fecha)) ventasAyer += total;
  });

  ventasFiltradas.forEach(v => {
    const total = Number(v.total || 0);
    ventasPeriodo += total;
    // La ganancia guardada por la venta ya contempla descuentos.
    // Si no está disponible, se calcula desde el total realmente cobrado
    // menos el costo de los artículos vendidos.
    const costoDetalle = Array.isArray(v.detalle)
      ? v.detalle.reduce((sum, i) => sum + Number(i.costo || 0) * Number(i.cantidad || 0), 0)
      : 0;
    const costo = v.costoTotal || costoDetalle;
    ganancia += v.ganancia !== null && Number.isFinite(v.ganancia)
      ? v.ganancia : total - costo;
    if (Array.isArray(v.detalle)) {
      v.detalle.forEach(i => { productosVendidos += Number(i.cantidad || 0); });
    }
  });

  const stockCritico = productos.filter(
    p => Number(p.stock || 0) <= 5
  ).length;

  const stockBajo = productos.filter(
    p =>
      Number(p.stock || 0) > 5 &&
      Number(p.stock || 0) <= 10
  ).length;

  setText("ventasHoy", formatMoney(ventasPeriodo));
  const ventasMesReal = ventas.filter(ventaActivaDashboard).filter(v => {
    const f = fechaISOArgentina(v.fecha);
    return f >= inicioMesISOArgentina() && f <= hoyISOArgentina();
  }).reduce((acum, v) => acum + Number(v.total || 0), 0);
  setText("ventasMes", formatMoney(ventasMesReal));
  setText("gananciaTotal", formatMoney(Math.round(ganancia)));
  setText("productosVendidos", productosVendidos);
  setText("cantidadStockCritico", stockCritico);
  setText("cantidadStockBajo", stockBajo);
  setText("cantidadVentas", ventasFiltradas.length);
  setText("cantidadProductos", productos.length);

  renderKpiTrends(ventasHoy, ventasAyer, stockCritico);

  renderEstadoNegocio(
    ventasHoy,
    stockCritico,
    ventas.filter(ventaActivaDashboard).length
  );

  renderAlertasInteligentes(
    ventas.filter(ventaActivaDashboard),
    productos,
    caja,
    ventasHoy,
    stockCritico
  );

  renderTopProductos(ventasFiltradas);
  renderActividadReciente(historial);
  renderStockCritico(productos);
  renderStockBajo(productos);
  renderUltimasVentas(ventasFiltradas);
  renderMetodosChart(ventasFiltradas);
  renderVentasChart(ventasFiltradas);
  renderInformePeriodo(ventasFiltradas, ventasPeriodo, ganancia, productosVendidos);
}


// Informe detallado: siempre se calcula desde las ventas cargadas, sin sumar al tocar filtros.
function renderInformePeriodo(lista, total, ganancia, unidades) {
  const cont = document.getElementById("informePeriodo");
  if (!cont) return;

  const { desde, hasta } = rangoPeriodoDashboard();

  const nombres = {
    hoy: "Hoy",
    semana: "Esta semana (lunes a hoy)",
    mes: "Este mes",
    custom: textoFechaISO(fechaDashboardSeleccionada)
  };

  setText("tituloInformePeriodo", `Informe de ventas — ${nombres[filtroDashboard] || "Hoy"}`);
  setText(
    "rangoInformePeriodo",
    desde === hasta ? textoFechaISO(desde) : `${textoFechaISO(desde)} al ${textoFechaISO(hasta)}`
  );
  setText("informeTotal", formatMoney(total));
  setText("informeCantidad", String(lista.length));
  setText("informeUnidades", String(unidades));
  setText("informeGanancia", formatMoney(Math.round(ganancia)));

  // Total por método de pago
  const etiquetas = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    mp: "Mercado Pago",
    qr: "QR",
    qr_banco: "QR Banco",
    promo_bn: "Promo Banco Nación"
  };

  const porMetodo = {};

  lista.forEach(v => {
    const metodo = String(v.metodo || "otro").toLowerCase();
    porMetodo[metodo] = (porMetodo[metodo] || 0) + Number(v.total || 0);
  });

  const metodosEl = document.getElementById("informeMetodos");

  if (metodosEl) {
    metodosEl.innerHTML = Object.entries(porMetodo)
      .sort((a, b) => b[1] - a[1])
      .map(([metodo, monto]) =>
        `<span class="informe-chip"><small>${escaparHTML(etiquetas[metodo] || metodo)}</small><strong>${formatMoney(monto)}</strong></span>`
      )
      .join("");
  }

  if (!lista.length) {
    cont.innerHTML = '<tr><td colspan="4">No hay ventas registradas en este período.</td></tr>';
    return;
  }

  cont.innerHTML = [...lista]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .map(v =>
      `<tr><td>${escaparHTML(fechaHoraAR(v.fecha))}</td><td>${escaparHTML(v.usuario || "Local")}</td><td>${escaparHTML(v.metodo || "-")}</td><td>${formatMoney(v.total)}</td></tr>`
    )
    .join("");
}

// =================================
// KPI
// =================================

function renderKpiTrends(ventasHoy, ventasAyer, stockCritico) {
  const trendVentas = document.getElementById("trendVentas");
  const trendStock = document.getElementById("trendStock");

  if (trendVentas) {
    if (ventasAyer === 0 && ventasHoy > 0) {
      trendVentas.className = "kpi-trend up";
      trendVentas.innerText = "↑ Actividad iniciada hoy";
    } else if (ventasHoy > ventasAyer) {
      const porcentaje =
        ventasAyer > 0
          ? Math.round(((ventasHoy - ventasAyer) / ventasAyer) * 100)
          : 100;

      trendVentas.className = "kpi-trend up";
      trendVentas.innerText = `↑ ${porcentaje}% vs ayer`;
    } else if (ventasHoy < ventasAyer) {
      trendVentas.className = "kpi-trend down";
      trendVentas.innerText = "↓ Menos ventas que ayer";
    } else {
      trendVentas.className = "kpi-trend neutral";
      trendVentas.innerText = "Sin cambios";
    }
  }

  if (trendStock) {
    if (stockCritico > 0) {
      trendStock.className = "kpi-trend down";
      trendStock.innerText = "⚠ Reponer urgente";
    } else {
      trendStock.className = "kpi-trend up";
      trendStock.innerText = "Stock controlado";
    }
  }
}

// =================================
// ESTADO NEGOCIO
// =================================

function renderEstadoNegocio(ventasHoy, stockCritico, cantidadVentas) {
  const cont = document.getElementById("estadoNegocio");
  if (!cont) return;

  let estado = "Excelente";
  let clase = "status-good";
  let texto = "El negocio está funcionando correctamente.";

  if (stockCritico > 0 || ventasHoy === 0) {
    estado = "Atención";
    clase = "status-warning";
    texto = "Hay situaciones para revisar.";
  }

  if (stockCritico >= 3 && ventasHoy === 0) {
    estado = "Crítico";
    clase = "status-danger";
    texto = "Revisar stock y actividad.";
  }

  if (cantidadVentas === 0) {
    estado = "Inicial";
    clase = "status-warning";
    texto = "Todavía no hay ventas.";
  }

  cont.innerHTML = `
    <span>Estado del negocio</span>
    <h2>${estado}</h2>
    <p>${texto}</p>

    <div class="status-pill">
      <span class="status-dot ${clase}"></span>
      Monitoreo activo
    </div>
  `;
}

// =================================
// ALERTAS
// =================================

function renderAlertasInteligentes(
  ventas,
  productos,
  caja,
  ventasHoy,
  stockCritico
) {
  const cont = document.getElementById("alertasInteligentes");
  if (!cont) return;

  const alertas = [];

  const productosSinStock = productos.filter(
    p => Number(p.stock || 0) <= 0
  );

  const cajaAbiertaHoy = caja.some(
    c => c.tipo === "apertura" && c.fecha && esHoy(c.fecha)
  );

  if (ventasHoy === 0) {
    alertas.push({
      tipo: "warning",
      icono: "fa-chart-line",
      titulo: "No hubo ventas hoy",
      texto: "Revisar actividad."
    });
  }

  if (stockCritico > 0) {
    alertas.push({
      tipo: "danger",
      icono: "fa-box-open",
      titulo: `${stockCritico} productos críticos`,
      texto: "Hay productos debajo del mínimo."
    });
  }

  if (productosSinStock.length > 0) {
    alertas.push({
      tipo: "danger",
      icono: "fa-triangle-exclamation",
      titulo: `${productosSinStock.length} productos agotados`,
      texto: "No deberían venderse."
    });
  }

  if (!cajaAbiertaHoy) {
    alertas.push({
      tipo: "warning",
      icono: "fa-cash-register",
      titulo: "Caja no abierta",
      texto: "Abrí caja para iniciar."
    });
  }

  if (alertas.length === 0) {
    alertas.push({
      tipo: "success",
      icono: "fa-circle-check",
      titulo: "Todo bajo control",
      texto: "No hay alertas."
    });
  }

  cont.innerHTML = alertas
    .map(
      a => `
      <div class="alert-card ${a.tipo}">
        <i class="fa-solid ${a.icono}"></i>

        <div>
          <strong>${a.titulo}</strong>
          <p>${a.texto}</p>
        </div>
      </div>
    `
    )
    .join("");
}

// =================================
// TOP PRODUCTOS
// =================================

function renderTopProductos(listaVentas) {
  const cont = document.getElementById("topProductos");
  if (!cont) return;

  const ranking = {};

  listaVentas.forEach(v => {
    if (!Array.isArray(v.detalle)) return;

    v.detalle.forEach(item => {
      const nombre = item.nombre || "Producto";
      const cantidad = Number(item.cantidad || 0);

      if (!ranking[nombre]) ranking[nombre] = 0;
      ranking[nombre] += cantidad;
    });
  });

  const top = Object.entries(ranking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (top.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        Todavía no hay productos vendidos
      </div>
    `;
    return;
  }

  const medallas = ["🥇", "🥈", "🥉", "⭐", "🔥"];
  const max = top[0][1];

  cont.innerHTML = top
    .map(([nombre, cantidad], index) => {
      const porcentaje = Math.max(
        8,
        Math.round((cantidad / max) * 100)
      );

      return `
        <div class="top-product-item">
          <div class="top-medal">${medallas[index]}</div>

          <div class="top-product-info">
            <h4>${nombre}</h4>

            <div class="top-bar">
              <span style="width:${porcentaje}%"></span>
            </div>
          </div>

          <div class="top-product-total">${cantidad}</div>
        </div>
      `;
    })
    .join("");
}

// =================================
// ACTIVIDAD
// =================================

function renderActividadReciente(historial) {
  const cont = document.getElementById("actividadReciente");
  if (!cont) return;

  if (historial.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        Sin actividad reciente
      </div>
    `;
    return;
  }

  cont.innerHTML = `
    <div class="timeline">
      ${historial
        .slice(0, 7)
        .map(
          h => `
          <div class="timeline-item">
            <h4>${h.modulo || "Sistema"}</h4>
            <p>${h.descripcion || "-"}</p>
            <small>${h.fecha || "-"}</small>
          </div>
        `
        )
        .join("")}
    </div>
  `;
}

// =================================
// STOCKS
// =================================

function renderStockCritico(productos) {
  const cont = document.getElementById("stockCritico");
  if (!cont) return;

  const criticos = productos.filter(
    p => Number(p.stock || 0) <= 5
  );

  if (criticos.length === 0) {
    cont.innerHTML = `<div class="empty-state">Sin stock crítico</div>`;
    return;
  }

  cont.innerHTML = criticos
    .map(
      p => `
      <div class="stock-item critical">
        <strong>${p.nombre}</strong>
        <span>Stock: ${p.stock}</span>
      </div>
    `
    )
    .join("");
}

function renderStockBajo(productos) {
  const cont = document.getElementById("stockBajo");
  if (!cont) return;

  const bajos = productos.filter(
    p =>
      Number(p.stock || 0) > 5 &&
      Number(p.stock || 0) <= 10
  );

  if (bajos.length === 0) {
    cont.innerHTML = `<div class="empty-state">Sin stock bajo</div>`;
    return;
  }

  cont.innerHTML = bajos
    .map(
      p => `
      <div class="stock-item low">
        <strong>${p.nombre}</strong>
        <span>Stock: ${p.stock}</span>
      </div>
    `
    )
    .join("");
}

// =================================
// ÚLTIMAS VENTAS
// =================================

function renderUltimasVentas(listaVentas) {
  const cont = document.getElementById("ultimasVentas");
  if (!cont) return;

  if (listaVentas.length === 0) {
    cont.innerHTML = `<div class="empty-state">Sin ventas</div>`;
    return;
  }

  cont.innerHTML = listaVentas
    .slice(0, 6)
    .map(
      v => `
        <div class="movement-card">
          <div>
            <h4>${v.fechaTexto || fechaHoraAR(v.fecha)}</h4>
            <p>${v.usuario || "Local"} · ${v.metodo || "-"}</p>
          </div>

          <strong>${formatMoney(v.total)}</strong>
        </div>
      `
    )
    .join("");
}

// =================================
// CHARTS
// =================================

function renderMetodosChart(listaVentas) {
  const canvas = document.getElementById("metodosChart");

  if (!canvas || typeof Chart === "undefined") return;

  if (metodosChartInstance) {
    metodosChartInstance.destroy();
  }

  const data = {
    efectivo: 0,
    transferencia: 0,
    mp: 0,
    qr: 0
  };

  listaVentas.forEach(v => {
    if (data[v.metodo] !== undefined) {
      data[v.metodo] += Number(v.total || 0);
    }
  });

  metodosChartInstance = new Chart(canvas, {
    type: "doughnut",

    data: {
      labels: ["Efectivo", "Transferencia", "MP", "QR"],

      datasets: [
        {
          data: [
            data.efectivo,
            data.transferencia,
            data.mp,
            data.qr
          ],
          borderWidth: 0,
          hoverOffset: 12
        }
      ]
    },

    options: {
      responsive: true,
      cutout: "68%"
    }
  });
}

function renderVentasChart(listaVentas) {
  const canvas = document.getElementById("ventasChart");

  if (!canvas || typeof Chart === "undefined") return;

  if (ventasChartInstance) {
    ventasChartInstance.destroy();
  }

  const { desde, hasta } = rangoPeriodoDashboard();
  const labels = [];
  const valores = [];

  if (desde === hasta) {
    // Un solo día: ventas por hora
    const formatoHora = new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      hourCycle: "h23"
    });

    const porHora = {};

    listaVentas.forEach(v => {
      const fecha = new Date(v.fecha);
      if (Number.isNaN(fecha.getTime())) return;
      const hora = formatoHora.format(fecha);
      porHora[hora] = (porHora[hora] || 0) + Number(v.total || 0);
    });

    Object.keys(porHora).sort().forEach(hora => {
      labels.push(`${hora}:00`);
      valores.push(porHora[hora]);
    });
  } else {
    // Varios días: total por día (incluye los días sin ventas)
    const porDia = {};

    listaVentas.forEach(v => {
      const dia = fechaISOArgentina(v.fecha);
      if (dia) porDia[dia] = (porDia[dia] || 0) + Number(v.total || 0);
    });

    for (let dia = desde; dia <= hasta; dia = sumarDiasISO(dia, 1)) {
      labels.push(dia.split("-").reverse().slice(0, 2).join("/"));
      valores.push(porDia[dia] || 0);
    }
  }

  ventasChartInstance = new Chart(canvas, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Ventas",
          data: valores,
          tension: 0.45,
          fill: true,
          borderWidth: 3,
          pointRadius: 5
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// =================================
// INVENTARIO
// =================================

function renderInventarioSemanal() {
  const cont = document.getElementById("inventarioSemanal");
  if (!cont) return;

  if (productos.length === 0) {
    cont.innerHTML = `
      <tr>
        <td colspan="3">No hay productos</td>
      </tr>
    `;
    return;
  }

  const productosOrdenados = [...productos].sort(
    (a, b) => Number(a.stock || 0) - Number(b.stock || 0)
  );

  cont.innerHTML = productosOrdenados
    .map(p => {
      const stock = Number(p.stock || 0);

      const estado =
        stock <= 5
          ? `<span class="stock-low">CRÍTICO</span>`
          : `<span class="stock-ok">CORRECTO</span>`;

      return `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.stock}</td>
          <td>${estado}</td>
        </tr>
      `;
    })
    .join("");
}

// =================================
// INIT
// =================================

document.addEventListener("DOMContentLoaded", async () => {
  await cargarDashboardSupabase();
});