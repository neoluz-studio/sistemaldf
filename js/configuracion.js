// =================================
// SOLO ADMIN
// =================================

if (

  localStorage.getItem("rol")
  !== "ADMIN"

) {

  showToast(
    "Acceso solo administradores",
    "error"
  );

  setTimeout(() => {

    window.location.href =
      "index.html";

  }, 1200);
}

// =================================
// EXPORTAR BACKUP
// =================================

function exportarBackup() {

  const backup = {

    productos:
      JSON.parse(
        localStorage.getItem(
          "productos"
        )
      ) || [],

    ventas:
      JSON.parse(
        localStorage.getItem(
          "ventas"
        )
      ) || [],

    caja:
      JSON.parse(
        localStorage.getItem(
          "caja"
        )
      ) || [],

    recetas:
      JSON.parse(
        localStorage.getItem(
          "recetas"
        )
      ) || [],

    proveedores:
      JSON.parse(
        localStorage.getItem(
          "proveedores"
        )
      ) || [],

    cuentas:
      JSON.parse(
        localStorage.getItem(
          "cuentas"
        )
      ) || [],

    historial:
      JSON.parse(
        localStorage.getItem(
          "historial"
        )
      ) || [],

    fecha:
      new Date()
        .toLocaleString()
  };

  const blob =
    new Blob(

      [
        JSON.stringify(
          backup,
          null,
          2
        )
      ],

      {
        type:
          "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    `backup-fausti-${Date.now()}.json`;

  a.click();

  URL.revokeObjectURL(url);

  showToast(
    "Backup descargado",
    "success"
  );
}

// =================================
// IMPORTAR BACKUP
// =================================

function importarBackup() {

  const file =
    document.getElementById(
      "backupFile"
    ).files[0];

  if (!file) {

    showToast(
      "Seleccioná un archivo",
      "error"
    );

    return;
  }

  // VALIDAR JSON
  if (
    !file.name.endsWith(".json")
  ) {

    showToast(
      "Archivo inválido",
      "error"
    );

    return;
  }

  const reader =
    new FileReader();

  reader.onload = e => {

    try {

      const data =
        JSON.parse(
          e.target.result
        );

      // VALIDAR
      if (
        typeof data !== "object"
      ) {

        throw new Error();
      }

      // CONFIRM
      showConfirm({

        title:
          "Restaurar backup",

        message:
          "Se reemplazarán todos los datos actuales.",

        onConfirm: () => {

          // PRODUCTOS
          localStorage.setItem(

            "productos",

            JSON.stringify(
              data.productos || []
            )
          );

          // VENTAS
          localStorage.setItem(

            "ventas",

            JSON.stringify(
              data.ventas || []
            )
          );

          // CAJA
          localStorage.setItem(

            "caja",

            JSON.stringify(
              data.caja || []
            )
          );

          // RECETAS
          localStorage.setItem(

            "recetas",

            JSON.stringify(
              data.recetas || []
            )
          );

          // PROVEEDORES
          localStorage.setItem(

            "proveedores",

            JSON.stringify(
              data.proveedores || []
            )
          );

          // CUENTAS
          localStorage.setItem(

            "cuentas",

            JSON.stringify(
              data.cuentas || []
            )
          );

          // HISTORIAL
          localStorage.setItem(

            "historial",

            JSON.stringify(
              data.historial || []
            )
          );

          showToast(
            "Backup restaurado",
            "success"
          );

          setTimeout(() => {

            window.location.reload();

          }, 1200);
        }
      });

    } catch {

      showToast(
        "Backup inválido",
        "error"
      );
    }
  };

  reader.readAsText(file);
}