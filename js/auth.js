let usuario = JSON.parse(localStorage.getItem("usuario")) || {
  nombre: "Local",
  rol: "LOCAL" // ADMIN o LOCAL
};

function esAdmin() {
  return usuario.rol === "ADMIN";
}
// =================================
// AUTH
// =================================

const auth =
  localStorage.getItem("auth");

// SI NO ESTÁ LOGUEADO
if (!auth) {

  window.location.href =
    "login.html";
}