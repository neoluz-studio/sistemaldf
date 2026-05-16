// =================================
// TOAST
// =================================

function showToast(

  mensaje,
  tipo = "success"

) {

  // EVITAR DUPLICADOS
  const yaExiste =
    [...document.querySelectorAll(".toast")]
      .find(t =>
        t.innerText.includes(mensaje)
      );

  if (yaExiste) return;

  // =================================
  // CONTAINER
  // =================================

  let container =
    document.querySelector(
      ".toast-container"
    );

  if (!container) {

    container =
      document.createElement("div");

    container.className =
      "toast-container";

    document.body.appendChild(
      container
    );
  }

  // =================================
  // ICONOS
  // =================================

  const iconos = {

    success: "✅",

    error: "❌",

    info: "ℹ️",

    warning: "⚠️"
  };

  // =================================
  // TOAST
  // =================================

  const toast =
    document.createElement("div");

  toast.className =
    `toast ${tipo}`;

  toast.innerHTML = `

    <div class="toast-content">

      <span class="toast-icon">

        ${iconos[tipo] || "🔔"}

      </span>

      <strong>

        ${mensaje}

      </strong>

    </div>
  `;

  container.appendChild(toast);

  // =================================
  // SHOW
  // =================================

  requestAnimationFrame(() => {

    toast.classList.add("show");
  });

  // =================================
  // REMOVE
  // =================================

  setTimeout(() => {

    toast.classList.remove("show");

    toast.classList.add("hide");

    setTimeout(() => {

      toast.remove();

    }, 300);

  }, 2500);
}