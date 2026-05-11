// =================================
// TOAST
// =================================

function showToast(

  mensaje,
  tipo = "success"

) {

  let container =
    document.querySelector(
      ".toast-container"
    );

  // CREAR CONTAINER
  if (!container) {

    container =
      document.createElement("div");

    container.className =
      "toast-container";

    document.body.appendChild(container);
  }

  // TOAST
  const toast =
    document.createElement("div");

  toast.className =
    `toast ${tipo}`;

  const iconos = {

  success: "✅",
  error: "❌",
  info: "ℹ️"
};

toast.innerHTML = `

  <div class="toast-content">

    <span class="toast-icon">
      ${iconos[tipo]}
    </span>

    <strong>
      ${mensaje}
    </strong>

  </div>
`;
  container.appendChild(toast);

  // REMOVE
  setTimeout(() => {

    toast.style.opacity = "0";

    toast.style.transform =
      "translateX(100px)";

    setTimeout(() => {

      toast.remove();

    }, 300);

  }, 2500);
}