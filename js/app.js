// =================================
// STORAGE CENTRALIZADO
// =================================

let productos =
  getStorage(
    "productos",
    []
  );

// =================================
// MODAL CONFIRM
// =================================

function mostrarConfirmacion(

  texto,
  callback

) {

  // EVITAR DUPLICADOS
  const existente =
    document.querySelector(
      ".modal-overlay"
    );

  if (existente) {

    existente.remove();
  }

  // OVERLAY
  const overlay =
    document.createElement("div");

  overlay.className =
    "modal-overlay";

  overlay.innerHTML = `

    <div class="modal fade-in">

      <h3>

        ⚠️ Confirmación

      </h3>

      <p>

        ${texto}

      </p>

      <div class="modal-actions">

        <button class="btn-cancel">

          Cancelar

        </button>

        <button class="btn-confirm">

          Confirmar

        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  // =================================
  // CERRAR
  // =================================

  function cerrar() {

    overlay.remove();

    if (
      document.activeElement
    ) {

      document.activeElement.blur();
    }
  }

  // CANCELAR
  overlay
    .querySelector(".btn-cancel")
    .onclick = cerrar;

  // CONFIRMAR
  overlay
    .querySelector(".btn-confirm")
    .onclick = () => {

      if (
        typeof callback ===
        "function"
      ) {

        callback();
      }

      cerrar();
    };

  // CLICK AFUERA
  overlay.onclick = e => {

    if (
      e.target === overlay
    ) {

      cerrar();
    }
  };

  // ESC
  document.addEventListener(

    "keydown",

    function esc(e) {

      if (e.key === "Escape") {

        cerrar();

        document.removeEventListener(
          "keydown",
          esc
        );
      }
    }
  );
}

// =================================
// SHOW CONFIRM GLOBAL
// =================================

function showConfirm({

  title = "Confirmación",

  message = "¿Continuar?",

  onConfirm = () => {}

}) {

  mostrarConfirmacion(

    message,

    onConfirm
  );
}

// =================================
// SIDEBAR
// =================================

function toggleSidebar() {

  const sidebar =
    document.getElementById(
      "sidebar"
    );

  if (!sidebar) return;

  sidebar.classList.toggle(
    "collapsed"
  );
}

// =================================
// COMMAND PALETTE
// =================================

function toggleCommandPalette() {

  const palette =
    document.getElementById(
      "commandPalette"
    );

  if (!palette) return;

  palette.classList.toggle(
    "hidden"
  );

  const input =
    document.getElementById(
      "commandInput"
    );

  if (
    input &&
    !palette.classList.contains(
      "hidden"
    )
  ) {

    input.focus();
  }
}

// =================================
// BUSQUEDA GLOBAL
// =================================

function buscarGlobal() {

  const input =
    document.getElementById(
      "commandInput"
    );

  const results =
    document.getElementById(
      "commandResults"
    );

  if (!input || !results) return;

  const texto =
    input.value
      .toLowerCase()
      .trim();

  results.innerHTML = "";

  if (!texto) return;

  // PRODUCTOS
  const encontrados =
    productos.filter(p =>

      p.nombre
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

  encontrados
    .slice(0, 8)
    .forEach(p => {

      results.innerHTML += `

        <div class="command-item">

          <strong>

            ${p.nombre}

          </strong>

          <span>

            Stock:
            ${p.stock}

          </span>

        </div>
      `;
    });
}

// =================================
// SHORTCUT
// =================================

document.addEventListener(

  "keydown",

  e => {

    // CTRL + K
    if (

      e.ctrlKey &&
      e.key.toLowerCase() === "k"

    ) {

      e.preventDefault();

      toggleCommandPalette();
    }
  }
);
