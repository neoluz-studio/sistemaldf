// =================================
// USUARIO
// =================================

const usuarioSesion =

  JSON.parse(
    localStorage.getItem(
      "usuario"
    )
  ) || null;

// =================================
// USERNAME
// =================================

const nombreEl =

  document.getElementById(
    "userNombre"
  );

if (nombreEl) {

  nombreEl.innerText =

    usuarioSesion?.nombre ||

    "Usuario";
}

// =================================
// ADMIN ONLY
// =================================

const adminItems =

  document.querySelectorAll(
    ".admin-only"
  );

// SI NO ES ADMIN
if (

  usuarioSesion?.rol !== "ADMIN"

) {

  adminItems.forEach(el => {

    el.style.display = "none";
  });
}

// =================================
// MOSTRAR ROL
// =================================

const roleEl =

  document.querySelector(
    ".user-role"
  );

if (roleEl) {

  roleEl.innerText =

    usuarioSesion?.rol ||

    "LOCAL";
}

// =================================
// LOGOUT
// =================================

function logout() {

  showConfirm({

    title: "Cerrar sesión",

    message:
      "¿Querés cambiar de cuenta?",

    onConfirm: () => {

      // LIMPIAR SESION
      localStorage.removeItem(
        "auth"
      );

      localStorage.removeItem(
        "usuario"
      );

      localStorage.removeItem(
        "rol"
      );

      // REDIRECT
      window.location.href =
        "login.html";
    }
  });
}