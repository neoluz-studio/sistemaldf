// =================================
// USER
// =================================

const usuario =
  localStorage.getItem(
    "usuarioActual"
  );

const rol =
  localStorage.getItem(
    "rol"
  );

// USERNAME
const nombreEl =
  document.getElementById(
    "userNombre"
  );

if (nombreEl) {

  nombreEl.innerText =
    usuario || "Usuario";
}

// =================================
// ADMIN ONLY
// =================================

const adminItems =
  document.querySelectorAll(
    ".admin-only"
  );

// SI NO ES ADMIN
if (rol !== "ADMIN") {

  adminItems.forEach(el => {

    el.style.display = "none";
  });
}

// =================================
// LOGOUT
// =================================

function logout() {

  localStorage.removeItem(
    "auth"
  );

  localStorage.removeItem(
    "usuarioActual"
  );

  localStorage.removeItem(
    "rol"
  );

  window.location.href =
    "login.html";
}