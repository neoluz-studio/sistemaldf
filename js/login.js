// =========================
// USUARIOS
// =========================

const usuarios = [

  {
    user: "admin",
    pass: "1234",
    rol: "ADMIN",
    nombre: "Administrador"
  },

  {
    user: "local",
    pass: "1234",
    rol: "LOCAL",
    nombre: "Caja"
  }
];

// =========================
// LOGIN
// =========================

function login() {

  const user =
    document.getElementById("usuario").value;

  const pass =
    document.getElementById("password").value;

  const encontrado =
    usuarios.find(u =>
      u.user === user &&
      u.pass === pass
    );

  if (!encontrado) {

    showToast(
      "Usuario o contraseña incorrectos",
      "error"
    );

    return;
  }

  localStorage.setItem(
    "usuario",
    JSON.stringify(encontrado)
  );

  showToast(
    "Bienvenido " + encontrado.nombre
  );

  setTimeout(() => {

    window.location.href =
      "index.html";

  }, 1000);
}