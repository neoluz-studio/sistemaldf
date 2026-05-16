// =================================
// STORAGE DISPONIBLE
// =================================

function storageDisponible() {

  try {

    localStorage.setItem(
      "__test",
      "ok"
    );

    localStorage.removeItem(
      "__test"
    );

    return true;

  } catch {

    return false;
  }
}

// =================================
// VALIDAR STORAGE
// =================================

if (!storageDisponible()) {

  alert(
    "El navegador no permite almacenamiento local."
  );
}

// =================================
// USUARIO
// =================================

let usuario =
  JSON.parse(
    localStorage.getItem("usuario")
  ) || null;

// =================================
// VALIDAR ADMIN
// =================================

function esAdmin() {

  return (
    usuario?.rol === "ADMIN"
  );
}

// =================================
// AUTH
// =================================

function verificarAuth() {

  // SESION
  const auth =
    JSON.parse(
      localStorage.getItem("auth")
    );

  // NO LOGIN
  if (!auth) {

    window.location.href =
      "login.html";

    return;
  }

  // USUARIO INVALIDO
  if (

    !usuario ||
    !usuario.nombre ||
    !usuario.rol

  ) {

    cerrarSesion();

    return;
  }

  // GUARDAR ROL GLOBAL
  localStorage.setItem(
    "rol",
    usuario.rol
  );

  // MOSTRAR NOMBRE
  const nombreEl =
    document.getElementById(
      "userNombre"
    );

  if (nombreEl) {

    nombreEl.innerText =
      usuario.nombre;
  }

  // ADMIN ONLY
  document
    .querySelectorAll(".admin-only")
    .forEach(el => {

      if (!esAdmin()) {

        el.style.display = "none";
      }
    });
}

// =================================
// CERRAR SESION
// =================================

function cerrarSesion() {

  localStorage.removeItem(
    "auth"
  );

  localStorage.removeItem(
    "usuario"
  );

  localStorage.removeItem(
    "rol"
  );

  window.location.href =
    "login.html";
}

// =================================
// LOGOUT GLOBAL
// =================================

function logout() {

  cerrarSesion();
}

// =================================
// INIT
// =================================

verificarAuth();