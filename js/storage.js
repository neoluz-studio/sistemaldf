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
// GET STORAGE
// =================================

function getStorage(

  key,
  fallback = []

) {

  // STORAGE OFF
  if (!storageDisponible()) {

    console.error(
      "LocalStorage no disponible"
    );

    return fallback;
  }

  try {

    const data =
      localStorage.getItem(key);

    // VACIO
    if (

      data === null ||
      data === undefined ||
      data === ""

    ) {

      return fallback;
    }

    return JSON.parse(data);

  } catch (error) {

    console.error(

      `Error leyendo ${key}:`,

      error
    );

    // LIMPIAR DAÑADO
    localStorage.removeItem(key);

    return fallback;
  }
}

// =================================
// SET STORAGE
// =================================

function setStorage(

  key,
  value

) {

  if (!storageDisponible()) {

    showToast(
      "El navegador no permite guardar datos",
      "error"
    );

    return false;
  }

  try {

    localStorage.setItem(

      key,

      JSON.stringify(value)
    );

    return true;

  } catch (error) {

    console.error(

      `Error guardando ${key}:`,

      error
    );

    showToast(
      "Error guardando datos",
      "error"
    );

    return false;
  }
}

// =================================
// REMOVE STORAGE
// =================================

function removeStorage(key) {

  try {

    localStorage.removeItem(key);

    return true;

  } catch (error) {

    console.error(

      `Error eliminando ${key}:`,

      error
    );

    return false;
  }
}

// =================================
// CLEAR STORAGE
// =================================

function clearStorage() {

  try {

    localStorage.clear();

    return true;

  } catch (error) {

    console.error(
      "Error limpiando storage",
      error
    );

    return false;
  }
}

// =================================
// EXISTE STORAGE
// =================================

function hasStorage(key) {

  return (
    localStorage.getItem(key)
    !== null
  );
}

// =================================
// UPDATE STORAGE
// =================================

function updateStorage(

  key,
  callback,
  fallback = []

) {

  const actual =
    getStorage(
      key,
      fallback
    );

  const actualizado =
    callback(actual);

  setStorage(
    key,
    actualizado
  );

  return actualizado;
}