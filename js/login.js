// =================================
// REDIRECT SI YA ESTÁ LOGUEADO
// =================================

const auth =
  JSON.parse(
    localStorage.getItem("auth")
  );

if (auth) {

  window.location.href =
    "index.html";
}

// =================================
// LOGIN
// =================================

function login() {

  const usuarioInput =
    document
      .getElementById("usuario")
      .value
      .trim()
      .toLowerCase();

  const password =
    document
      .getElementById("password")
      .value
      .trim();

  // VALIDAR
  if (
    !usuarioInput ||
    !password
  ) {

    showToast(
      "Completá usuario y contraseña",
      "error"
    );

    return;
  }

  // =================================
  // ADMIN
  // =================================

  if (

    usuarioInput === "admin" &&
    password === "fausti2024"

  ) {

    // SESION
    localStorage.setItem(
      "auth",
      JSON.stringify(true)
    );

    // ROL
    localStorage.setItem(
      "rol",
      "ADMIN"
    );

    // USUARIO
    localStorage.setItem(

      "usuario",

      JSON.stringify({

        nombre:
          "Administrador",

        rol:
          "ADMIN"
      })
    );

    showToast(
      "Bienvenido Administrador",
      "success"
    );

    setTimeout(() => {

      window.location.href =
        "index.html";

    }, 600);

    return;
  }

  // =================================
  // LOCAL
  // =================================

  if (

    usuarioInput === "local" &&
    password === "12345678"

  ) {

    // SESION
    localStorage.setItem(
      "auth",
      JSON.stringify(true)
    );

    // ROL
    localStorage.setItem(
      "rol",
      "LOCAL"
    );

    // USUARIO
    localStorage.setItem(

      "usuario",

      JSON.stringify({

        nombre:
          "Local",

        rol:
          "LOCAL"
      })
    );

    showToast(
      "Bienvenido Local",
      "success"
    );

    setTimeout(() => {

      window.location.href =
        "index.html";

    }, 600);

    return;
  }

  // ERROR
  showToast(
    "Usuario o contraseña incorrectos",
    "error"
  );
}

// =================================
// ENTER
// =================================

document.addEventListener(

  "keydown",

  e => {

    if (e.key === "Enter") {

      login();
    }
  }
);