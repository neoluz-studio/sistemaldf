let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
let productos = JSON.parse(localStorage.getItem("productos")) || [];

// ==========================
// TOTALES
// ==========================

const totalVentas = ventas.reduce((acc, v) => acc + v.total, 0);

const totalGanancia = ventas.reduce((acc, v) => {
  return acc + (v.ganancia || 0);
}, 0);

const totalProductos = productos.length;

// ==========================
// PRODUCTO MÁS VENDIDO
// ==========================

const contadorProductos = {};

ventas.forEach(v => {
  v.detalle?.forEach(item => {
    contadorProductos[item.nombre] =
      (contadorProductos[item.nombre] || 0) + item.cantidad;
  });
});

let topProducto = "-";
let maxVentas = 0;

for (let producto in contadorProductos) {
  if (contadorProductos[producto] > maxVentas) {
    maxVentas = contadorProductos[producto];
    topProducto = producto;
  }
}

// ==========================
// STOCK BAJO
// ==========================

const stockBajo = productos.filter(p => p.stock <= 3);

// ==========================
// RENDER DASHBOARD
// ==========================

document.getElementById("totalVentas").innerText =
  totalVentas.toLocaleString();

document.getElementById("totalGanancia").innerText =
  totalGanancia.toLocaleString();

document.getElementById("totalProductos").innerText =
  totalProductos;

const topProductoEl = document.getElementById("topProducto");

if (topProductoEl) {
  topProductoEl.innerText = topProducto;
}

// ==========================
// RENDER STOCK BAJO
// ==========================

const stockBajoEl = document.getElementById("stockBajo");

if (stockBajoEl) {

  if (stockBajo.length === 0) {
    stockBajoEl.innerHTML = `
      <div class="empty-state">
        No hay productos con stock bajo
      </div>
    `;
  } else {

    stockBajo.forEach(p => {

      stockBajoEl.innerHTML += `
        <div class="movement-card">
          <div>
            <h4>${p.nombre}</h4>
            <small>Stock crítico</small>
          </div>

          <span class="badge-danger">
            ${p.stock} ${p.unidad || ""}
          </span>
        </div>
      `;
    });
  }
}

// ==========================
// GRÁFICO VENTAS POR MES
// ==========================

const ventasPorMes = {};

ventas.forEach(v => {

  const partes = v.fecha.split("/");

  const mes = partes[1] || "Mes";

  ventasPorMes[mes] =
    (ventasPorMes[mes] || 0) + v.total;
});

const ctx = document.getElementById("ventasChart");

if (ctx) {

  new Chart(ctx, {
    type: "bar",

    data: {
      labels: Object.keys(ventasPorMes),

      datasets: [{
        label: "Ventas",

        data: Object.values(ventasPorMes),

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

// ==========================
// GRÁFICO MÉTODOS DE PAGO
// ==========================

const metodos = {};

ventas.forEach(v => {
  metodos[v.metodo] =
    (metodos[v.metodo] || 0) + v.total;
});

const metodoCtx = document.getElementById("metodosChart");

if (metodoCtx) {

  new Chart(metodoCtx, {

    type: "doughnut",

    data: {
      labels: Object.keys(metodos),

      datasets: [{
        data: Object.values(metodos)
      }]
    },

    options: {
      responsive: true
    }
  });
}
// =========================
// ACTIVIDAD RECIENTE
// =========================

function renderActividad() {

  const cont =
    document.getElementById("actividadReciente");

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
            Venta ${v.metodo}
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

// =========================
// STOCK BAJO
// =========================

function renderStockCritico() {

  const cont =
    document.getElementById("stockBajo");

  if (!cont) return;

  cont.innerHTML = "";

  const bajos =
    productos.filter(p => p.stock <= 5);

  if (bajos.length === 0) {

    cont.innerHTML = `
      <div class="empty-state">
        No hay stock crítico
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
        </span>

      </div>
    `;
  });
}

// =========================
// INIT EXTRA
// =========================

renderActividad();

renderStockCritico();