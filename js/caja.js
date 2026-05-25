// =================================
// STORAGE
// =================================

let caja =
  JSON.parse(
    localStorage.getItem("caja")
  ) || [];

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

  localStorage.setItem(
    "aperturasCaja",
    JSON.stringify(aperturas)
  );
}

// =================================
// OBTENER SALDOS
// =================================

// =================================
// CALCULAR CAJA PROFESIONAL
// =================================

function calcularCaja() {

  const ventas =
    JSON.parse(
      localStorage.getItem("ventas")
    ) || [];

  // =================================
  // MÉTODOS DE PAGO
  // =================================

  const efectivo =
    ventas
      .filter(v =>
        v.metodo === "efectivo"
      )
      .reduce(
        (acc, v) =>
          acc + Number(v.total || 0),
        0
      );

  const transferencia =
    ventas
      .filter(v =>
        v.metodo === "transferencia"
      )
      .reduce(
        (acc, v) =>
          acc + Number(v.total || 0),
        0
      );

  const mercadoPago =
    ventas
      .filter(v =>
        v.metodo === "mp"
      )
      .reduce(
        (acc, v) =>
          acc + Number(v.total || 0),
        0
      );

  const qr =
    ventas
      .filter(v =>
        v.metodo === "qr"
      )
      .reduce(
        (acc, v) =>
          acc + Number(v.total || 0),
        0
      );

  const qrBanco =
    ventas
      .filter(v =>
        v.metodo === "qr_banco"
      )
      .reduce(
        (acc, v) =>
          acc + Number(v.total || 0),
        0
      );

  const promoNacion =
    ventas
      .filter(v =>
        v.metodo === "promo_bn"
      )
      .reduce(
        (acc, v) =>
          acc + Number(v.total || 0),
        0
      );

  // =================================
  // MOVIMIENTOS MANUALES
  // =================================

  const ingresosManuales =
    caja
      .filter(m =>
        m.tipo === "ingreso" &&
        !m.ventaId
      )
      .reduce(
        (acc, m) =>
          acc + Number(m.monto || 0),
        0
      );

  const egresos =
    caja
      .filter(m =>
        m.tipo === "egreso"
      )
      .reduce(
        (acc, m) =>
          acc + Number(m.monto || 0),
        0
      );

  // =================================
  // TOTALES
  // =================================

  const totalDigital =
    transferencia +
    mercadoPago +
    qr +
    qrBanco +
    promoNacion;

  const ingresosCaja =
    efectivo +
    ingresosManuales;

  const saldo =
    ingresosCaja - egresos;

  return {

    efectivo,

    transferencia,

    mercadoPago,

    qr,

    qrBanco,

    promoNacion,

    totalDigital,

    ingresosCaja,

    egresos,

    saldo
  };
}

// =================================
// REGISTRAR MOVIMIENTO
// =================================

function registrarMovimiento() {

  const tipo =
    document.getElementById(
      "tipo"
    ).value;

  const monto =
    Number(
      document.getElementById(
        "monto"
      ).value
    );

  const motivo =
    document.getElementById(
      "motivo"
    )
    .value
    .trim();

  // VALIDAR
  if (!motivo) {

    showToast(
      "Ingresá un motivo",
      "error"
    );

    return;
  }

  if (
    isNaN(monto) ||
    monto <= 0
  ) {

    showToast(
      "Monto inválido",
      "error"
    );

    return;
  }

  const resumen =
    calcularCaja();

  // VALIDAR EGRESO
  if (

    tipo === "egreso" &&
    monto > resumen.saldo

  ) {

    showToast(
      "Saldo insuficiente",
      "error"
    );

    return;
  }

  caja.push({

    id: Date.now(),

    tipo,

    monto,

    motivo,

    usuario:

      JSON.parse(
        localStorage.getItem(
          "usuario"
        )
      )?.nombre || "Local",

    fecha:
      new Date()
        .toLocaleString()
  });

  guardar();

  render();

  renderResumenCaja();

  document.getElementById(
    "monto"
  ).value = "";

  document.getElementById(
    "motivo"
  ).value = "";

  showToast(
    "Movimiento registrado",
    "success"
  );
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

  if (
    isNaN(monto) ||
    monto <= 0
  ) {

    showToast(
      "Ingresá un monto válido",
      "error"
    );

    return;
  }

  aperturas.push({

    id: Date.now(),

    tipo: "apertura",

    monto,

    usuario:

      JSON.parse(
        localStorage.getItem(
          "usuario"
        )
      )?.nombre || "Local",

    fecha:
      new Date()
        .toLocaleString()
  });

  caja.push({

    id: Date.now(),

    tipo: "ingreso",

    monto,

    motivo: "Apertura de caja",

    fecha:
      new Date()
        .toLocaleString()
  });

  guardar();

  render();

  renderResumenCaja();

  document.getElementById(
    "montoInicial"
  ).value = "";

  showToast(
    "Caja abierta",
    "success"
  );
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

  if (
    isNaN(monto) ||
    monto <= 0
  ) {

    showToast(
      "Ingresá un monto válido",
      "error"
    );

    return;
  }

  const resumen =
    calcularCaja();

  // VALIDAR
  if (monto > resumen.saldo) {

    showToast(
      "No podés retirar más dinero del disponible",
      "error"
    );

    return;
  }

  aperturas.push({

    id: Date.now(),

    tipo: "cierre",

    monto,

    usuario:

      JSON.parse(
        localStorage.getItem(
          "usuario"
        )
      )?.nombre || "Local",

    fecha:
      new Date()
        .toLocaleString()
  });

  caja.push({

    id: Date.now(),

    tipo: "egreso",

    monto,

    motivo: "Cierre de caja",

    fecha:
      new Date()
        .toLocaleString()
  });

  guardar();

  render();

  renderResumenCaja();

  document.getElementById(
    "montoCierre"
  ).value = "";

  showToast(
    "Caja cerrada",
    "info"
  );
}

// =================================
// RESUMEN
// =================================

function renderResumenCaja() {

  const resumen =
    calcularCaja();

  // APERTURA
  const ultimaApertura =
    aperturas
      .filter(a =>
        a.tipo === "apertura"
      )
      .slice(-1)[0];

  const apertura =
    ultimaApertura?.monto || 0;

  // DIFERENCIA
  const diferencia =
    resumen.saldo - apertura;
    // =================================
// 10% VENTAS
// =================================

const diezPorciento =
  caja
    .filter(m =>
      m.tipo === "ingreso" &&
      m.ventaId
    )
    .reduce(
      (acc, m) =>
        acc + (m.monto * 0.10),
      0
    );

  // RENDER
  document.getElementById(
    "montoApertura"
  ).innerText =
    `$${apertura.toLocaleString()}`;

  document.getElementById(
    "totalIngresos"
  ).innerText =
    `$${resumen.ingresos.toLocaleString()}`;

  document.getElementById(
    "totalEgresos"
  ).innerText =
    `$${resumen.egresos.toLocaleString()}`;

  document.getElementById(
    "saldoActual"
  ).innerText =
    `$${resumen.saldo.toLocaleString()}`;

  document.getElementById(
    "saldo"
  ).innerText =
    `$${resumen.saldo.toLocaleString()}`;

  document.getElementById(
    "diferenciaCaja"
  ).innerText =
    `$${diferencia.toLocaleString()}`;
    
    document.getElementById(
  "diezPorciento"
).innerText =
  `$${diezPorciento.toLocaleString()}`;
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
        ${
  m.ventaId

  ? `

    <button
      class="detail-btn"
      onclick="verDetalleVenta(${m.ventaId})"
    >
      👁 Ver detalle
    </button>

  `

  : ""
}
      `;

      cont.appendChild(div);
    });
}

// =================================
// LIMPIAR CAJA
// =================================

function limpiarCaja() {

  showConfirm({

    title: "Limpiar caja",

    message:
      "Se eliminarán todos los movimientos.",

    onConfirm: () => {

      caja = [];

      aperturas = [];

      guardar();

      render();

      renderResumenCaja();

      showToast(
        "Caja limpiada",
        "info"
      );
    }
  });
}
function verDetalleVenta(id) {

  const ventas =
    JSON.parse(
      localStorage.getItem(
        "ventas"
      )
    ) || [];

  const venta =
    ventas.find(
      v => v.id === id
    );

  if (!venta) {

    showToast(
      "Venta no encontrada",
      "error"
    );

    return;
  }

  let detalleHTML = "";

  venta.detalle.forEach(item => {

    detalleHTML += `

      <div class="detail-item">

        <strong>

          ${item.nombre}

        </strong>

        <span>

          ${item.cantidad}
          x
          $${item.precio}

        </span>

      </div>
    `;
  });

  const overlay =
    document.createElement("div");

  overlay.className =
    "modal-overlay";

  overlay.innerHTML = `

    <div class="modal">

      <h3>

        🧾 Detalle venta

      </h3>

      <div class="detail-list">

        ${detalleHTML}

      </div>

      <hr>

      <p>

        Total:
        <strong>
          $${venta.total.toLocaleString()}
        </strong>

      </p>

      <div class="modal-actions">

        <button class="btn-cancel">

          Cerrar

        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  overlay
    .querySelector(".btn-cancel")
    .onclick = () => {

      overlay.remove();
    };
}
// =================================
// INIT
// =================================

render();

renderResumenCaja();
// =================================
// DASHBOARD CAJA
// =================================
function renderStatsCaja() {

  const resumen =
    calcularCaja();

  const set = (id, value) => {

    const el =
      document.getElementById(id);

    if (el) {

      el.innerText = value;
    }
  };

  // =================================
  // PRINCIPALES
  // =================================

  set(
    "ingresosCaja",
    `$${resumen.ingresosCaja.toLocaleString()}`
  );

  set(
    "egresosCaja",
    `$${resumen.egresos.toLocaleString()}`
  );

  set(
    "saldoCaja",
    `$${resumen.saldo.toLocaleString()}`
  );

  // =================================
  // EFECTIVO Y DIGITAL
  // =================================

  set(
    "totalEfectivo",
    `$${resumen.efectivo.toLocaleString()}`
  );

  set(
    "totalDigital",
    `$${resumen.totalDigital.toLocaleString()}`
  );

  // =================================
  // DETALLE DIGITAL
  // =================================

  set(
    "totalTransferencia",
    `$${resumen.transferencia.toLocaleString()}`
  );

  set(
    "totalMP",
    `$${resumen.mercadoPago.toLocaleString()}`
  );

  set(
    "totalQR",
    `$${resumen.qr.toLocaleString()}`
  );

  set(
    "totalQRBanco",
    `$${resumen.qrBanco.toLocaleString()}`
  );

  set(
    "totalPromoBN",
    `$${resumen.promoNacion.toLocaleString()}`
  );

  // =================================
  // MOVIMIENTOS
  // =================================

  set(
    "movimientosCaja",
    caja.length
  );
}

// =================================
// INIT
// =================================

render();
renderResumenCaja();
renderStatsCaja();