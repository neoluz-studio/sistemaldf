let ventas =
  JSON.parse(localStorage.getItem("ventas")) || [];

// =========================
// RENDER
// =========================

function renderVentas() {

  const cont =
    document.getElementById("listaVentas");

  cont.innerHTML = "";

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

  ventas.reverse().forEach(v => {

    const tr =
      document.createElement("tr");

    tr.innerHTML = `

      <td>
        ${v.fecha}
      </td>

      <td>
        $${v.total.toLocaleString()}
      </td>

      <td>
        <span class="badge-success">
          ${

  v.metodo === "Mercado Pago"

    ? "MERCADO PAGO"

  : v.metodo === "Transferencia"

    ? "TRANSFERENCIA"

  : "EFECTIVO"

}
        </span>
      </td>

      <td>
        ${v.usuario || "Local"}
      </td>

      <td>

        <button onclick="verDetalle(${v.id})">
          Ver detalle
        </button>

      </td>
    `;

    cont.appendChild(tr);
  });
}

// =========================
// DETALLE
// =========================

function verDetalle(id) {

  const venta =
    ventas.find(v => v.id === id);

  if (!venta) return;

  let detalleHTML = "";

  venta.detalle.forEach(item => {

    detalleHTML += `

      <div class="detail-item">

        <strong>
          ${item.nombre}
        </strong>

        <span>
          ${item.cantidad} x $${item.precio}
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

  document.body.appendChild(overlay);

  overlay
    .querySelector(".btn-cancel")
    .onclick = () => {

      overlay.remove();
    };
}

// INIT
renderVentas();
// =================================
// HISTORIAL GLOBAL
// =================================

let historial =
  JSON.parse(localStorage.getItem("historial")) || [];

// =================================
// AGREGAR EVENTO
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
      new Date().toLocaleString(),

    usuario:
      localStorage.getItem("usuarioActual") || "Admin"
  });

  localStorage.setItem(
    "historial",
    JSON.stringify(historial)
  );
}