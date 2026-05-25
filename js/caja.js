// =================================
// STORAGE
// =================================

let caja =
  JSON.parse(
    localStorage.getItem("caja")
  ) || [];

let aperturas =
  JSON.parse(
    localStorage.getItem("aperturasCaja")
  ) || [];

// =================================
// HELPERS
// =================================

function obtenerVentas() {

  return JSON.parse(
    localStorage.getItem("ventas")
  ) || [];
}

function obtenerUsuario() {

  return JSON.parse(
    localStorage.getItem("usuario")
  )?.nombre || "Local";
}

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

function formatoMoneda(valor) {

  return `$${Number(valor || 0).toLocaleString()}`;
}

function setTexto(id, valor) {

  const el =
    document.getElementById(id);

  if (el) {
    el.innerText = valor;
  }
}

function formatearMetodo(metodo) {

  switch (metodo) {

    case "efectivo":
      return "EFECTIVO";

    case "transferencia":
      return "TRANSFERENCIA";

    case "mp":
      return "MERCADO PAGO";

    case "qr":
      return "QR";

    case "qr_banco":
      return "QR BANCO";

    case "promo_bn":
      return "PROMO NACIÓN";

    default:
      return metodo || "-";
  }
}

function avisar(mensaje, tipo = "info") {

  if (typeof showToast === "function") {

    showToast(mensaje, tipo);

  } else {

    alert(mensaje);
  }
}

// =================================
// CALCULAR CAJA
// =================================

function calcularCaja() {

  const ventas =
    obtenerVentas();

  const totalPorMetodo = metodo => {

    return ventas
      .filter(v =>
        v.metodo === metodo
      )
      .reduce(
        (acc, v) =>
          acc + Number(v.total || 0),
        0
      );
  };

  const efectivo =
    totalPorMetodo("efectivo");

  const transferencia =
    totalPorMetodo("transferencia");

  const mercadoPago =
    totalPorMetodo("mp");

  const qr =
    totalPorMetodo("qr");

  const qrBanco =
    totalPorMetodo("qr_banco");

  const promoNacion =
    totalPorMetodo("promo_bn");

  const totalDigital =
    transferencia +
    mercadoPago +
    qr +
    qrBanco +
    promoNacion;

  const totalVendido =
    ventas.reduce(
      (acc, v) =>
        acc + Number(v.total || 0),
      0
    );

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

  const saldo =
    efectivo +
    ingresosManuales -
    egresos;

  const diezPorciento =
    totalVendido * 0.10;

  return {

    efectivo,

    transferencia,

    mercadoPago,

    qr,

    qrBanco,

    promoNacion,

    totalDigital,

    totalVendido,

    ingresosManuales,

    egresos,

    saldo,

    diezPorciento
  };
}

// =================================
// MODAL
// =================================

function abrirModalCaja(tipo) {

  const modal =
    document.getElementById(
      "modalCaja"
    );

  const titulo =
    document.getElementById(
      "modalCajaTitulo"
    );

  const texto =
    document.getElementById(
      "modalCajaTexto"
    );

  const tipoInput =
    document.getElementById(
      "modalCajaTipo"
    );

  const motivo =
    document.getElementById(
      "modalCajaMotivo"
    );

  tipoInput.value = tipo;

  motivo.style.display =
    "block";

  switch (tipo) {

    case "apertura":

      titulo.innerText =
        "Abrir caja";

      texto.innerText =
        "Ingresá el monto inicial.";

      motivo.value =
        "Apertura de caja";

      break;

    case "ingreso":

      titulo.innerText =
        "Registrar ingreso";

      texto.innerText =
        "Ingresá dinero manual.";

      motivo.value = "";

      break;

    case "egreso":

      titulo.innerText =
        "Registrar egreso";

      texto.innerText =
        "Registrá un gasto o retiro.";

      motivo.value = "";

      break;

    case "cierre":

      titulo.innerText =
        "Cerrar caja";

      texto.innerText =
        "Ingresá el retiro final.";

      motivo.value =
        "Cierre de caja";

      break;
  }

  modal.classList.remove(
    "hidden"
  );
}

function cerrarModalCaja() {

  document
    .getElementById(
      "modalCaja"
    )
    .classList.add(
      "hidden"
    );

  document.getElementById(
    "modalCajaMonto"
  ).value = "";

  document.getElementById(
    "modalCajaMotivo"
  ).value = "";
}

function confirmarModalCaja() {

  const tipo =
    document.getElementById(
      "modalCajaTipo"
    ).value;

  const monto =
    Number(
      document.getElementById(
        "modalCajaMonto"
      ).value
    );

  const motivo =
    document
      .getElementById(
        "modalCajaMotivo"
      )
      .value
      .trim();

  if (
    isNaN(monto) ||
    monto <= 0
  ) {

    avisar(
      "Monto inválido",
      "error"
    );

    return;
  }

  const resumen =
    calcularCaja();

  if (
    tipo === "egreso" &&
    monto > resumen.saldo
  ) {

    avisar(
      "Saldo insuficiente",
      "error"
    );

    return;
  }

  if (
    tipo === "cierre" &&
    monto > resumen.saldo
  ) {

    avisar(
      "No podés retirar más del saldo",
      "error"
    );

    return;
  }

  const fecha =
    new Date();

  // APERTURA
  if (tipo === "apertura") {

    aperturas.push({

      id: Date.now(),

      tipo: "apertura",

      monto,

      usuario:
        obtenerUsuario(),

      fecha:
        fecha.toLocaleString()
    });

    caja.push({

      id: Date.now() + 1,

      tipo: "ingreso",

      monto,

      motivo:
        motivo || "Apertura de caja",

      usuario:
        obtenerUsuario(),

      fecha:
        fecha.toLocaleString()
    });

    avisar(
      "Caja abierta",
      "success"
    );
  }

  // INGRESO
  if (tipo === "ingreso") {

    caja.push({

      id: Date.now(),

      tipo: "ingreso",

      monto,

      motivo,

      usuario:
        obtenerUsuario(),

      fecha:
        fecha.toLocaleString()
    });

    avisar(
      "Ingreso registrado",
      "success"
    );
  }

  // EGRESO
  if (tipo === "egreso") {

    caja.push({

      id: Date.now(),

      tipo: "egreso",

      monto,

      motivo,

      usuario:
        obtenerUsuario(),

      fecha:
        fecha.toLocaleString()
    });

    avisar(
      "Egreso registrado",
      "info"
    );
  }

  // CIERRE
  if (tipo === "cierre") {

    aperturas.push({

      id: Date.now(),

      tipo: "cierre",

      monto,

      usuario:
        obtenerUsuario(),

      fecha:
        fecha.toLocaleString()
    });

    caja.push({

      id: Date.now(),

      tipo: "egreso",

      monto,

      motivo:
        motivo || "Cierre de caja",

      usuario:
        obtenerUsuario(),

      fecha:
        fecha.toLocaleString()
    });

    avisar(
      "Caja cerrada",
      "info"
    );
  }

  guardar();

  actualizarCaja();

  cerrarModalCaja();
}

// =================================
// STATS
// =================================

function renderStatsCaja() {

  const resumen =
    calcularCaja();

  setTexto(
    "totalEfectivo",
    formatoMoneda(
      resumen.efectivo
    )
  );

  setTexto(
    "totalDigital",
    formatoMoneda(
      resumen.totalDigital
    )
  );

  setTexto(
    "saldoCaja",
    formatoMoneda(
      resumen.saldo
    )
  );

  setTexto(
    "totalVendido",
    formatoMoneda(
      resumen.totalVendido
    )
  );

  setTexto(
    "ingresosCaja",
    formatoMoneda(
      resumen.ingresosManuales
    )
  );

  setTexto(
    "egresosCaja",
    formatoMoneda(
      resumen.egresos
    )
  );

  setTexto(
    "diezPorciento",
    formatoMoneda(
      resumen.diezPorciento
    )
  );

  setTexto(
    "movimientosCaja",
    caja.length
  );

  setTexto(
    "totalTransferencia",
    formatoMoneda(
      resumen.transferencia
    )
  );

  setTexto(
    "totalMP",
    formatoMoneda(
      resumen.mercadoPago
    )
  );

  setTexto(
    "totalQR",
    formatoMoneda(
      resumen.qr
    )
  );

  setTexto(
    "totalQRBanco",
    formatoMoneda(
      resumen.qrBanco
    )
  );

  setTexto(
    "totalPromoBN",
    formatoMoneda(
      resumen.promoNacion
    )
  );

  const estado =
    document.getElementById(
      "estadoCaja"
    );

  if (estado) {

    estado.innerText =
      caja.length > 0
        ? "Caja activa"
        : "Caja sin abrir";
  }
}

// =================================
// MOVIMIENTOS
// =================================

function renderMovimientos() {

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
    .slice(0, 15)
    .forEach(m => {

      const div =
        document.createElement(
          "div"
        );

      const claseColor =
        m.tipo === "ingreso"
          ? "movement-green"
          : "movement-red";

      div.className = `
        movement-card
        ${claseColor}
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
            ${m.motivo || "-"}
          </h4>

          <small>
            ${m.fecha || "-"}
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

          ${formatoMoneda(
            m.monto
          )}

        </strong>
      `;

      cont.appendChild(div);
    });
}

// =================================
// HISTORIAL VENTAS
// =================================

function renderHistorialVentas() {

  const cont =
    document.getElementById(
      "historialVentas"
    );

  if (!cont) return;

  const ventas =
    obtenerVentas();

  cont.innerHTML = "";

  if (ventas.length === 0) {

    cont.innerHTML = `

      <tr>

        <td colspan="4">

          No hay ventas registradas

        </td>

      </tr>
    `;

    return;
  }

  [...ventas]
    .reverse()
    .slice(0, 10)
    .forEach(venta => {

      const tr =
        document.createElement(
          "tr"
        );

      tr.innerHTML = `

        <td>
          ${venta.fecha || "-"}
        </td>

        <td>
          ${formatearMetodo(
            venta.metodo
          )}
        </td>

        <td>
          <strong>
            ${formatoMoneda(
              venta.total
            )}
          </strong>
        </td>

        <td>

          <button
            class="detail-btn"
            onclick="verDetalleVenta(${venta.id})"
          >

            Ver

          </button>

        </td>
      `;

      cont.appendChild(tr);
    });
}

// =================================
// DETALLE VENTA
// =================================

function verDetalleVenta(id) {

  const ventas =
    obtenerVentas();

  const venta =
    ventas.find(
      v =>
        Number(v.id) ===
        Number(id)
    );

  if (!venta) {

    avisar(
      "Venta no encontrada",
      "error"
    );

    return;
  }

  let detalleHTML = "";

  venta.detalle?.forEach(item => {

    detalleHTML += `

      <div class="detail-item">

        <strong>
          ${item.nombre}
        </strong>

        <span>

          ${item.cantidad}
          x
          ${formatoMoneda(
            item.precio
          )}

        </span>

      </div>
    `;
  });

  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "modal-overlay";

  overlay.innerHTML = `

    <div class="modal">

      <h3>
        Detalle venta
      </h3>

      <div class="detail-list">

        ${detalleHTML}

      </div>

      <hr>

      <p>

        Total:
        <strong>

          ${formatoMoneda(
            venta.total
          )}

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
    .querySelector(
      ".btn-cancel"
    )
    .onclick = () => {

      overlay.remove();
    };
}

// =================================
// LIMPIAR
// =================================

function limpiarCaja() {

  if (caja.length === 0) {

    avisar(
      "No hay movimientos",
      "info"
    );

    return;
  }

  const confirmar =
    confirm(
      "¿Limpiar caja completa?"
    );

  if (!confirmar) return;

  caja = [];

  aperturas = [];

  guardar();

  actualizarCaja();

  avisar(
    "Caja limpiada",
    "success"
  );
}

// =================================
// ACTUALIZAR TODO
// =================================

function actualizarCaja() {

  renderStatsCaja();

  renderMovimientos();

  renderHistorialVentas();
}

// =================================
// INIT
// =================================

actualizarCaja();