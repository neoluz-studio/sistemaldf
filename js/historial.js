// =================================
// HISTORIAL PRO - LO DE FAUSTI
// =================================

let ventas =
  JSON.parse(localStorage.getItem("ventas")) || [];

let historial =
  JSON.parse(localStorage.getItem("historial")) || [];

// =================================
// HELPERS
// =================================

function formatoMoneda(valor) {
  return `$${Number(valor || 0).toLocaleString("es-AR")}`;
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
// STATS
// =================================

function renderStats(lista = ventas) {
  const total = lista.reduce(
    (acc, v) => acc + Number(v.total || 0),
    0
  );

  const descuentos = lista.reduce(
    (acc, v) => acc + Number(v.descuento || 0),
    0
  );

  const efectivo = lista
    .filter(v => v.metodo === "efectivo")
    .reduce((acc, v) => acc + Number(v.total || 0), 0);

  const digital = total - efectivo;

  const ticketPromedio =
    lista.length > 0 ? total / lista.length : 0;

  const totalVentas = document.getElementById("totalVentas");
  const totalEfectivo = document.getElementById("totalEfectivo");
  const totalDigital = document.getElementById("totalDigital");
  const cantidadVentas = document.getElementById("cantidadVentas");

  if (totalVentas) totalVentas.innerText = formatoMoneda(total);
  if (totalEfectivo) totalEfectivo.innerText = formatoMoneda(efectivo);
  if (totalDigital) totalDigital.innerText = formatoMoneda(digital);
  if (cantidadVentas) cantidadVentas.innerText = lista.length;

  const descuentoEl = document.getElementById("totalDescuentos");
  const promedioEl = document.getElementById("ticketPromedio");

  if (descuentoEl) descuentoEl.innerText = formatoMoneda(descuentos);
  if (promedioEl) promedioEl.innerText = formatoMoneda(ticketPromedio);
}

// =================================
// RENDER VENTAS
// =================================

function renderVentas(lista = ventas) {
  const cont = document.getElementById("listaVentas");
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

  [...lista].reverse().forEach(v => {
    const subtotal =
      Number(v.subtotal || v.total || 0);

    const descuento =
      Number(v.descuento || 0);

    const total =
      Number(v.total || 0);

    const tr = document.createElement("tr");

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
  const desde = document.getElementById("fechaDesde")?.value;
  const hasta = document.getElementById("fechaHasta")?.value;

  const filtradas = ventas.filter(v => {
    const fechaVenta = v.fechaISO || obtenerFechaISO(v.fecha);

    if (!fechaVenta) return true;

    if (desde && fechaVenta < desde) return false;
    if (hasta && fechaVenta > hasta) return false;

    return true;
  });

  renderVentas(filtradas);
}

// =================================
// DETALLE VENTA
// =================================

function verDetalle(id) {
  const venta = ventas.find(
    v => Number(v.id) === Number(id)
  );

  if (!venta) return;

  const detalle = Array.isArray(venta.detalle)
    ? venta.detalle
    : [];

  const detalleHTML = detalle.length
    ? detalle.map(item => {
        const subtotalItem =
          Number(item.subtotal || item.precio * item.cantidad || 0);

        const descuentoItem =
          Number(item.descuento || 0);

        const totalItem =
          Number(item.total || subtotalItem - descuentoItem);

        return `
          <div class="detail-product">

            <div>
              <strong>${item.nombre || "Producto"}</strong>
              <small>
                ${item.cantidad || 0} x ${formatoMoneda(item.precio)}
              </small>
            </div>

            <div class="detail-product-values">
              <span>Subtotal: ${formatoMoneda(subtotalItem)}</span>
              <span>Desc: -${formatoMoneda(descuentoItem)}</span>
              <strong>Total: ${formatoMoneda(totalItem)}</strong>
            </div>

          </div>
        `;
      }).join("")
    : `
      <div class="empty-state">
        Sin detalle de productos
      </div>
    `;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal historial-modal">

      <div class="modal-header-pro">
        <div>
          <h3>Detalle de venta</h3>
          <p>Ticket #${venta.id}</p>
        </div>

        <button
          type="button"
          class="modal-close"
        >
          ✕
        </button>
        <button
  type="button"
  onclick="reimprimirTicket(${venta.id})"
>
  Reimprimir ticket
</button>
      </div>

      <div class="sale-detail-grid">

        <div>
          <span>Fecha</span>
          <strong>${venta.fecha || "-"}</strong>
        </div>

        <div>
          <span>Método</span>
          <strong>${formatearMetodo(venta.metodo)}</strong>
        </div>

        <div>
          <span>Usuario</span>
          <strong>${venta.usuario || "Local"}</strong>
        </div>

      </div>

      <div class="detail-list">
        ${detalleHTML}
      </div>

      <div class="sale-total-box">

        <div>
          <span>Subtotal</span>
          <strong>${formatoMoneda(venta.subtotal || venta.total)}</strong>
        </div>

        <div>
          <span>Desc. productos</span>
          <strong>-${formatoMoneda(venta.descuentoProductos || 0)}</strong>
        </div>

        <div>
          <span>Desc. carrito</span>
          <strong>-${formatoMoneda(venta.descuentoCarrito || 0)}</strong>
        </div>

        <div class="sale-total-final">
          <span>Total final</span>
          <strong>${formatoMoneda(venta.total)}</strong>
        </div>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector(".modal-close").onclick = () => {
    overlay.remove();
  };

  overlay.onclick = e => {
    if (e.target === overlay) {
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
    fecha: new Date().toLocaleString(),
    usuario:
      JSON.parse(localStorage.getItem("usuario"))?.nombre || "Admin"
  });

  localStorage.setItem("historial", JSON.stringify(historial));
}

// =================================
// RENDER HISTORIAL
// =================================

function renderHistorial() {
  const cont = document.getElementById("listaHistorial");
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

  cont.innerHTML = historial
    .slice(0, 25)
    .map(h => {
      const esError = h.tipo === "error";

      return `
        <div class="timeline-item-pro ${esError ? "timeline-error" : ""}">

          <div class="timeline-dot"></div>

          <div class="timeline-content">

            <div>
              <h4>${h.modulo || "Sistema"}</h4>
              <p>${h.descripcion || "-"}</p>
              <small>${h.fecha || "-"}</small>
            </div>

            <span class="${esError ? "badge-danger" : "badge-success"}">
              ${h.usuario || "Admin"}
            </span>

          </div>

        </div>
      `;
    }).join("");
}

// =================================
// LIMPIAR HISTORIAL
// =================================

function limpiarHistorial() {
  if (historial.length === 0) {
    showToast("No hay historial", "info");
    return;
  }

  const confirmar = confirm("¿Eliminar historial completo?");

  if (!confirmar) return;

  localStorage.setItem("historial", JSON.stringify([]));

  historial = [];

  renderHistorial();

  showToast("Historial eliminado", "success");
}
function reimprimirTicket(id) {
  const venta = ventas.find(
    v => Number(v.id) === Number(id)
  );

  if (!venta) {
    showToast("Venta no encontrada", "error");
    return;
  }

  imprimirTicketHistorial(venta);
}
function imprimirTicketHistorial(venta) {

  function metodoTicket(metodo) {

    const metodos = {
      efectivo: "EFECTIVO",
      transferencia: "TRANSFERENCIA",
      mp: "MERCADO PAGO",
      qr: "QR",
      qr_banco: "QR BANCO",
      promo_bn: "PROMO NACIÓN"
    };

    return metodos[metodo] || metodo || "-";
  }

  function lineaProducto(item) {

    const cantidad =
      item.cantidad || 0;

    const nombre =
      String(item.nombre || "Producto")
        .slice(0, 18);

    const total =
      Number(
        item.total ||
        item.subtotal ||
        0
      );

    return `${cantidad}x ${nombre.padEnd(18, " ")} ${formatoMoneda(total)}`;
  }

  const detalle = (venta.detalle || [])
    .map(item => lineaProducto(item))
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

  line-height:
    1.25;
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

.brand {

  font-size:
    13px;

  font-weight:
    bold;

  letter-spacing:
    1px;
}

.small {

  font-size:
    10px;
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
Fecha: ${venta.fecha || "-"}
Usuario: ${venta.usuario || "Lodefausti"}
Venta Nº: ${venta.id || "-"}
Metodo: ${metodoTicket(venta.metodo)}
</pre>

<div class="line"></div>

<pre>
${detalle}
</pre>

<div class="line"></div>

<div class="row">
<span>Subtotal:</span>
<strong>${formatoMoneda(venta.subtotal || venta.total || 0)}</strong>
</div>

<div class="row">
<span>Descuento:</span>
<strong>-${formatoMoneda(venta.descuento || 0)}</strong>
</div>

<div class="line"></div>

<div class="total">
TOTAL<br>
${formatoMoneda(venta.total || 0)}
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

  const ventana = window.open(
    "",
    "_blank",
    "width=300,height=600"
  );

  if (!ventana) {

    showToast(
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

document.addEventListener("DOMContentLoaded", () => {
  renderVentas();
  renderHistorial();
  renderStats();
});