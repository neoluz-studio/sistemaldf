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
// METODO TEXTO
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

// =================================
// RENDER VENTAS
// =================================

function renderVentas() {

  const cont =
    document.getElementById(
      "listaVentas"
    );

  if (!cont) return;

  cont.innerHTML = "";

  // VACIO
  if (ventas.length === 0) {

    cont.innerHTML = `

      <tr>

        <td colspan="5">

          No hay ventas registradas

        </td>

      </tr>
    `;

    return;
  }

  // MÁS NUEVAS ARRIBA
  [...ventas]
    .reverse()
    .forEach(v => {

      const tr =
        document.createElement("tr");

      tr.innerHTML = `

        <td>

          ${v.fecha || "-"}

        </td>

        <td>

          $${(v.total || 0)
            .toLocaleString()}

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

          <button
            onclick="verDetalle(${v.id})"
          >

            Ver detalle

          </button>

        </td>
      `;

      cont.appendChild(tr);
    });
}

// =================================
// VER DETALLE
// =================================

function verDetalle(id) {

  const venta =
    ventas.find(
      v => v.id === id
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

  // CERRAR
  overlay
    .querySelector(".btn-cancel")
    .onclick = () => {

      overlay.remove();
    };

  // CERRAR AFUERA
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

  // VACIO
  if (historial.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">

        No hay movimientos

      </div>
    `;

    return;
  }

  // MÁS NUEVOS
  historial
    .slice(0, 20)
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

              ${h.fecha}

            </small>

          </div>

          <span class="
            ${h.tipo === "error"
              ? "badge-danger"
              : "badge-success"}
          ">

            ${h.usuario}

          </span>

        </div>
      `;
    });
}
// =================================
// LIMPIAR HISTORIAL
// =================================

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

  const confirmar = confirm(
    "¿Eliminar todo el historial?"
  );

  if (!confirmar) return;

  // VACIAR STORAGE
  localStorage.setItem(
    "historial",
    JSON.stringify([])
  );

  // RESET ARRAY
  historial = [];

  // RE-RENDER
  renderHistorial();

  showToast(
    "🗑️ Historial eliminado",
    "success"
  );
}

  
// =================================
// INIT
// =================================

renderVentas();

renderHistorial();