// =================================
// STORAGE
// =================================

let productos =

  JSON.parse(

    localStorage.getItem(
      "productos"
    )

  ) || [];

let recetas =

  JSON.parse(

    localStorage.getItem(
      "recetas"
    )

  ) || [];

let historialProduccion =

  JSON.parse(

    localStorage.getItem(
      "historialProduccion"
    )

  ) || [];

// =================================
// ESTADO
// =================================

let recetaActual = null;

// =================================
// GUARDAR
// =================================

function guardarRecetas() {

  localStorage.setItem(

    "recetas",

    JSON.stringify(recetas)
  );
}

function guardarHistorial() {

  localStorage.setItem(

    "historialProduccion",

    JSON.stringify(
      historialProduccion
    )
  );
}

// =================================
// CREAR RECETA
// =================================

function crearReceta() {

  const nombre =

    document.getElementById(
      "nombreReceta"
    ).value.trim();

  const cantidad =

    Number(

      document.getElementById(
        "cantidadProduccion"
      ).value
    );

  // VALIDAR
  if (

    !nombre ||

    cantidad <= 0

  ) {

    showToast(

      "Completá los campos",

      "error"
    );

    return;
  }

  recetaActual = {

    id: Date.now(),

    nombre,

    cantidad,

    ingredientes: []
  };

  recetas.push(
    recetaActual
  );

  guardarRecetas();

  cargarRecetas();

  showToast(

    "Receta creada",

    "success"
  );

  document.getElementById(
    "nombreReceta"
  ).value = "";

  document.getElementById(
    "cantidadProduccion"
  ).value = "";
}

// =================================
// CARGAR PRODUCTOS
// =================================

function cargarProductos() {

  const select =

    document.getElementById(
      "productoIngrediente"
    );

  if (!select) return;

  select.innerHTML = "";

  productos.forEach(p => {

    select.innerHTML += `

      <option value="${p.id}">

        ${p.nombre}

      </option>
    `;
  });
}

// =================================
// CARGAR RECETAS
// =================================

function cargarRecetas() {

  const select =

    document.getElementById(
      "recetaProduccion"
    );

  if (!select) return;

  select.innerHTML = "";

  recetas.forEach(r => {

    select.innerHTML += `

      <option value="${r.id}">

        ${r.nombre}

      </option>
    `;
  });
}

// =================================
// AGREGAR INGREDIENTE
// =================================

function agregarIngrediente() {

  if (!recetaActual) {

    showToast(

      "Primero creá una receta",

      "error"
    );

    return;
  }

  const productoId =

    Number(

      document.getElementById(
        "productoIngrediente"
      ).value
    );

  const cantidad =

    Number(

      document.getElementById(
        "cantidadIngrediente"
      ).value
    );

  const producto =

    productos.find(
      p => p.id === productoId
    );

  if (

    !producto ||

    cantidad <= 0

  ) {

    showToast(

      "Datos inválidos",

      "error"
    );

    return;
  }

  recetaActual.ingredientes.push({

    productoId,

    nombre:
      producto.nombre,

    cantidad
  });

  guardarRecetas();

  renderIngredientes();

  document.getElementById(
    "cantidadIngrediente"
  ).value = "";

  showToast(

    "Ingrediente agregado",

    "success"
  );
}

// =================================
// RENDER INGREDIENTES
// =================================

function renderIngredientes() {

  const cont =

    document.getElementById(
      "listaIngredientes"
    );

  if (!cont) return;

  cont.innerHTML = "";

  if (

    !recetaActual ||

    recetaActual.ingredientes
      .length === 0

  ) {

    cont.innerHTML = `

      <tr>

        <td colspan="3">

          No hay ingredientes

        </td>

      </tr>
    `;

    return;
  }

  recetaActual.ingredientes

    .forEach((i, index) => {

      cont.innerHTML += `

        <tr>

          <td>

            ${i.nombre}

          </td>

          <td>

            ${i.cantidad}

          </td>

          <td>

            <button
              onclick="eliminarIngrediente(${index})"
            >

              🗑️

            </button>

          </td>

        </tr>
      `;
    });
}

// =================================
// ELIMINAR INGREDIENTE
// =================================

function eliminarIngrediente(index) {

  recetaActual.ingredientes.splice(
    index,
    1
  );

  guardarRecetas();

  renderIngredientes();

  showToast(

    "Ingrediente eliminado",

    "info"
  );
}

// =================================
// PRODUCIR
// =================================

function producir() {

  const recetaId =

    Number(

      document.getElementById(
        "recetaProduccion"
      ).value
    );

  const cantidadFinal =

    Number(

      document.getElementById(
        "cantidadFinal"
      ).value
    );

  const receta =

    recetas.find(
      r => r.id === recetaId
    );

  if (

    !receta ||

    cantidadFinal <= 0

  ) {

    showToast(

      "Datos inválidos",

      "error"
    );

    return;
  }

  // =================================
  // VALIDAR STOCK
  // =================================

  for (

    const ingrediente
    of receta.ingredientes

  ) {

    const producto =

      productos.find(
        p => p.id === ingrediente.productoId
      );

    if (!producto) continue;

    const requerido =

      ingrediente.cantidad

      * cantidadFinal;

    if (

      producto.stock < requerido

    ) {

      showToast(

        `Stock insuficiente de ${producto.nombre}`,

        "error"
      );

      return;
    }
  }

  // =================================
  // DESCONTAR STOCK
  // =================================

  receta.ingredientes.forEach(i => {

    const producto =

      productos.find(
        p => p.id === i.productoId
      );

    if (!producto) return;

    producto.stock -=

      i.cantidad
      * cantidadFinal;
  });

  // =================================
  // SUMAR PRODUCTO FINAL
  // =================================

  let productoFinal =

    productos.find(p =>

      p.nombre.toLowerCase()

      ===

      receta.nombre.toLowerCase()
    );

  // CREAR SI NO EXISTE
  if (!productoFinal) {

    productoFinal = {

  id: Date.now(),

  nombre:
    receta.nombre,

  precio: 0,

  costo:
    Math.round(
      costoUnitario
    ),

  stock: 0,

  tipo:
    "elaborado",

  unidad:
    "unidad"
};

    productos.push(
      productoFinal
    );
  }

  productoFinal.stock +=
    cantidadFinal;

// =================================
// ACTUALIZAR COSTO
// =================================

productoFinal.costo =

  Math.round(
    costoUnitario
  );

 // =================================
// COSTO TOTAL
// =================================

let costoTotal = 0;

receta.ingredientes.forEach(i => {

  const producto =

    productos.find(
      p => p.id === i.productoId
    );

  if (!producto) return;

  const usado =

    i.cantidad
    * cantidadFinal;

  const costo =

    Number(producto.costo || 0);

  costoTotal +=
    usado * costo;
});

// =================================
// COSTO UNITARIO
// =================================

const costoUnitario =

  costoTotal / cantidadFinal;

// =================================
// HISTORIAL
// =================================

historialProduccion.push({

  receta:
    receta.nombre,

  cantidad:
    cantidadFinal,

  costoTotal,

  costoUnitario,

  fecha:
    new Date()
      .toISOString()
});

  // =================================
  // SAVE
  // =================================

  localStorage.setItem(

    "productos",

    JSON.stringify(productos)
  );

  guardarHistorial();

  renderHistorial();

  showToast(

    "Producción realizada",

    "success"
  );

  document.getElementById(
    "cantidadFinal"
  ).value = "";
}

// =================================
// RENDER HISTORIAL
// =================================

function renderHistorial() {

  const cont =

    document.getElementById(
      "historialProduccion"
    );

  if (!cont) return;

  cont.innerHTML = "";

  if (

    historialProduccion
      .length === 0

  ) {

    cont.innerHTML = `

      <tr>

        <td colspan="5">

          No hay producción

        </td>

      </tr>
    `;

    return;
  }

  let costoGlobal = 0;

  [...historialProduccion]

    .reverse()

    .forEach(h => {

      costoGlobal +=
        Number(h.costoTotal || 0);

      cont.innerHTML += `

        <tr>

          <td>

            ${h.receta}

          </td>

          <td>

            ${h.cantidad}

          </td>

          <td>

            $${Number(
              h.costoTotal || 0
            ).toLocaleString()}

          </td>

          <td>

            $${Number(
              h.costoUnitario || 0
            ).toLocaleString()}

          </td>

          <td>

            ${formatFecha(
              h.fecha
            )}

          </td>

        </tr>
      `;
    });

  // =================================
  // STATS
  // =================================

  document.getElementById(
    "totalProducciones"
  ).innerText =

    historialProduccion.length;

  document.getElementById(
    "costoProduccion"
  ).innerText =

    `$${costoGlobal.toLocaleString()}`;

  document.getElementById(
    "produccionSemanal"
  ).innerText =

    historialProduccion.length;
}

// =================================
// FECHA
// =================================

function formatFecha(data) {

  return new Date(data)

    .toLocaleDateString(
      "es-AR"
    );
}

// =================================
// INIT
// =================================

cargarProductos();

cargarRecetas();

renderIngredientes();

renderHistorial();