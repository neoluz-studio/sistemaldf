// =================================
// SOLO ADMIN
// =================================

if (

  localStorage.getItem("rol")
  !== "ADMIN"

) {

  showToast(
    "Acceso solo para administradores",
    "error"
  );

  setTimeout(() => {

    window.location.href =
      "index.html";

  }, 1200);
}

// =================================
// STORAGE
// =================================

let historial =
  JSON.parse(
    localStorage.getItem(
      "historial"
    )
  ) || [];

// =================================
// ICONOS
// =================================

const iconos = {

  venta: "🛒",

  ingreso: "💰",

  egreso: "💸",

  produccion: "🏭",

  proveedor: "🚚",

  sistema: "⚙️",

  login: "🔐",

  backup: "💾"
};

// =================================
// BADGES
// =================================

function getBadge(tipo) {

  switch (tipo) {

    case "egreso":
      return "badge-danger";

    case "venta":
      return "badge-success";

    case "ingreso":
      return "badge-success";

    case "produccion":
      return "badge-info";

    default:
      return "badge-warning";
  }
}

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

  // VACIO
  if (historial.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">

        No hay actividad registrada

      </div>
    `;

    return;
  }

  // MÁS NUEVOS ARRIBA
  [...historial]
    .reverse()
    .slice(0, 50)
    .forEach(h => {

      const div =
        document.createElement("div");

      div.className =
        "activity-card";

      div.innerHTML = `

        <div class="activity-left">

          <h4>

            ${iconos[h.tipo] || "📌"}

            ${h.descripcion || "-"}

          </h4>

          <p>

            ${h.modulo || "Sistema"}

            •

            ${h.usuario || "Admin"}

            •

            ${h.fecha || "-"}

          </p>

        </div>

        <div class="activity-right">

          <span class="
            ${getBadge(h.tipo)}
          ">

            ${(h.tipo || "evento")
              .toUpperCase()}

          </span>

          <div class="activity-money">

            ${h.monto

              ? `$${Number(h.monto)
                  .toLocaleString()}`

              : ""
            }

          </div>

        </div>
      `;

      cont.appendChild(div);
    });
}

// =================================
// INIT
// =================================

renderHistorial();
