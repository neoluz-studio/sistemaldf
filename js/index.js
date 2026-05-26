// =================================
// DASHBOARD PRO V2 - LO DE FAUSTI
// =================================

let metodosChartInstance = null;
let ventasChartInstance = null;

// =================================
// HELPERS
// =================================

function getDataStorage(key) {
  return JSON.parse(
    localStorage.getItem(key)
  ) || [];
}

function formatMoney(value) {
  return `$${Number(
    value || 0
  ).toLocaleString("es-AR")}`;
}

function setText(id, value) {

  const el =
    document.getElementById(id);

  if (el) {
    el.innerText = value;
  }
}

function fechaAR(fecha) {

  return new Date(fecha)
    .toLocaleDateString(
      "es-AR"
    );
}

function esHoy(fecha) {

  return (
    fechaAR(fecha)

    ===

    new Date()
      .toLocaleDateString(
        "es-AR"
      )
  );
}

function esAyer(fecha) {

  const ayer = new Date();

  ayer.setDate(
    ayer.getDate() - 1
  );

  return (

    fechaAR(fecha)

    ===

    ayer.toLocaleDateString(
      "es-AR"
    )
  );
}

// =================================
// RENDER PRINCIPAL
// =================================

function renderDashboardReal() {

  const ventas =
    getDataStorage(
      "ventas"
    );

  const productos =
    getDataStorage(
      "productos"
    );

  const historial =
    getDataStorage(
      "historial"
    );

  const caja =
    getDataStorage(
      "caja"
    );

  let ventasHoy = 0;

  let ventasAyer = 0;

  let ventasMes = 0;

  let ganancia = 0;

  let productosVendidos = 0;

  const mesActual =
    new Date().getMonth();

  const anioActual =
    new Date().getFullYear();

  // =================================
  // RECORRER VENTAS
  // =================================

  ventas.forEach(v => {

    const fechaVenta =
      new Date(v.fecha);

    const total =
      Number(v.total || 0);

    // HOY
    if (esHoy(v.fecha)) {

      ventasHoy += total;
    }

    // AYER
    if (esAyer(v.fecha)) {

      ventasAyer += total;
    }

    // MES
    if (

      fechaVenta.getMonth()

      ===

      mesActual

      &&

      fechaVenta.getFullYear()

      ===

      anioActual

    ) {

      ventasMes += total;
    }

    // DETALLE
    if (
      Array.isArray(v.detalle)
    ) {

      v.detalle.forEach(i => {

        const cantidad =
          Number(
            i.cantidad || 0
          );

        const precio =
          Number(
            i.precio || 0
          );

        const costo =
          Number(
            i.costo || 0
          );

        productosVendidos +=
          cantidad;

        ganancia +=

          (precio - costo)

          *

          cantidad;
      });
    }
  });

  // =================================
  // STOCK
  // =================================

  const stockCritico =

    productos.filter(

      p =>

        Number(
          p.stock || 0
        ) <= 5

    ).length;

  const stockBajo =

    productos.filter(

      p =>

        Number(
          p.stock || 0
        ) > 5

        &&

        Number(
          p.stock || 0
        ) <= 10

    ).length;

  // =================================
  // SET TEXT
  // =================================

  setText(
    "ventasHoy",
    formatMoney(
      ventasHoy
    )
  );

  setText(
    "ventasMes",
    formatMoney(
      ventasMes
    )
  );

  setText(
    "gananciaTotal",
    formatMoney(
      Math.round(
        ganancia
      )
    )
  );

  setText(
    "productosVendidos",
    productosVendidos
  );

  setText(
    "cantidadStockCritico",
    stockCritico
  );

  setText(
    "cantidadStockBajo",
    stockBajo
  );

  setText(
    "cantidadVentas",
    ventas.length
  );

  setText(
    "cantidadProductos",
    productos.length
  );

  // =================================
  // RENDERS
  // =================================

  renderKpiTrends(
    ventasHoy,
    ventasAyer,
    stockCritico
  );

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

  renderTopProductos(
    ventas
  );

  renderActividadReciente(
    historial
  );

  renderStockCritico(
    productos
  );

  renderStockBajo(
    productos
  );

  renderUltimasVentas(
    ventas
  );

  renderMetodosChart(
    ventas
  );

  renderVentasChart(
    ventas
  );
}

// =================================
// KPI TRENDS
// =================================

function renderKpiTrends(

  ventasHoy,
  ventasAyer,
  stockCritico

) {

  const ventasCard =

    document
      .getElementById(
        "ventasHoy"
      )
      ?.parentElement;

  const stockCard =

    document
      .getElementById(
        "cantidadStockCritico"
      )
      ?.parentElement;

  // VENTAS
  if (

    ventasCard

    &&

    !ventasCard.querySelector(
      ".kpi-trend"
    )

  ) {

    ventasCard.insertAdjacentHTML(

      "beforeend",

      `
      <div
        id="trendVentas"
        class="kpi-trend neutral"
      ></div>
      `
    );
  }

  // STOCK
  if (

    stockCard

    &&

    !stockCard.querySelector(
      ".kpi-trend"
    )

  ) {

    stockCard.insertAdjacentHTML(

      "beforeend",

      `
      <div
        id="trendStock"
        class="kpi-trend neutral"
      ></div>
      `
    );
  }

  const trendVentas =
    document.getElementById(
      "trendVentas"
    );

  const trendStock =
    document.getElementById(
      "trendStock"
    );

  // VENTAS
  if (trendVentas) {

    if (

      ventasAyer === 0

      &&

      ventasHoy > 0

    ) {

      trendVentas.className =
        "kpi-trend up";

      trendVentas.innerText =
        "↑ Actividad iniciada hoy";

    } else if (

      ventasHoy > ventasAyer

    ) {

      const porcentaje =

        Math.round(

          (
            (
              ventasHoy
              -
              ventasAyer
            )

            /

            ventasAyer
          )

          *

          100
        );

      trendVentas.className =
        "kpi-trend up";

      trendVentas.innerText =

        `↑ ${porcentaje}% vs ayer`;

    } else if (

      ventasHoy < ventasAyer

    ) {

      trendVentas.className =
        "kpi-trend down";

      trendVentas.innerText =
        "↓ Menos ventas que ayer";

    } else {

      trendVentas.className =
        "kpi-trend neutral";

      trendVentas.innerText =
        "Sin cambios importantes";
    }
  }

  // STOCK
  if (trendStock) {

    if (stockCritico > 0) {

      trendStock.className =
        "kpi-trend down";

      trendStock.innerText =
        "⚠ Reponer urgente";

    } else {

      trendStock.className =
        "kpi-trend up";

      trendStock.innerText =
        "Stock controlado";
    }
  }
}

// =================================
// ESTADO NEGOCIO
// =================================

function renderEstadoNegocio(

  ventasHoy,
  stockCritico,
  cantidadVentas

) {

  const cont =
    document.getElementById(
      "estadoNegocio"
    );

  if (!cont) return;

  let estado =
    "Excelente";

  let clase =
    "status-good";

  let texto =

    "El negocio está funcionando correctamente.";

  if (

    stockCritico > 0

    ||

    ventasHoy === 0

  ) {

    estado =
      "Atención";

    clase =
      "status-warning";

    texto =

      "Hay situaciones importantes para revisar.";
  }

  if (

    stockCritico >= 3

    &&

    ventasHoy === 0

  ) {

    estado =
      "Crítico";

    clase =
      "status-danger";

    texto =

      "Revisar stock y actividad urgente.";
  }

  if (

    cantidadVentas === 0

  ) {

    estado =
      "Inicial";

    clase =
      "status-warning";

    texto =

      "Todavía no hay ventas registradas.";
  }

  cont.innerHTML = `

    <span>
      Estado del negocio
    </span>

    <h2>
      ${estado}
    </h2>

    <p>
      ${texto}
    </p>

    <div class="status-pill">

      <span
        class="status-dot ${clase}"
      ></span>

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

  const cont =
    document.getElementById(
      "alertasInteligentes"
    );

  if (!cont) return;

  const alertas = [];

  const productosSinStock =

    productos.filter(

      p =>

        Number(
          p.stock || 0
        ) <= 0
    );

  const cajaAbiertaHoy =

    caja.some(c =>

      c.tipo === "apertura"

      &&

      c.fecha

      &&

      esHoy(c.fecha)
    );

  // SIN VENTAS
  if (ventasHoy === 0) {

    alertas.push({

      tipo:
        "warning",

      icono:
        "fa-chart-line",

      titulo:
        "No hubo ventas hoy",

      texto:
        "Revisar actividad comercial."
    });
  }

  // STOCK CRITICO
  if (stockCritico > 0) {

    alertas.push({

      tipo:
        "danger",

      icono:
        "fa-box-open",

      titulo:

        `${stockCritico} productos críticos`,

      texto:
        "Hay productos debajo del mínimo."
    });
  }

  // SIN STOCK
  if (

    productosSinStock.length > 0

  ) {

    alertas.push({

      tipo:
        "danger",

      icono:
        "fa-triangle-exclamation",

      titulo:

        `${productosSinStock.length} productos agotados`,

      texto:
        "No deberían venderse."
    });
  }

  // CAJA
  if (!cajaAbiertaHoy) {

    alertas.push({

      tipo:
        "warning",

      icono:
        "fa-cash-register",

      titulo:
        "Caja no abierta",

      texto:
        "Abrí caja para iniciar el día."
    });
  }

  // TODO OK
  if (

    alertas.length === 0

  ) {

    alertas.push({

      tipo:
        "success",

      icono:
        "fa-circle-check",

      titulo:
        "Todo bajo control",

      texto:
        "No hay alertas importantes."
    });
  }

  cont.innerHTML =

    alertas.map(a => `

      <div
        class="alert-card ${a.tipo}"
      >

        <i
          class="fa-solid ${a.icono}"
        ></i>

        <div>

          <strong>
            ${a.titulo}
          </strong>

          <p>
            ${a.texto}
          </p>

        </div>

      </div>
    `).join("");
}

// =================================
// TOP PRODUCTOS
// =================================

function renderTopProductos(
  ventas
) {

  const cont =
    document.getElementById(
      "topProductos"
    );

  if (!cont) return;

  const ranking = {};

  ventas.forEach(v => {

    if (
      !Array.isArray(
        v.detalle
      )
    ) return;

    v.detalle.forEach(item => {

      const nombre =

        item.nombre
        ||
        item.producto
        ||
        "Producto";

      const cantidad =

        Number(
          item.cantidad || 0
        );

      if (!ranking[nombre]) {

        ranking[nombre] = 0;
      }

      ranking[nombre] +=
        cantidad;
    });
  });

  const top =

    Object.entries(
      ranking
    )

    .sort(
      (a, b) => b[1] - a[1]
    )

    .slice(0, 5);

  if (top.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">

        Todavía no hay productos vendidos

      </div>
    `;

    return;
  }

  const max =
    top[0][1];

  const medallas = [

    "🥇",
    "🥈",
    "🥉",
    "⭐",
    "🔥"
  ];

  cont.innerHTML =

    top.map(

      ([nombre, cantidad], index) => {

        const porcentaje =

          Math.max(

            8,

            Math.round(

              (
                cantidad
                /
                max
              )

              *

              100
            )
          );

        return `

          <div class="top-product-item">

            <div class="top-medal">

              ${medallas[index]}

            </div>

            <div class="top-product-info">

              <h4>
                ${nombre}
              </h4>

              <div class="top-bar">

                <span
                  style="width:${porcentaje}%"
                ></span>

              </div>

            </div>

            <div class="top-product-total">

              ${cantidad}

            </div>

          </div>
        `;
      }

    ).join("");
}

// =================================
// ACTIVIDAD RECIENTE
// =================================

function renderActividadReciente(
  historial
) {

  const cont =

    document.getElementById(
      "actividadReciente"
    );

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

        .map(h => `

          <div class="timeline-item">

            <h4>

              ${h.modulo || "Sistema"}

            </h4>

            <p>

              ${h.descripcion || "-"}

            </p>

            <small>

              ${h.fecha || "-"}

            </small>

          </div>

        `).join("")}

    </div>
  `;
}

// =================================
// STOCK CRITICO
// =================================

function renderStockCritico(
  productos
) {

  const cont =

    document.getElementById(
      "stockCritico"
    );

  if (!cont) return;

  const criticos =

    productos.filter(

      p =>

        Number(
          p.stock || 0
        ) <= 5
    );

  if (criticos.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">

        Sin stock crítico

      </div>
    `;

    return;
  }

  cont.innerHTML =

    criticos.map(p => `

      <div class="stock-item critical">

        <strong>

          ${p.nombre}

        </strong>

        <span>

          Stock:
          ${p.stock}

        </span>

      </div>
    `).join("");
}

// =================================
// STOCK BAJO
// =================================

function renderStockBajo(
  productos
) {

  const cont =

    document.getElementById(
      "stockBajo"
    );

  if (!cont) return;

  const bajos =

    productos.filter(

      p =>

        Number(
          p.stock || 0
        ) > 5

        &&

        Number(
          p.stock || 0
        ) <= 10
    );

  if (bajos.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">

        Sin stock bajo

      </div>
    `;

    return;
  }

  cont.innerHTML =

    bajos.map(p => `

      <div class="stock-item low">

        <strong>

          ${p.nombre}

        </strong>

        <span>

          Stock:
          ${p.stock}

        </span>

      </div>
    `).join("");
}

// =================================
// ULTIMAS VENTAS
// =================================

function renderUltimasVentas(
  ventas
) {

  const cont =

    document.getElementById(
      "ultimasVentas"
    );

  if (!cont) return;

  if (ventas.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">

        Sin ventas registradas

      </div>
    `;

    return;
  }

  cont.innerHTML =

    [...ventas]

      .reverse()

      .slice(0, 6)

      .map(v => `

        <div class="movement-card">

          <div>

            <h4>

              ${v.fecha || "-"}

            </h4>

            <p>

              ${v.usuario || "Local"}

              ·

              ${v.metodo || "-"}

            </p>

          </div>

          <strong>

            ${formatMoney(v.total)}

          </strong>

        </div>
      `).join("");
}

// =================================
// CHART METODOS
// =================================

function renderMetodosChart(
  ventas
) {

  const canvas =

    document.getElementById(
      "metodosChart"
    );

  if (
    !canvas
    ||
    typeof Chart ===
    "undefined"
  ) return;

  if (
    metodosChartInstance
  ) {

    metodosChartInstance.destroy();
  }

  const data = {

    efectivo: 0,

    transferencia: 0,

    mp: 0,

    qr: 0
  };

  ventas.forEach(v => {

    if (

      data[v.metodo]

      !==

      undefined

    ) {

      data[v.metodo] +=

        Number(
          v.total || 0
        );
    }
  });

  metodosChartInstance =

    new Chart(canvas, {

      type: "doughnut",

      data: {

        labels: [

          "Efectivo",

          "Transferencia",

          "MP",

          "QR"
        ],

        datasets: [{

          data: [

            data.efectivo,

            data.transferencia,

            data.mp,

            data.qr
          ],

          borderWidth: 0,

          hoverOffset: 12
        }]
      },

      options: {

        responsive: true,

        cutout: "68%",

        plugins: {

          legend: {

            position: "bottom",

            labels: {

              usePointStyle: true,

              font: {

                weight: "bold"
              }
            }
          },

          tooltip: {

            callbacks: {

              label: ctx =>

                `${ctx.label}: ${formatMoney(ctx.raw)}`
            }
          }
        }
      }
    });
}

// =================================
// CHART VENTAS
// =================================

function renderVentasChart(
  ventas
) {

  const canvas =

    document.getElementById(
      "ventasChart"
    );

  if (
    !canvas
    ||
    typeof Chart ===
    "undefined"
  ) return;

  if (
    ventasChartInstance
  ) {

    ventasChartInstance.destroy();
  }

  const ctx =
    canvas.getContext("2d");

  const gradient =

    ctx.createLinearGradient(
      0,
      0,
      0,
      280
    );

  gradient.addColorStop(
    0,
    "rgba(37,99,235,.30)"
  );

  gradient.addColorStop(
    1,
    "rgba(37,99,235,0)"
  );

  const ultimas =

    [...ventas]

      .reverse()

      .slice(0, 7)

      .reverse();

  const labels =

    ultimas.map(v =>

      v.fecha
      ?
      fechaAR(v.fecha)
      :
      "-"
    );

  const valores =

    ultimas.map(v =>

      Number(
        v.total || 0
      )
    );

  ventasChartInstance =

    new Chart(canvas, {

      type: "line",

      data: {

        labels,

        datasets: [{

          label: "Ventas",

          data: valores,

          tension: .45,

          fill: true,

          backgroundColor:
            gradient,

          borderWidth: 3,

          pointRadius: 5,

          pointHoverRadius: 7
        }]
      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {

            display: false
          },

          tooltip: {

            callbacks: {

              label: ctx =>

                `Ventas: ${formatMoney(ctx.raw)}`
            }
          }
        },

        scales: {

          y: {

            beginAtZero: true,

            ticks: {

              callback: value =>

                formatMoney(value)
            },

            grid: {

              color:
                "rgba(15,23,42,.06)"
            }
          },

          x: {

            grid: {

              display: false
            }
          }
        }
      }
    });
}

// =================================
// INVENTARIO
// =================================

function renderInventarioSemanal() {

  const cont =

    document.getElementById(
      "inventarioSemanal"
    );

  if (!cont) return;

  const productos =
    getDataStorage(
      "productos"
    );

  if (productos.length === 0) {

    cont.innerHTML = `

      <tr>

        <td colspan="3">

          No hay productos

        </td>

      </tr>
    `;

    return;
  }

  productos.sort(

    (a, b) =>

      Number(a.stock || 0)

      -

      Number(b.stock || 0)
  );

  cont.innerHTML =

    productos.map(p => {

      const stock =

        Number(
          p.stock || 0
        );

      const estado =

        stock <= 5

        ? `
          <span class="stock-low">
            CRÍTICO
          </span>
        `

        : `
          <span class="stock-ok">
            CORRECTO
          </span>
        `;

      return `

        <tr>

          <td>

            ${p.nombre}

          </td>

          <td>

            ${p.stock}

          </td>

          <td>

            ${estado}

          </td>

        </tr>
      `;
    }).join("");
}

// =================================
// FILTROS
// =================================

function filtrarDashboard(
  tipo
) {

  document

    .querySelectorAll(
      ".filter-btn"
    )

    .forEach(btn =>

      btn.classList.remove(
        "active"
      )
    );

  const botones =

    document.querySelectorAll(
      ".filter-btn"
    );

  if (tipo === "hoy") {

    botones[0]
      ?.classList.add(
        "active"
      );
  }

  if (tipo === "semana") {

    botones[1]
      ?.classList.add(
        "active"
      );
  }

  if (tipo === "mes") {

    botones[2]
      ?.classList.add(
        "active"
      );
  }

  renderDashboardReal();
}

// =================================
// INIT
// =================================

document.addEventListener(

  "DOMContentLoaded",

  () => {

    renderDashboardReal();

    renderInventarioSemanal();
  }
);