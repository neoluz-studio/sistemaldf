// =================================
// HISTORIAL PRO + SUPABASE
// LO DE FAUSTI
// =================================

let ventas = [];
let historial =
  JSON.parse(localStorage.getItem("historial")) || [];

// =================================
// HELPERS
// =================================

function formatoMoneda(valor) {
  return `$${Number(valor || 0).toLocaleString("es-AR")}`;
}

function avisar(mensaje, tipo = "info") {
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
  } else {
    alert(mensaje);
  }
}

function formatearMetodo(metodo) {
  switch (String(metodo || "").toLowerCase()) {
    case "mp":
      return "Mercado Pago";

    case "transferencia":
      return "Transferencia";

    case "efectivo":
      return "Efectivo";

    case "qr":
      return "QR";

    case "qr_banco":
      return "QR Banco";

    case "promo_bn":
      return "Promo Nación";

    default:
      return metodo || "-";
  }
}

function claseMetodo(metodo) {
  switch (String(metodo || "").toLowerCase()) {

    case "efectivo":
      return "badge-efectivo";

    case "transferencia":
      return "badge-transferencia";

    case "mp":
      return "badge-mp";

    case "qr":
    case "qr_banco":
      return "badge-qr";

    case "promo_bn":
      return "badge-promo";

    default:
      return "badge-default";
  }
}

function obtenerFechaISO(fecha) {

  if (!fecha) return "";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

// =================================
// CARGAR VENTAS SUPABASE
// =================================

async function cargarVentasSupabase() {

  if (typeof supabaseClient === "undefined") {

    ventas =
      JSON.parse(
        localStorage.getItem("ventas")
      ) || [];

    return;
  }

  const {

    data: ventasData,

    error: ventasError

  } = await supabaseClient

    .from("ventas")

    .select("*")

    .order(
      "fecha",
      { ascending: false }
    );

  if (ventasError) {

    console.error(ventasError);

    avisar(
      "Error cargando historial",
      "error"
    );

    ventas =
      JSON.parse(
        localStorage.getItem("ventas")
      ) || [];

    return;
  }

  ventas = [];

  for (const venta of ventasData || []) {

    const {

      data: detalleData,

      error: detalleError

    } = await supabaseClient

      .from("venta_detalle")

      .select("*")

      .eq(
        "venta_id",
        venta.id
      );

    if (detalleError) {
      console.error(detalleError);
    }

    ventas.push({

      id:
        venta.id,

      fecha:
        venta.fecha
          ? new Date(
              venta.fecha
            ).toLocaleString("es-AR")
          : "-",

      fechaISO:
        venta.fecha
          ? new Date(
              venta.fecha
            )
              .toISOString()
              .slice(0, 10)
          : "",

      metodo:
        venta.metodo,

      subtotal:
        Number(
          venta.subtotal || 0
        ),

      descuentoProductos:
        Number(
          venta.descuento_productos || 0
        ),

      descuentoCarrito:
        Number(
          venta.descuento_carrito || 0
        ),

      descuento:
        Number(
          venta.descuento_total || 0
        ),

      total:
        Number(
          venta.total || 0
        ),

      costoTotal:
        Number(
          venta.costo_total || 0
        ),

      ganancia:
        Number(
          venta.ganancia || 0
        ),

      usuario:
        venta.usuario || "Lodefausti",

      detalle:
        (detalleData || []).map(item => ({

          nombre:
            item.nombre,

          cantidad:
            Number(
              item.cantidad || 0
            ),

          precio:
            Number(
              item.precio || 0
            ),

          subtotal:
            Number(
              item.subtotal || 0
            ),

          descuento:
            Number(
              item.descuento || 0
            ),

          total:
            Number(
              item.total || 0
            )
        }))
    });
  }

  localStorage.setItem(
    "ventas",
    JSON.stringify(ventas)
  );
}

// =================================
// STATS
// =================================

function renderStats(lista = ventas) {

  const total = lista.reduce(
    (acc, v) =>
      acc + Number(v.total || 0),
    0
  );

  const descuentos = lista.reduce(
    (acc, v) =>
      acc + Number(v.descuento || 0),
    0
  );

  const efectivo = lista
    .filter(
      v => v.metodo === "efectivo"
    )
    .reduce(
      (acc, v) =>
        acc + Number(v.total || 0),
      0
    );

  const digital =
    total - efectivo;

  const ticketPromedio =
    lista.length > 0
      ? total / lista.length
      : 0;

  setTextoHistorial(
    "totalVentas",
    formatoMoneda(total)
  );

  setTextoHistorial(
    "totalEfectivo",
    formatoMoneda(efectivo)
  );

  setTextoHistorial(
    "totalDigital",
    formatoMoneda(digital)
  );

  setTextoHistorial(
    "cantidadVentas",
    lista.length
  );

  setTextoHistorial(
    "totalDescuentos",
    formatoMoneda(descuentos)
  );

  setTextoHistorial(
    "ticketPromedio",
    formatoMoneda(ticketPromedio)
  );
}

function setTextoHistorial(id, valor) {

  const el =
    document.getElementById(id);

  if (el) {
    el.innerText = valor;
  }
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
        <td colspan="7" class="empty-table">
          No hay ventas registradas
        </td>
      </tr>
    `;

    renderStats([]);

    return;
  }

  lista.forEach(v => {

    const subtotal =
      Number(
        v.subtotal ||
        v.total ||
        0
      );

    const descuento =
      Number(
        v.descuento || 0
      );

    const total =
      Number(
        v.total || 0
      );

    const tr =
      document.createElement("tr");

    tr.innerHTML = `
      <td>
        <strong>${v.fecha || "-"}</strong>
      </td>

      <td>
        <span class="method-badge ${claseMetodo(v.metodo)}">
          ${formatearMetodo(v.metodo)}
        </span>
      </td>

      <td>
        <span class="user-badge">
          ${v.usuario || "Local"}
        </span>
      </td>

      <td>
        ${formatoMoneda(subtotal)}
      </td>

      <td class="discount-cell">
        -${formatoMoneda(descuento)}
      </td>

      <td>
        <strong class="total-cell">
          ${formatoMoneda(total)}
        </strong>
      </td>

      <td>

        <button
          type="button"
          class="detail-btn"
          onclick="verDetalle('${v.id}')"
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
    )?.value;

  const hasta =
    document.getElementById(
      "fechaHasta"
    )?.value;

  const filtradas =
    ventas.filter(v => {

      const fechaVenta =
        v.fechaISO ||
        obtenerFechaISO(v.fecha);

      if (!fechaVenta) return true;

      if (desde && fechaVenta < desde)
        return false;

      if (hasta && fechaVenta > hasta)
        return false;

      return true;
    });

  renderVentas(filtradas);
}

// =================================
// DETALLE
// =================================

function verDetalle(id) {

  const venta =
    ventas.find(
      v => String(v.id) === String(id)
    );

  if (!venta) return;

  const detalleHTML =
    (venta.detalle || []).map(item => `

      <div class="detail-product">

        <div>

          <strong>${item.nombre}</strong>

          <small>
            ${item.cantidad} x ${formatoMoneda(item.precio)}
          </small>

        </div>

        <div class="detail-product-values">

          <span>
            Subtotal:
            ${formatoMoneda(item.subtotal)}
          </span>

          <span>
            Desc:
            -${formatoMoneda(item.descuento)}
          </span>

          <strong>
            Total:
            ${formatoMoneda(item.total)}
          </strong>

        </div>

      </div>

    `).join("");

  const overlay =
    document.createElement("div");

  overlay.className =
    "modal-overlay";

  overlay.innerHTML = `

    <div class="modal historial-modal">

      <div class="modal-header-pro">

        <div>

          <h3>
            Detalle de venta
          </h3>

          <p>
            Ticket #${venta.id}
          </p>

        </div>

        <div class="modal-actions-top">

          <button
            type="button"
            onclick="reimprimirTicket('${venta.id}')"
          >
            Reimprimir
          </button>

          <button
            type="button"
            class="modal-close"
          >
            ✕
          </button>

        </div>

      </div>

      <div class="sale-detail-grid">

        <div>
          <span>Fecha</span>
          <strong>${venta.fecha}</strong>
        </div>

        <div>
          <span>Método</span>
          <strong>${formatearMetodo(venta.metodo)}</strong>
        </div>

        <div>
          <span>Usuario</span>
          <strong>${venta.usuario}</strong>
        </div>

      </div>

      <div class="detail-list">
        ${detalleHTML}
      </div>

      <div class="sale-total-box">

        <div>
          <span>Subtotal</span>
          <strong>${formatoMoneda(venta.subtotal)}</strong>
        </div>

        <div>
          <span>Desc. productos</span>
          <strong>
            -${formatoMoneda(venta.descuentoProductos)}
          </strong>
        </div>

        <div>
          <span>Desc. carrito</span>
          <strong>
            -${formatoMoneda(venta.descuentoCarrito)}
          </strong>
        </div>

        <div class="sale-total-final">
          <span>Total final</span>
          <strong>${formatoMoneda(venta.total)}</strong>
        </div>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector(
    ".modal-close"
  ).onclick = () => {
    overlay.remove();
  };

  overlay.onclick = e => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };
}

// =================================
// HISTORIAL
// =================================

function agregarHistorial({
  tipo,
  modulo,
  descripcion,
  monto = 0
}) {

  historial.unshift({

    id:
      Date.now(),

    tipo,

    modulo,

    descripcion,

    monto,

    fecha:
      new Date().toLocaleString(),

    usuario:
      JSON.parse(
        localStorage.getItem("usuario")
      )?.nombre || "Admin"
  });

  localStorage.setItem(
    "historial",
    JSON.stringify(historial)
  );
}

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

  cont.innerHTML =
    historial
      .slice(0, 25)
      .map(h => `

        <div class="timeline-item-pro">

          <div class="timeline-dot"></div>

          <div class="timeline-content">

            <div>

              <h4>${h.modulo || "Sistema"}</h4>

              <p>${h.descripcion || "-"}</p>

              <small>${h.fecha || "-"}</small>

            </div>

            <span class="badge-success">
              ${h.usuario || "Admin"}
            </span>

          </div>

        </div>

      `).join("");
}

// =================================
// LIMPIAR
// =================================

function limpiarHistorial() {

  if (historial.length === 0) {

    avisar(
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

  historial = [];

  localStorage.setItem(
    "historial",
    JSON.stringify([])
  );

  renderHistorial();

  avisar(
    "Historial eliminado",
    "success"
  );
}

// =================================
// REIMPRIMIR
// =================================

function reimprimirTicket(id) {

  const venta =
    ventas.find(
      v => String(v.id) === String(id)
    );

  if (!venta) {

    avisar(
      "Venta no encontrada",
      "error"
    );

    return;
  }

  imprimirTicketHistorial(venta);
}

// =================================
// TICKET
// =================================

function imprimirTicketHistorial(venta) {

  function metodoTicket(metodo) {

    const metodos = {

      efectivo:
        "EFECTIVO",

      transferencia:
        "TRANSFERENCIA",

      mp:
        "MERCADO PAGO",

      qr:
        "QR",

      qr_banco:
        "QR BANCO",

      promo_bn:
        "PROMO NACIÓN"
    };

    return (
      metodos[metodo] ||
      metodo ||
      "-"
    );
  }

  function lineaProducto(item) {

    const cantidad =
      item.cantidad || 0;

    const nombre =
      String(
        item.nombre || "Producto"
      )
        .slice(0, 18);

    const total =
      Number(
        item.total ||
        item.subtotal ||
        0
      );

    return `
${cantidad}x ${nombre.padEnd(18, " ")} ${formatoMoneda(total)}
`;
  }

  const detalle =
    (venta.detalle || [])
      .map(item =>
        lineaProducto(item)
      )
      .join("\n");

  const contenido = `
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">

<title>
Ticket
</title>

<style>

@page {

  size:
    58mm auto;

  margin:
    0;
}

body {

  font-family:
    "Courier New",
    monospace;

  width:
    58mm;

  margin:
    0;

  padding:
    6px;

  background:
    #fff;

  color:
    #000;

  font-size:
    10.5px;
}

.center {

  text-align:
    center;
}

.logo {

  width:
    120px;

  display:
    block;

  margin:
    0 auto 4px auto;

  object-fit:
    contain;

  filter:
    grayscale(1)
    contrast(1.4);
}

.line {

  border-top:
    1px dashed #000;

  margin:
    7px 0;
}

pre {

  white-space:
    pre-wrap;

  margin:
    0;

  font-family:
    "Courier New",
    monospace;
}

.row {

  display:
    flex;

  justify-content:
    space-between;
}

.total {

  font-size:
    17px;

  font-weight:
    bold;

  text-align:
    center;

  margin:
    8px 0;
}

</style>

</head>

<body>

<div class="center">

<img
  src="assets/icons/images/logo1.png"
  class="logo"
  onerror="this.style.display='none'"
>

</div>

<div class="line"></div>

<pre>
Fecha: ${venta.fecha}
Usuario: ${venta.usuario}
Venta Nº: ${venta.id}
Metodo: ${metodoTicket(venta.metodo)}
</pre>

<div class="line"></div>

<pre>
${detalle}
</pre>

<div class="line"></div>

<div class="row">

<span>Subtotal:</span>

<strong>
${formatoMoneda(venta.subtotal)}
</strong>

</div>

<div class="row">

<span>Descuento:</span>

<strong>
-${formatoMoneda(venta.descuento)}
</strong>

</div>

<div class="line"></div>

<div class="total">

TOTAL<br>

${formatoMoneda(venta.total)}

</div>

<div class="line"></div>

<div class="center">

Gracias por su compra

<br>

@lodefausti.congelados

</div>

<script>

window.onload = function () {

  setTimeout(function () {

    window.print();

    setTimeout(function () {

      window.close();

    }, 600);

  }, 300);
};

</script>

</body>

</html>
`;

  const ventana =
    window.open(
      "",
      "_blank",
      "width=300,height=600"
    );

  if (!ventana) {

    avisar(
      "El navegador bloqueó el ticket",
      "error"
    );

    return;
  }

  ventana.document.open();

  ventana.document.write(
    contenido
  );

  ventana.document.close();
}

// =================================
// INIT
// =================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await cargarVentasSupabase();

    renderVentas();

    renderHistorial();

    renderStats();
  }
);