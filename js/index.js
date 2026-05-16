// =================================
// STORAGE
// =================================

const ventas =
  JSON.parse(
    localStorage.getItem("ventas")
  ) || [];

const productos =
  JSON.parse(
    localStorage.getItem("productos")
  ) || [];

// =================================
// TOTALES
// =================================

const totalVentas =
  ventas.reduce(
    (acc, v) => acc + v.total,
    0
  );

const totalGanancia =
  ventas.reduce(
    (acc, v) =>
      acc + (v.ganancia || 0),
    0
  );

const totalProductos =
  productos.length;

// =================================
// PRODUCTO MÁS VENDIDO
// =================================

function getTopProducto() {

  const contador = {};

  ventas.forEach(v => {

    v.detalle?.forEach(item => {

      contador[item.nombre] =

        (contador[item.nombre] || 0)

        + item.cantidad;
    });
  });

  let top = "-";

  let max = 0;

  for (let nombre in contador) {

    if (contador[nombre] > max) {

      max = contador[nombre];

      top = nombre;
    }
  }

  return top;
}

// =================================
// DASHBOARD
// =================================

function renderDashboard() {

  document.getElementById(
    "totalVentas"
  ).innerText =
    totalVentas.toLocaleString();

  document.getElementById(
    "totalGanancia"
  ).innerText =
    totalGanancia.toLocaleString();

  document.getElementById(
    "totalProductos"
  ).innerText =
    totalProductos;

  const topEl =
    document.getElementById(
      "topProducto"
    );

  if (topEl) {

    topEl.innerText =
      getTopProducto();
  }
}

// =================================
// ACTIVIDAD
// =================================

function renderActividad() {

  const cont =
    document.getElementById(
      "actividadReciente"
    );

  if (!cont) return;

  cont.innerHTML = "";

  const recientes =
    [...ventas]
      .reverse()
      .slice(0, 5);

  if (recientes.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">
        Sin actividad reciente
      </div>
    `;

    return;
  }

  recientes.forEach(v => {

    cont.innerHTML += `

      <div class="movement-card">

        <div>

          <h4>

            Venta
            ${v.metodo}

          </h4>

          <small>

            ${v.fecha}

          </small>

        </div>

        <strong class="money-in">

          +$${v.total.toLocaleString()}

        </strong>

      </div>
    `;
  });
}

// =================================
// STOCK BAJO
// =================================

function renderStockBajo() {

  const cont =
    document.getElementById(
      "stockBajo"
    );

  if (!cont) return;

  cont.innerHTML = "";

  const bajos =
    productos.filter(
      p => p.stock <= 5
    );

  if (bajos.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">
        No hay stock bajo
      </div>
    `;

    return;
  }

  bajos.forEach(p => {

    cont.innerHTML += `

      <div class="movement-card">

        <div>

          <h4>
            ${p.nombre}
          </h4>

          <small>
            Stock bajo
          </small>

        </div>

        <span class="badge-danger">

          ${p.stock}
          ${p.unidad || ""}

        </span>

      </div>
    `;
  });
}

// =================================
// STOCK CRÍTICO
// =================================

function renderStockCritico() {

  const cont =
    document.getElementById(
      "stockCritico"
    );

  if (!cont) return;

  cont.innerHTML = "";

  const criticos =
    productos.filter(
      p => p.stock <= 2
    );

  if (criticos.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">
        Sin productos críticos
      </div>
    `;

    return;
  }

  criticos.forEach(p => {

    cont.innerHTML += `

      <div class="movement-card">

        <div>

          <h4>
            ${p.nombre}
          </h4>

          <small>
            Stock crítico
          </small>

        </div>

        <span class="badge-danger">

          ${p.stock}

        </span>

      </div>
    `;
  });
}

// =================================
// ÚLTIMAS VENTAS
// =================================

function renderUltimasVentas() {

  const cont =
    document.getElementById(
      "ultimasVentas"
    );

  if (!cont) return;

  cont.innerHTML = "";

  const ultimas =
    [...ventas]
      .reverse()
      .slice(0, 5);

  if (ultimas.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">
        No hay ventas
      </div>
    `;

    return;
  }

  ultimas.forEach(v => {

    cont.innerHTML += `

      <div class="movement-card">

        <div>

          <h4>

            $${v.total.toLocaleString()}

          </h4>

          <p>

            ${v.metodo}

          </p>

        </div>

        <small>

          ${v.fecha}

        </small>

      </div>
    `;
  });
}

// =================================
// CHART VENTAS
// =================================

function renderVentasChart() {

  const ctx =
    document.getElementById(
      "ventasChart"
    );

  if (!ctx) return;

  const ventasPorMes = {};

  ventas.forEach(v => {

    const partes =
      v.fecha.split("/");

    const mes =
      partes[1] || "Mes";

    ventasPorMes[mes] =

      (ventasPorMes[mes] || 0)

      + v.total;
  });

  new Chart(ctx, {

    type: "bar",

    data: {

      labels:
        Object.keys(ventasPorMes),

      datasets: [{

        label: "Ventas",

        data:
          Object.values(ventasPorMes),

        borderRadius: 12
      }]
    },

    options: {

      responsive: true,

      plugins: {

        legend: {

          display: false
        }
      }
    }
  });
}

// =================================
// CHART MÉTODOS
// =================================

function renderMetodosChart() {

  const ctx =
    document.getElementById(
      "metodosChart"
    );

  if (!ctx) return;

  const metodos = {};

  ventas.forEach(v => {

    metodos[v.metodo] =

      (metodos[v.metodo] || 0)

      + v.total;
  });

  new Chart(ctx, {

    type: "doughnut",

    data: {

      labels:
        Object.keys(metodos),

      datasets: [{

        data:
          Object.values(metodos)
      }]
    },

    options: {

      responsive: true
    }
  });
}

// =================================
// CLOCK
// =================================

function updateClock() {

  const clock =
    document.getElementById(
      "clock"
    );

  if (!clock) return;

  clock.innerText =
    new Date()
      .toLocaleTimeString([], {

        hour: "2-digit",

        minute: "2-digit"
      });
}

setInterval(updateClock, 1000);

updateClock();

// =================================
// SALUDO
// =================================

function renderSaludo() {

  const saludo =
    document.getElementById(
      "saludo"
    );

  if (!saludo) return;

  const hora =
    new Date().getHours();

  let texto =
    "👋 Bienvenido";

  if (hora < 12) {

    texto =
      "☀️ Buenos días";
  }

  else if (hora < 19) {

    texto =
      "🌤️ Buenas tardes";
  }

  else {

    texto =
      "🌙 Buenas noches";
  }

  saludo.innerText =
    texto;
}

// =================================
// INIT
// =================================

renderDashboard();

renderActividad();

renderStockBajo();

renderStockCritico();

renderUltimasVentas();

renderVentasChart();

renderMetodosChart();

renderSaludo();