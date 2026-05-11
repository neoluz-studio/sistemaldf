// =========================
// SESION
// =========================

const usuario =
  JSON.parse(localStorage.getItem("usuario"));

// SI NO HAY LOGIN
if (!usuario &&
    !window.location.pathname.includes("login.html")) {

  window.location.href =
    "login.html";
}

// =========================
// USERNAME
// =========================

const nombreEl =
  document.getElementById("userNombre");

if (nombreEl && usuario) {

  nombreEl.innerText =
    usuario.nombre +
    " • " +
    usuario.rol;
}

// =========================
// ADMIN ONLY
// =========================

const adminItems =
  document.querySelectorAll(".admin-only");

adminItems.forEach(item => {

  if (usuario?.rol !== "ADMIN") {

    item.style.display = "none";
  }
});

// =========================
// LOGOUT
// =========================

function logout() {

  localStorage.removeItem("auth");

  localStorage.removeItem("usuarioActual");

  localStorage.removeItem("rol");

  window.location.href =
    "login.html";
}