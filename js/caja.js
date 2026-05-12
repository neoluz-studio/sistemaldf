// =================================
// APERTURAS
// =================================

let aperturas =
  JSON.parse(
    localStorage.getItem(
      "aperturasCaja"
    )
  ) || [];

// =================================
// ABRIR CAJA
// =================================

function abrirCaja() {

  const monto =
    Number(
      document.getElementById(
        "montoInicial"
      ).value
    );

  if (!monto) {

    showToast(
      "Ingresá un monto",
      "error"
    );

    return;
  }

  aperturas.push({

    id: Date.now(),

    tipo: "apertura",

    monto,

    usuario:
      localStorage.getItem(
        "usuarioActual"
      ),

    fecha:
      new Date().toLocaleString()
  });

  localStorage.setItem(
    "aperturasCaja",
    JSON.stringify(aperturas)
  );

  showToast(
    "Caja abierta",
    "success"
  );

  agregarHistorial({

    tipo: "ingreso",

    modulo: "Caja",

    descripcion:
      "Apertura de caja",

    monto
  });
}

// =================================
// CERRAR CAJA
// =================================

function cerrarCaja() {

  const monto =
    Number(
      document.getElementById(
        "montoCierre"
      ).value
    );

  if (!monto) {

    showToast(
      "Ingresá un monto",
      "error"
    );

    return;
  }

  aperturas.push({

    id: Date.now(),

    tipo: "cierre",

    monto,

    usuario:
      localStorage.getItem(
        "usuarioActual"
      ),

    fecha:
      new Date().toLocaleString()
  });

  localStorage.setItem(
    "aperturasCaja",
    JSON.stringify(aperturas)
  );

  showToast(
    "Caja cerrada",
    "info"
  );

  agregarHistorial({

    tipo: "egreso",

    modulo: "Caja",

    descripcion:
      "Cierre de caja",

    monto
  });
}