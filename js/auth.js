let usuario = JSON.parse(localStorage.getItem("usuario")) || {
  nombre: "Local",
  rol: "LOCAL" // ADMIN o LOCAL
};

function esAdmin() {
  return usuario.rol === "ADMIN";
}