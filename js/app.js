// =================================
// APP GLOBAL - LO DE FAUSTI
// =================================

// =================================
// PRODUCTOS PARA BUSCADOR GLOBAL
// =================================

let productos =
  typeof getStorage === "function"
    ? getStorage("productos", [])
    : JSON.parse(localStorage.getItem("productos")) || [];

// =================================
// MODAL CONFIRM
// =================================

function mostrarConfirmacion(texto, callback) {
  const existente = document.querySelector(".modal-overlay");

  if (existente) {
    existente.remove();
  }

  const overlay = document.createElement("div");

  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal fade-in">
      <h3>⚠️ Confirmación</h3>

      <p>${texto}</p>

      <div class="modal-actions">
        <button class="btn-cancel">Cancelar</button>
        <button class="btn-confirm">Confirmar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  function cerrar() {
    overlay.remove();

    if (document.activeElement) {
      document.activeElement.blur();
    }
  }

  overlay.querySelector(".btn-cancel").onclick = cerrar;

  overlay.querySelector(".btn-confirm").onclick = () => {
    if (typeof callback === "function") {
      callback();
    }

    cerrar();
  };

  overlay.onclick = e => {
    if (e.target === overlay) {
      cerrar();
    }
  };

  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") {
      cerrar();
      document.removeEventListener("keydown", esc);
    }
  });
}

// =================================
// SHOW CONFIRM GLOBAL
// =================================

function showConfirm({
  title = "Confirmación",
  message = "¿Continuar?",
  onConfirm = () => {}
}) {
  mostrarConfirmacion(message, onConfirm);
}

// =================================
// SIDEBAR MOBILE
// =================================

window.toggleSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (!sidebar) return;

  sidebar.classList.toggle("active");

  if (overlay) {
    overlay.classList.toggle("active");
  }
};

document.addEventListener("click", e => {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (!sidebar) return;

  const clickEnMenu = e.target.closest(".menu-toggle");
  const clickEnSidebar = e.target.closest(".sidebar");

  if (
    !clickEnMenu &&
    !clickEnSidebar &&
    sidebar.classList.contains("active")
  ) {
    sidebar.classList.remove("active");

    if (overlay) {
      overlay.classList.remove("active");
    }
  }
});

document.querySelectorAll(".sidebar-nav a").forEach(link => {
  link.addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    sidebar?.classList.remove("active");
    overlay?.classList.remove("active");
  });
});

// =================================
// COMMAND PALETTE
// =================================

function toggleCommandPalette() {
  const palette = document.getElementById("commandPalette");

  if (!palette) return;

  palette.classList.toggle("hidden");

  const input = document.getElementById("commandInput");

  if (input && !palette.classList.contains("hidden")) {
    input.focus();
  }
}

// =================================
// BUSQUEDA GLOBAL
// =================================

function buscarGlobal() {
  const input = document.getElementById("commandInput");
  const results = document.getElementById("commandResults");

  if (!input || !results) return;

  productos =
    JSON.parse(localStorage.getItem("productos")) || productos || [];

  const texto = input.value.toLowerCase().trim();

  results.innerHTML = "";

  if (!texto) return;

  const encontrados = productos.filter(p =>
    String(p.nombre || "")
      .toLowerCase()
      .includes(texto)
  );

  if (encontrados.length === 0) {
    results.innerHTML = `
      <div class="empty-state">
        Sin resultados
      </div>
    `;
    return;
  }

  encontrados.slice(0, 8).forEach(p => {
    results.innerHTML += `
      <div class="command-item">
        <strong>${p.nombre}</strong>
        <span>Stock: ${p.stock}</span>
      </div>
    `;
  });
}

// =================================
// SHORTCUT CTRL + K
// =================================

document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key.toLowerCase() === "k") {
    e.preventDefault();
    toggleCommandPalette();
  }

  if (e.key === "Escape") {
    const palette = document.getElementById("commandPalette");

    if (palette && !palette.classList.contains("hidden")) {
      palette.classList.add("hidden");
    }
  }
});