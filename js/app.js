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

  const overlay =

    document.getElementById(
      "sidebarOverlay"
    );

  if (!sidebar) return;

  sidebar.classList.toggle(
    "active"
  );

  overlay?.classList.toggle(
    "active"
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
// =================================
// FILTRO DASHBOARD
// =================================

function filtrarDashboard(tipo) {

  // BOTONES
  document

    .querySelectorAll(
      ".filter-btn"
    )

    .forEach(btn => {

      btn.classList.remove(
        "active"
      );
    });

  const botones =

    document.querySelectorAll(
      ".filter-btn"
    );

  // ACTIVO
  if (tipo === "hoy") {

    botones[0]
      ?.classList.add(
        "active"
      );
  }

  if (tipo === "semana") {

    botones[1]
      ?.classList.add(
        "active"
      );
  }

  if (tipo === "mes") {

    botones[2]
      ?.classList.add(
        "active"
      );
  }

  console.log(
    "Filtro:",
    tipo
  );
}
// =================================
// INVENTARIO SEMANAL
// =================================

function renderInventarioSemanal() {

  const cont =

    document.getElementById(
      "inventarioSemanal"
    );

  if (!cont) return;

  const productos =

    JSON.parse(

      localStorage.getItem(
        "productos"
      )

    ) || [];

  cont.innerHTML = "";

  // VACIO
  if (productos.length === 0) {

    cont.innerHTML = `

      <tr>

        <td colspan="3">

          No hay productos

        </td>

      </tr>
    `;

    return;
  }

  // STOCK BAJO ARRIBA
  productos.sort(

    (a, b) =>

      a.stock - b.stock
  );

  productos.forEach(p => {

    const estado =

      p.stock <= 5

      ? `
        <span class="stock-low">
          ⚠️ Bajo
        </span>
      `

      : `
        <span class="stock-ok">
          ✅ Correcto
        </span>
      `;

    cont.innerHTML += `

      <tr>

        <td>

          ${p.nombre}

        </td>

        <td>

          ${p.stock}

        </td>

        <td>

          ${estado}

        </td>

      </tr>
    `;
  });
}

// =================================
// INIT INVENTARIO
// =================================

renderInventarioSemanal();
// =================================
// DASHBOARD REAL
// =================================

function renderDashboardReal() {

  const ventas =

    JSON.parse(

      localStorage.getItem(
        "ventas"
      )

    ) || [];

  const hoy =

    new Date()

      .toLocaleDateString(
        "es-AR"
      );

  const mesActual =

    new Date()
      .getMonth();

  let ventasHoy = 0;

  let ventasMes = 0;

  let ganancia = 0;

  let productosVendidos = 0;

  ventas.forEach(v => {

    const fechaVenta =

      new Date(v.fecha);

    const fechaTexto =

      fechaVenta
        .toLocaleDateString(
          "es-AR"
        );

    // HOY
    if (fechaTexto === hoy) {

      ventasHoy +=
        Number(v.total || 0);
    }

    // MES
    if (

      fechaVenta.getMonth()

      ===

      mesActual

    ) {

      ventasMes +=
        Number(v.total || 0);
    }

    // PRODUCTOS
    if (v.items) {

      v.items.forEach(i => {

        productosVendidos +=

          Number(
            i.cantidad || 0
          );

        const costo =

          Number(
            i.costo || 0
          );

        const precio =

          Number(
            i.precio || 0
          );

        ganancia +=

          (precio - costo)

          *

          Number(
            i.cantidad || 0
          );
      });
    }
  });

  // =================================
  // RENDER
  // =================================

  const set = (id, value) => {

    const el =

      document.getElementById(
        id
      );

    if (el) {

      el.innerText = value;
    }
  };

  set(

    "ventasHoy",

    `$${ventasHoy.toLocaleString()}`
  );

  set(

    "ventasMes",

    `$${ventasMes.toLocaleString()}`
  );

  set(

    "gananciaTotal",

    `$${Math.round(
      ganancia
    ).toLocaleString()}`
  );

  set(

    "productosVendidos",

    productosVendidos
  );
}

// =================================
// INIT DASHBOARD
// =================================

renderDashboardReal();