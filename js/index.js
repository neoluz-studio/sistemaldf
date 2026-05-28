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

function ayerISOArgentina() {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return fechaISOArgentina(ayer);
}

function inicioSemanaISOArgentina() {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diferencia = dia === 0 ? 6 : dia - 1;

  hoy.setDate(hoy.getDate() - diferencia);

  return fechaISOArgentina(hoy);
}

function inicioMesISOArgentina() {
  const hoy = fechaISOArgentina(new Date()).split("-");
  return `${hoy[0]}-${hoy[1]}-01`;
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

function filtrarVentasPorPeriodo(lista = ventas) {
  const hoy = hoyISOArgentina();
  const inicioSemana = inicioSemanaISOArgentina();
  const inicioMes = inicioMesISOArgentina();

  if (filtroDashboard === "hoy") {
    return lista.filter(v => fechaISOArgentina(v.fecha) === hoy);
  }

  if (filtroDashboard === "semana") {
    return lista.filter(v => {
      const f = fechaISOArgentina(v.fecha);
      return f >= inicioSemana && f <= hoy;
    });
  }

  if (filtroDashboard === "mes") {
    return lista.filter(v => {
      const f = fechaISOArgentina(v.fecha);
      return f >= inicioMes && f <= hoy;
    });
  }

  return lista;
}

function filtrarDashboard(tipo) {
  filtroDashboard = tipo || "hoy";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  const btnActivo = document.querySelector(
    `.filter-btn[data-filter="${filtroDashboard}"]`
  );

  if (btnActivo) {
    btnActivo.classList.add("active");
  } else {
    const botones = document.querySelectorAll(".filter-btn");

    if (filtroDashboard === "hoy") botones[0]?.classList.add("active");
    if (filtroDashboard === "semana") botones[1]?.classList.add("active");
    if (filtroDashboard === "mes") botones[2]?.classList.add("active");
  }

  renderDashboardReal();
}

// =================================
// SUPABASE
// =================================

async function cargarDashboardSupabase() {
  const { data: productosData, error: productosError } =
    await supabaseClient
      .from("productos")
      .select("*")
      .eq("activo", true);

  if (productosError) {
    console.error(productosError);
  } else {
    productos = productosData || [];
    localStorage.setItem("productos", JSON.stringify(productos));
  }

  const { data: ventasData, error: ventasError } =
    await supabaseClient
      .from("ventas")
      .select("*")
      .order("fecha", { ascending: false });

  if (ventasError) {
    console.error(ventasError);
  } else {
    ventas = [];

    for (const venta of ventasData || []) {
      const { data: detalleData, error: detalleError } =
        await supabaseClient
          .from("venta_detalle")
          .select("*")
          .eq("venta_id", venta.id);

      if (detalleError) console.error(detalleError);

      ventas.push({
        id: venta.id,
        fecha: venta.fecha,
        fechaTexto: fechaHoraAR(venta.fecha),
        metodo: venta.metodo,
        subtotal: Number(venta.subtotal || 0),
        descuento: Number(venta.descuento_total || 0),
        total: Number(venta.total || 0),
        usuario: venta.usuario || "Local",
        detalle: detalleData || []
      });
    }

    localStorage.setItem("ventas", JSON.stringify(ventas));
  }

  const { data: cajaData, error: cajaError } =
    await supabaseClient
      .from("caja")
      .select("*");

  if (cajaError) {
    console.error(cajaError);
  } else {
    caja = cajaData || [];
    localStorage.setItem("caja", JSON.stringify(caja));
  }

  historial =
    JSON.parse(localStorage.getItem("historial")) || [];

  renderDashboardReal();
  renderInventarioSemanal();
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

  ventas.forEach(v => {
    const total = Number(v.total || 0);

    if (esHoy(v.fecha)) ventasHoy += total;
    if (esAyer(v.fecha)) ventasAyer += total;
  });

  ventasFiltradas.forEach(v => {
    const total = Number(v.total || 0);

    ventasPeriodo += total;

    if (Array.isArray(v.detalle)) {
      v.detalle.forEach(i => {
        const cantidad = Number(i.cantidad || 0);
        const precio = Number(i.precio || 0);
        const costo = Number(i.costo || 0);

        productosVendidos += cantidad;
        ganancia += (precio - costo) * cantidad;
      });
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

  setText("ventasHoy", formatMoney(ventasHoy));
  setText("ventasMes", formatMoney(ventasPeriodo));
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
    ventas.length
  );

  renderAlertasInteligentes(
    ventas,
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

  const ultimas = listaVentas.slice(0, 7).reverse();

  const labels = ultimas.map(v => fechaAR(v.fecha));
  const valores = ultimas.map(v => Number(v.total || 0));

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

  productos.sort(
    (a, b) => Number(a.stock || 0) - Number(b.stock || 0)
  );

  cont.innerHTML = productos
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