// =========================
// EXPORTAR
// =========================

function exportarBackup() {

  const backup = {

    productos:
      JSON.parse(localStorage.getItem("productos")) || [],

    ventas:
      JSON.parse(localStorage.getItem("ventas")) || [],

    caja:
      JSON.parse(localStorage.getItem("caja")) || [],

    recetas:
      JSON.parse(localStorage.getItem("recetas")) || [],

    proveedores:
      JSON.parse(localStorage.getItem("proveedores")) || []
  };

  const blob =
    new Blob(
      [JSON.stringify(backup, null, 2)],
      {
        type: "application/json"
      }
    );

  const a =
    document.createElement("a");

  a.href =
    URL.createObjectURL(blob);

  a.download =
    "backup-fausti.json";

  a.click();

  showToast(
    "Backup descargado"
  );
}

// =========================
// IMPORTAR
// =========================

function importarBackup() {

  const file =
    document.getElementById("backupFile")
      .files[0];

  if (!file) {

    showToast(
      "Seleccioná un archivo",
      "error"
    );

    return;
  }

  const reader =
    new FileReader();

  reader.onload = e => {

    try {

      const data =
        JSON.parse(e.target.result);

      // RESTAURAR
      Object.keys(data).forEach(key => {

        localStorage.setItem(
          key,
          JSON.stringify(data[key])
        );
      });

      showToast(
        "Backup restaurado"
      );

      setTimeout(() => {

        location.reload();

      }, 1200);

    } catch {

      showToast(
        "Archivo inválido",
        "error"
      );
    }
  };

  reader.readAsText(file);
}