// =================================
// DASHBOARD PRO
// =================================

function renderDashboardReal() {

  const ventas =

    JSON.parse(
      localStorage.getItem(
        "ventas"
      )
    ) || [];

  const productos =

    JSON.parse(
      localStorage.getItem(
        "productos"
      )
    ) || [];

  const historial =

    JSON.parse(
      localStorage.getItem(
        "historial"
      )
    ) || [];

  const hoy =

    new Date()
      .toLocaleDateString(
        "es-AR"
      );

  const mesActual =

    new Date()
      .getMonth();

  let ventasHoy = 0;

  let ventasMes = 0;

  let ganancia = 0;

  let productosVendidos = 0;

  let stockCritico = 0;

  let stockBajo = 0;

  // =================================
  // VENTAS
  // =================================

  ventas.forEach(v => {

    const fechaVenta =

      new Date(v.fecha);

    const fechaTexto =

      fechaVenta
        .toLocaleDateString(
          "es-AR"
        );

    // HOY
    if (fechaTexto === hoy) {

      ventasHoy +=
        Number(v.total || 0);
    }

    // MES
    if (

      fechaVenta.getMonth()

      ===

      mesActual

    ) {

      ventasMes +=
        Number(v.total || 0);
    }

    // PRODUCTOS
    if (v.detalle) {

      v.detalle.forEach(i => {

        productosVendidos +=

          Number(
            i.cantidad || 0
          );

        const costo =

          Number(
            i.costo || 0
          );

        const precio =

          Number(
            i.precio || 0
          );

        ganancia +=

          (precio - costo)

          *

          Number(
            i.cantidad || 0
          );
      });
    }
  });

  // =================================
  // STOCK
  // =================================

  productos.forEach(p => {

    if (p.stock <= 5) {

      stockCritico++;

    } else if (

      p.stock <= 10

    ) {

      stockBajo++;
    }
  });

  // =================================
  // SET TEXT
  // =================================

  const set = (

    id,
    value

  ) => {

    const el =

      document.getElementById(
        id
      );

    if (el) {

      el.innerText = value;
    }
  };

  set(
    "ventasHoy",
    `$${ventasHoy.toLocaleString()}`
  );

  set(
    "ventasMes",
    `$${ventasMes.toLocaleString()}`
  );

  set(
    "gananciaTotal",
    `$${Math.round(
      ganancia
    ).toLocaleString()}`
  );

  set(
    "productosVendidos",
    productosVendidos
  );

  set(
    "cantidadStockCritico",
    stockCritico
  );

  set(
    "cantidadStockBajo",
    stockBajo
  );

  set(
    "cantidadVentas",
    ventas.length
  );

  set(
    "cantidadProductos",
    productos.length
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
// ACTIVIDAD
// =================================

function renderActividadReciente(
  historial
) {

  const cont =

    document.getElementById(
      "actividadReciente"
    );

  if (!cont) return;

  cont.innerHTML = "";

  if (historial.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">
        Sin actividad reciente
      </div>
    `;

    return;
  }

  historial
    .slice(0, 6)
    .forEach(h => {

      cont.innerHTML += `

        <div class="movement-card">

          <div>

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

        </div>
      `;
    });
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

  cont.innerHTML = "";

  const criticos =

    productos.filter(
      p => p.stock <= 5
    );

  if (criticos.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">

        Sin stock crítico

      </div>
    `;

    return;
  }

  criticos.forEach(p => {

    cont.innerHTML += `

      <div class="stock-item critical">

        <strong>

          ${p.nombre}

        </strong>

        <span>

          Stock:
          ${p.stock}

        </span>

      </div>
    `;
  });
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

  cont.innerHTML = "";

  const bajos =

    productos.filter(

      p =>

        p.stock > 5 &&

        p.stock <= 10
    );

  if (bajos.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">

        Sin stock bajo

      </div>
    `;

    return;
  }

  bajos.forEach(p => {

    cont.innerHTML += `

      <div class="stock-item low">

        <strong>

          ${p.nombre}

        </strong>

        <span>

          Stock:
          ${p.stock}

        </span>

      </div>
    `;
  });
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

  cont.innerHTML = "";

  if (ventas.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">

        Sin ventas registradas

      </div>
    `;

    return;
  }

  [...ventas]
    .reverse()
    .slice(0, 6)
    .forEach(v => {

      cont.innerHTML += `

        <div class="movement-card">

          <div>

            <h4>

              ${v.fecha || "-"}

            </h4>

            <p>

              ${v.usuario || "Local"}

            </p>

          </div>

          <strong>

            $${Number(
              v.total || 0
            ).toLocaleString()}

          </strong>

        </div>
      `;
    });
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

  if (!canvas) return;

  const data = {

    efectivo: 0,

    transferencia: 0,

    mp: 0,

    qr: 0
  };

  ventas.forEach(v => {

    if (
      data[v.metodo]
      !== undefined
    ) {

      data[v.metodo] +=

        Number(v.total || 0);
    }
  });

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
        ]
      }]
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

  if (!canvas) return;

  const labels =

    [...ventas]
      .reverse()
      .slice(0, 7)
      .map(v => v.fecha);

  const valores =

    [...ventas]
      .reverse()
      .slice(0, 7)
      .map(v => v.total);

  new Chart(canvas, {

    type: "line",

    data: {

      labels,

      datasets: [{

        label: "Ventas",

        data: valores,

        tension: .4
      }]
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

    JSON.parse(
      localStorage.getItem(
        "productos"
      )
    ) || [];

  cont.innerHTML = "";

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
      a.stock - b.stock
  );

  productos.forEach(p => {

    const estado =

      p.stock <= 5

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

    cont.innerHTML += `

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
  });
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

    .forEach(btn => {

      btn.classList.remove(
        "active"
      );
    });

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

renderDashboardReal();

renderInventarioSemanal();