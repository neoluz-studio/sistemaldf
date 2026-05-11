// =================================
// HISTORIAL
// =================================

let historial =
  JSON.parse(
    localStorage.getItem("historial")
  ) || [];

// =================================
// ICONOS
// =================================

const iconos = {

  venta: "🛒",

  ingreso: "💰",

  egreso: "💸",

  produccion: "🏭",

  proveedor: "🚚"
};

// =================================
// RENDER
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

  historial.forEach(h => {

    const div =
      document.createElement("div");

    div.className =
      "activity-card";

    div.innerHTML = `

      <div class="activity-left">

        <h4>

          ${iconos[h.tipo] || "📌"}
          ${h.descripcion}

        </h4>

        <p>

          ${h.modulo}
          •
          ${h.usuario}
          •
          ${h.fecha}

        </p>

      </div>

      <div class="activity-money">

        ${h.monto
          ? `$${h.monto}`
          : ""}

      </div>
    `;

    cont.appendChild(div);
  });
}

// INIT
renderHistorial();