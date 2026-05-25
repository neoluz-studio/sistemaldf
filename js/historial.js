// =================================
// STORAGE
// =================================

let ventas =
  JSON.parse(
    localStorage.getItem("ventas")
  ) || [];

let historial =
  JSON.parse(
    localStorage.getItem("historial")
  ) || [];

// =================================
// MÉTODOS
// =================================

function formatearMetodo(metodo) {

  switch (metodo?.toLowerCase()) {

    case "mp":
      return "MERCADO PAGO";

    case "transferencia":
      return "TRANSFERENCIA";

    case "efectivo":
      return "EFECTIVO";

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

function formatoMoneda(valor) {

  return `$${Number(valor || 0)
    .toLocaleString()}`;
}

// =================================
// STATS
// =================================

function renderStats(lista = ventas) {

  const total =
    lista.reduce(
      (acc, v) =>
        acc + Number(v.total || 0),
      0
    );

  const efectivo =
    lista
      .filter(v =>
        v.metodo === "efectivo"
      )
      .reduce(
        (acc, v) =>
          acc + Number(v.total || 0),
        0
      );

  const digital =
    total - efectivo;

  document.getElementById(
    "totalVentas"
  ).innerText =
    formatoMoneda(total);

  document.getElementById(
    "totalEfectivo"
  ).innerText =
    formatoMoneda(efectivo);

  document.getElementById(
    "totalDigital"
  ).innerText =
    formatoMoneda(digital);

  document.getElementById(
    "cantidadVentas"
  ).innerText =
    lista.length;
}

// =================================
// RENDER VENTAS
// =================================

function renderVentas(lista = ventas) {

  const cont =
    document.getElementById(
      "listaVentas"
    );

  if (!cont) return;

  cont.innerHTML = "";

  if (lista.length === 0) {

    cont.innerHTML = `

      <tr>

        <td colspan="5">

          No hay ventas registradas

        </td>

      </tr>
    `;

    renderStats([]);

    return;
  }

  [...lista]
    .reverse()
    .forEach(v => {

      const tr =
        document.createElement("tr");

      tr.innerHTML = `

        <td>

          ${v.fecha || "-"}

        </td>

        <td>

          <span class="badge-success metodo-badge">

            ${formatearMetodo(v.metodo)}

          </span>

        </td>

        <td>

          ${v.usuario || "Local"}

        </td>

        <td>

          <strong>

            ${formatoMoneda(v.total)}

          </strong>

        </td>

        <td>

          <button
            onclick="verDetalle(${v.id})"
          >

            Ver detalle

          </button>

        </td>
      `;

      cont.appendChild(tr);
    });

  renderStats(lista);
}

// =================================
// FILTRAR
// =================================

function filtrarVentas() {

  const desde =
    document.getElementById(
      "fechaDesde"
    ).value;

  const hasta =
    document.getElementById(
      "fechaHasta"
    ).value;

  let filtradas =
    ventas.filter(v => {

      if (!v.fechaISO)
        return true;

      if (
        desde &&
        v.fechaISO < desde
      )
        return false;

      if (
        hasta &&
        v.fechaISO > hasta
      )
        return false;

      return true;
    });

  renderVentas(filtradas);
}

// =================================
// VER DETALLE
// =================================

function verDetalle(id) {

  const venta =
    ventas.find(
      v =>
        Number(v.id) ===
        Number(id)
    );

  if (!venta) return;

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
          ${formatoMoneda(item.precio)}

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

        Detalle venta

      </h3>

      <p>

        <strong>
          Fecha:
        </strong>

        ${venta.fecha || "-"}

      </p>

      <p>

        <strong>
          Método:
        </strong>

        ${formatearMetodo(
          venta.metodo
        )}

      </p>

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

  overlay.onclick = e => {

    if (
      e.target === overlay
    ) {

      overlay.remove();
    }
  };
}

// =================================
// AGREGAR HISTORIAL
// =================================

function agregarHistorial({

  tipo,
  modulo,
  descripcion,
  monto = 0

}) {

  historial.unshift({

    id: Date.now(),

    tipo,

    modulo,

    descripcion,

    monto,

    fecha:
      new Date()
        .toLocaleString(),

    usuario:

      JSON.parse(
        localStorage.getItem(
          "usuario"
        )
      )?.nombre || "Admin"
  });

  localStorage.setItem(

    "historial",

    JSON.stringify(historial)
  );
}

// =================================
// RENDER HISTORIAL
// =================================

function renderHistorial() {

  const cont =
    document.getElementById(
      "listaHistorial"
    );

  if (!cont) return;

  cont.innerHTML = "";

  if (historial.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">

        No hay actividad registrada

      </div>
    `;

    return;
  }

  historial
    .slice(0, 25)
    .forEach(h => {

      const clase =
        h.tipo === "error"
          ? "movement-red"
          : "movement-green";

      cont.innerHTML += `

        <div class="
          movement-card
          ${clase}
        ">

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

          <span class="
            ${h.tipo === "error"
              ? "badge-danger"
              : "badge-success"}
          ">

            ${h.usuario || "Admin"}

          </span>

        </div>
      `;
    });
}

// =================================
// LIMPIAR HISTORIAL
// =================================

function limpiarHistorial() {

  if (historial.length === 0) {

    showToast(
      "No hay historial",
      "info"
    );

    return;
  }

  const confirmar =
    confirm(
      "¿Eliminar historial completo?"
    );

  if (!confirmar) return;

  localStorage.setItem(
    "historial",
    JSON.stringify([])
  );

  historial = [];

  renderHistorial();

  showToast(
    "Historial eliminado",
    "success"
  );
}

// =================================
// INIT
// =================================

renderVentas();

renderHistorial();

renderStats();