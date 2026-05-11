// =================================
// LOGIN
// =================================

function login() {

  const usuario =
    document
      .getElementById("usuario")
      .value;

  const password =
    document
      .getElementById("password")
      .value;

  // ADMIN
  if (
    usuario === "admin" &&
    password === "1234"
  ) {

    localStorage.setItem(
      "auth",
      "true"
    );

    localStorage.setItem(
      "usuarioActual",
      "Administrador"
    );

    localStorage.setItem(
      "rol",
      "ADMIN"
    );

    window.location.href =
      "index.html";

    return;
  }

  // LOCAL
  if (
    usuario === "local" &&
    password === "1234"
  ) {

    localStorage.setItem(
      "auth",
      "true"
    );

    localStorage.setItem(
      "usuarioActual",
      "Local"
    );

    localStorage.setItem(
      "rol",
      "LOCAL"
    );

    window.location.href =
      "index.html";

    return;
  }

  alert("Usuario o contraseña incorrectos");
}