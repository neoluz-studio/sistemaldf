let caja = JSON.parse(localStorage.getItem("caja")) || [];

// =========================
// GUARDAR
// =========================

function guardar() {
  localStorage.setItem("caja", JSON.stringify(caja));
}

// =========================
// REGISTRAR
// =========================

function registrarMovimiento() {

  const tipo =
    document.getElementById("tipo").value;

  const monto =
    Number(document.getElementById("monto").value);

  const motivo =
    document.getElementById("motivo").value;

  // VALIDACION
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

    fecha: new Date().toLocaleString()
  });

  guardar();

  limpiar();

  render();

  // TOAST
  showToast(
    "Movimiento registrado"
  );
}

// =========================
// LIMPIAR
// =========================
// =========================
// LIMPIAR CAJA
// =========================

function limpiarCaja() {

  showConfirm({

    title: "Limpiar movimientos",

    message:
      "Se eliminarán todos los movimientos de caja.",

    onConfirm: () => {

      caja = [];

      guardar();

      render();

      showToast(
        "Caja reiniciada",
        "info"
      );
    }
  });
}
function limpiar() {

  document.getElementById("monto").value = "";

  document.getElementById("motivo").value = "";
}

// =========================
// RENDER
// =========================

function render() {

  const cont =
    document.getElementById("listaCaja");

  const saldoEl =
    document.getElementById("saldo");

  cont.innerHTML = "";

  let saldo = 0;

  // CALCULAR SALDO TOTAL
  caja.forEach(m => {

    saldo +=
      m.tipo === "ingreso"
        ? m.monto
        : -m.monto;
  });

  // RENDER SALDO
 saldoEl.innerText =
  (saldo + aperturaCaja)
    .toLocaleString();
  // VACIO
  if (caja.length === 0) {

    cont.innerHTML = `
      <div class="empty-state">
        No hay movimientos registrados
      </div>
    `;

    return;
  }

  // MÁS NUEVOS ARRIBA
  [...caja]
    .reverse()
    .forEach(m => {

      const div =
        document.createElement("div");

      div.className =
        "movement-card fade-in";

      div.innerHTML = `

        <div>

          <span class="${
            m.tipo === "ingreso"
              ? "badge-success"
              : "badge-danger"
          }">

            ${m.tipo.toUpperCase()}

          </span>

          <h4>
            ${m.motivo}
          </h4>

          <small>
            ${m.fecha}
          </small>

        </div>

        <strong class="${
          m.tipo === "ingreso"
            ? "money-in"
            : "money-out"
        }">

          ${m.tipo === "ingreso"
            ? "+"
            : "-"
          }

          $${m.monto.toLocaleString()}

        </strong>
      `;

      cont.appendChild(div);
  });
}

// =========================
// INIT
// =========================

render();

// =========================
// APERTURA
// =========================

let aperturaCaja =
  Number(
    localStorage.getItem("aperturaCaja")
  ) || 0;

function abrirCaja() {

  const monto =
    Number(
      document.getElementById("aperturaInput").value
    );

  if (!monto) {

    showToast(
      "Ingresá un monto",
      "error"
    );

    return;
  }

  aperturaCaja = monto;

  localStorage.setItem(
    "aperturaCaja",
    monto
  );

  renderCajaStats();

  showToast(
    "Caja abierta correctamente"
  );
}

// =========================
// CIERRE
// =========================

function cerrarCaja() {

  const contado =
    Number(
      document.getElementById("cierreReal").value
    );

  if (!contado) {

    showToast(
      "Ingresá el monto contado",
      "error"
    );

    return;
  }

  let saldo = 0;

  caja.forEach(m => {

    saldo +=
      m.tipo === "ingreso"
        ? m.monto
        : -m.monto;
  });

  saldo += aperturaCaja;

  const diferencia =
    contado - saldo;

  document.getElementById(
    "diferenciaCaja"
  ).innerText =
    "$" + diferencia.toLocaleString();

  showToast(
    "Caja cerrada"
  );
}

// =========================
// STATS
// =========================

function renderCajaStats() {

  const aperturaEl =
    document.getElementById("montoApertura");

  if (aperturaEl) {

    aperturaEl.innerText =
      "$" +
      aperturaCaja.toLocaleString();
  }
}

renderCajaStats();