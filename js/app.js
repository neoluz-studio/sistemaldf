function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
let productos = getData("productos");
// =================================
// MODAL CONFIRM
// =================================

function mostrarConfirmacion(

  texto,
  callback

) {

  const overlay =
    document.createElement("div");

  overlay.className =
    "modal-overlay";

  overlay.innerHTML = `

    <div class="modal">

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

  document.body.appendChild(overlay);

  // CANCELAR
  overlay
    .querySelector(".btn-cancel")
    .onclick = () => {

      overlay.remove();
    };

  // CONFIRMAR
  overlay
    .querySelector(".btn-confirm")
    .onclick = () => {

      callback();

      overlay.remove();
    };
}