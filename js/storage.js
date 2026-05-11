// =========================
// USUARIO INICIAL
// =========================

if (!localStorage.getItem("usuario")) {

  localStorage.setItem("usuario", JSON.stringify({
    nombre: "Administrador",
    rol: "ADMIN"
  }));
}

// =========================
// SIDEBAR
// =========================

// =========================
// SIDEBAR
// =========================

// =========================
// MOBILE SIDEBAR
// =========================

function toggleSidebar() {

  const sidebar =
    document.getElementById("sidebar");

  if (!sidebar) return;

  sidebar.classList.toggle("mobile-open");
}

// =========================
// DARK MODE
// =========================

function toggleDarkMode() {

  document.body.classList.toggle("dark");

  const dark = document.body.classList.contains("dark");

  localStorage.setItem("darkMode", dark);
}

// RESTAURAR DARK MODE
if (localStorage.getItem("darkMode") === "true") {

  document.body.classList.add("dark");
}

// =========================
// FORMATO MONEDA
// =========================

function formatoPeso(valor) {

  return "$" + Number(valor).toLocaleString("es-AR");
}

// =========================
// FECHA ACTUAL
// =========================

function fechaActual() {

  return new Date().toLocaleString("es-AR");
}
// =========================
// TOASTS
// =========================

function showToast(message, type = "success") {

  let container =
    document.querySelector(".toast-container");

  if (!container) {

    container = document.createElement("div");

    container.className = "toast-container";

    document.body.appendChild(container);
  }

  const toast = document.createElement("div");

  toast.className = `toast ${type}`;

  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {

    toast.remove();

  }, 3000);
}

// =========================
// MODAL CONFIRM
// =========================

function showConfirm({
  title = "Confirmar",
  message = "¿Seguro?",
  onConfirm = () => {}
}) {

  const overlay =
    document.createElement("div");

  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal">

      <h3>${title}</h3>

      <p>${message}</p>

      <div class="modal-actions">

        <button class="btn-cancel">
          Cancelar
        </button>

        <button class="btn-danger">
          Confirmar
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // CANCELAR
  overlay.querySelector(".btn-cancel")
    .onclick = () => {

      overlay.remove();
    };

  // CONFIRMAR
  overlay.querySelector(".btn-danger")
    .onclick = () => {

      onConfirm();

      overlay.remove();
    };
}
// =========================
// TICKET POS
// =========================

function mostrarTicket(venta) {

  let productosHTML = "";

  venta.detalle.forEach(item => {

    productosHTML += `

      <div class="ticket-item">

        <span>
          ${item.nombre}
          x${item.cantidad}
        </span>

        <strong>
          $${(
            item.precio *
            item.cantidad
          ).toLocaleString()}
        </strong>

      </div>
    `;
  });

  const overlay =
    document.createElement("div");

  overlay.className =
    "modal-overlay";

  overlay.innerHTML = `

    <div class="modal ticket-modal">

      <div class="ticket-header">

        <h2>
          🧊 Lo de Fausti
        </h2>

        <p>
          Ticket de venta
        </p>

      </div>

      <div class="ticket-info">

        <small>
          ${venta.fecha}
        </small>

        <small>
          Pago:
          ${venta.metodo}
        </small>

      </div>

      <div class="ticket-products">

        ${productosHTML}

      </div>

      <div class="ticket-total">

        TOTAL:
        $${venta.total.toLocaleString()}

      </div>

      <div class="modal-actions">

        <button
          class="btn-cancel"
          onclick="this.closest('.modal-overlay').remove()"
        >
          Cerrar
        </button>

        <button onclick="window.print()">
          🖨 Imprimir
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);
}
// =========================
// COMMAND PALETTE
// =========================

document.addEventListener("keydown", e => {

  // CTRL + K
  if (e.ctrlKey && e.key === "k") {

    e.preventDefault();

    toggleCommandPalette();
  }

  // ESC
  if (e.key === "Escape") {

    cerrarCommandPalette();
  }
});

// TOGGLE
function toggleCommandPalette() {

  const palette =
    document.getElementById("commandPalette");

  if (!palette) return;

  palette.classList.toggle("hidden");

  const input =
    document.getElementById("commandInput");

  setTimeout(() => {

    input?.focus();

  }, 100);
}

// CERRAR
function cerrarCommandPalette() {

  const palette =
    document.getElementById("commandPalette");

  if (!palette) return;

  palette.classList.add("hidden");
}

// BUSCAR
function buscarGlobal() {

  const texto =
    document.getElementById("commandInput")
      .value
      .toLowerCase();

  const resultados =
    document.getElementById("commandResults");

  resultados.innerHTML = "";

  // MODULOS
  const modulos = [

    {
      nombre: "Ventas",
      link: "ventas.html"
    },

    {
      nombre: "Productos",
      link: "productos.html"
    },

    {
      nombre: "Caja",
      link: "caja.html"
    },

    {
      nombre: "Producción",
      link: "produccion.html"
    },

    {
      nombre: "Historial",
      link: "historial.html"
    }
  ];

  // PRODUCTOS
  const productos =
    JSON.parse(localStorage.getItem("productos")) || [];

  // BUSCAR MODULOS
  modulos
    .filter(m =>
      m.nombre.toLowerCase().includes(texto)
    )
    .forEach(m => {

      resultados.innerHTML += `

        <div
          class="command-item"
          onclick="window.location.href='${m.link}'"
        >

          📂 ${m.nombre}

        </div>
      `;
  });

  // BUSCAR PRODUCTOS
  productos
    .filter(p =>
      p.nombre.toLowerCase().includes(texto)
    )
    .slice(0, 6)
    .forEach(p => {

      resultados.innerHTML += `

        <div class="command-item">

          📦 ${p.nombre}

          <small>
            Stock:
            ${p.stock}
          </small>

        </div>
      `;
  });
}
// =========================
// NOTIFICACIONES AUTO
// =========================

function verificarNotificaciones() {

  const productos =
    JSON.parse(localStorage.getItem("productos")) || [];

  const caja =
    JSON.parse(localStorage.getItem("caja")) || [];

  const ventas =
    JSON.parse(localStorage.getItem("ventas")) || [];

  // =====================
  // STOCK CRITICO
  // =====================

  const stockCritico =
    productos.filter(p => p.stock <= 3);

  stockCritico.forEach(p => {

    const key =
      "notif-stock-" + p.id;

    // EVITAR REPETIR
    if (!sessionStorage.getItem(key)) {

      showToast(

        `⚠️ ${p.nombre} con stock crítico`,

        "error"
      );

      sessionStorage.setItem(key, "1");
    }
  });

  // =====================
  // SIN STOCK
  // =====================

  const sinStock =
    productos.filter(p => p.stock <= 0);

  sinStock.forEach(p => {

    const key =
      "notif-empty-" + p.id;

    if (!sessionStorage.getItem(key)) {

      showToast(

        `❌ ${p.nombre} sin stock`,

        "error"
      );

      sessionStorage.setItem(key, "1");
    }
  });

  // =====================
  // CAJA NEGATIVA
  // =====================

  let saldo = 0;

  caja.forEach(m => {

    saldo +=
      m.tipo === "ingreso"
        ? m.monto
        : -m.monto;
  });

  if (saldo < 0 &&
      !sessionStorage.getItem("notif-caja")) {

    showToast(
      "⚠️ Caja negativa",
      "error"
    );

    sessionStorage.setItem(
      "notif-caja",
      "1"
    );
  }

  // =====================
  // VENTA ALTA
  // =====================

  const ultimaVenta =
    ventas[ventas.length - 1];

  if (
    ultimaVenta &&
    ultimaVenta.total >= 50000 &&
    !sessionStorage.getItem(
      "venta-" + ultimaVenta.id
    )
  ) {

    showToast(
      "🔥 Venta alta registrada",
      "success"
    );

    sessionStorage.setItem(
      "venta-" + ultimaVenta.id,
      "1"
    );
  }
}

// INIT
setTimeout(() => {

  verificarNotificaciones();

}, 800);
// CERRAR SIDEBAR AL TOCAR LINK
document.querySelectorAll(".nav-link")
  .forEach(link => {

    link.addEventListener("click", () => {

      if (window.innerWidth <= 768) {

        document
          .getElementById("sidebar")
          ?.classList
          .remove("mobile-open");
      }
    });
});
// =================================
// LOADER
// =================================

window.addEventListener("load", () => {

  setTimeout(() => {

    document
      .getElementById("loader")
      ?.classList
      .add("hidden");

  }, 900);
});