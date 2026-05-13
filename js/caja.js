// =================================
// CAJA
// =================================

let caja =
  JSON.parse(
    localStorage.getItem("caja")
  ) || [];

// =================================
// APERTURAS
// =================================

let aperturas =
  JSON.parse(
    localStorage.getItem(
      "aperturasCaja"
    )
  ) || [];

// =================================
// GUARDAR
// =================================

function guardar() {

  localStorage.setItem(
    "caja",
    JSON.stringify(caja)
  );
}

// =================================
// REGISTRAR MOVIMIENTO
// =================================

function registrarMovimiento() {

  const tipo =
    document.getElementById("tipo").value;

  const monto =
    Number(
      document.getElementById("monto").value
    );

  const motivo =
    document.getElementById("motivo").value;

  if (!monto || !motivo) {

    showToast(
      "Completá los datos",
      "error"
    );

    return;
  }

  caja.push({

    id: Date.now(),

    tipo,

    monto,

    motivo,

    fecha:
      new Date().toLocaleString()
  });

  guardar();

  render();

  renderResumenCaja();

  showToast(
    "Movimiento registrado",
    "success"
  );

  document.getElementById("monto").value = "";

  document.getElementById("motivo").value = "";
}

// =================================
// ABRIR CAJA
// =================================

function abrirCaja() {

  const monto =
    Number(
      document.getElementById(
        "montoInicial"
      ).value
    );

  if (!monto) {

    showToast(
      "Ingresá un monto",
      "error"
    );

    return;
  }

  aperturas.push({

    id: Date.now(),

    tipo: "apertura",

    monto,

    usuario:
      localStorage.getItem(
        "usuarioActual"
      ),

    fecha:
      new Date().toLocaleString()
  });

  localStorage.setItem(
    "aperturasCaja",
    JSON.stringify(aperturas)
  );

  caja.push({

    id: Date.now(),

    tipo: "ingreso",

    monto,

    motivo: "Apertura de caja",

    fecha:
      new Date().toLocaleString()
  });

  guardar();

  render();

  renderResumenCaja();

  showToast(
    "Caja abierta",
    "success"
  );

  document.getElementById(
    "montoInicial"
  ).value = "";
}

// =================================
// CERRAR CAJA
// =================================

function cerrarCaja() {

  const monto =
    Number(
      document.getElementById(
        "montoCierre"
      ).value
    );

  if (!monto) {

    showToast(
      "Ingresá un monto",
      "error"
    );

    return;
  }

  aperturas.push({

    id: Date.now(),

    tipo: "cierre",

    monto,

    usuario:
      localStorage.getItem(
        "usuarioActual"
      ),

    fecha:
      new Date().toLocaleString()
  });

  localStorage.setItem(
    "aperturasCaja",
    JSON.stringify(aperturas)
  );

  caja.push({

    id: Date.now(),

    tipo: "egreso",

    monto,

    motivo: "Cierre de caja",

    fecha:
      new Date().toLocaleString()
  });

  guardar();

  render();

  renderResumenCaja();

  showToast(
    "Caja cerrada",
    "info"
  );

  document.getElementById(
    "montoCierre"
  ).value = "";
}

// =================================
// RESUMEN
// =================================

function renderResumenCaja() {

  const ingresos =
    caja
      .filter(m => m.tipo === "ingreso")
      .reduce(
        (acc, m) => acc + m.monto,
        0
      );

  const egresos =
    caja
      .filter(m => m.tipo === "egreso")
      .reduce(
        (acc, m) => acc + m.monto,
        0
      );

  const saldo =
    ingresos - egresos;

  document.getElementById(
    "totalIngresos"
  ).innerText =
    `$${ingresos.toLocaleString()}`;

  document.getElementById(
    "totalEgresos"
  ).innerText =
    `$${egresos.toLocaleString()}`;

  document.getElementById(
    "saldoActual"
  ).innerText =
    `$${saldo.toLocaleString()}`;
}

// =================================
// RENDER
// =================================

function render() {

  const cont =
    document.getElementById(
      "listaCaja"
    );

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

  [...caja]
    .reverse()
    .forEach(m => {

      const div =
        document.createElement("div");

      div.className = `
        movement-card
        ${m.tipo}
      `;

      div.innerHTML = `

        <div>

          <span class="
            ${m.tipo === "ingreso"
              ? "badge-success"
              : "badge-danger"}
          ">

            ${m.tipo.toUpperCase()}

          </span>

          <h4>
            ${m.motivo}
          </h4>

          <small>
            ${m.fecha}
          </small>

        </div>

        <strong class="
          ${m.tipo === "ingreso"
            ? "money-in"
            : "money-out"}
        ">

          ${m.tipo === "ingreso"
            ? "+"
            : "-"}

          $${m.monto.toLocaleString()}

        </strong>
      `;

      cont.appendChild(div);
    });
}

// =================================
// INIT
// =================================

render();

renderResumenCaja();
// =================================
// LIMPIAR CAJA
// =================================

function limpiarCaja() {

  showConfirm({

    title: "Limpiar caja",

    message:
      "Se eliminarán todos los movimientos.",

    onConfirm: () => {

      // VACIAR
      caja = [];

      // GUARDAR
      guardar();

      // RENDER
      render();

      // RESUMEN
      renderResumenCaja();

      // RESET VISUAL
      document.getElementById(
        "totalIngresos"
      ).innerText = "$0";

      document.getElementById(
        "totalEgresos"
      ).innerText = "$0";

      document.getElementById(
        "saldoActual"
      ).innerText = "$0";

      showToast(
        "Caja limpiada",
        "info"
      );
    }
  });
}