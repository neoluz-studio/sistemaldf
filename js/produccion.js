// =================================
// STORAGE
// =================================

let productos =
  JSON.parse(
    localStorage.getItem("productos")
  ) || [];

let recetas =
  JSON.parse(
    localStorage.getItem("recetas")
  ) || [];

let recetaTemp = [];

// =================================
// CARGAR SELECTS
// =================================

function cargarSelects() {

  const prodSelect =
    document.getElementById(
      "productoFinal"
    );

  const insumoSelect =
    document.getElementById(
      "insumoSelect"
    );

  const recetaSelect =
    document.getElementById(
      "recetaSelect"
    );

  // RESET
  prodSelect.innerHTML =
    `<option value="">Producto final</option>`;

  insumoSelect.innerHTML =
    `<option value="">Insumo</option>`;

  recetaSelect.innerHTML =
    `<option value="">Seleccionar receta</option>`;

  // PRODUCTOS
  productos.forEach(p => {

    const tipo =
      p.tipo
        ?.toLowerCase()
        .trim();

    // ELABORADOS
    if (
      tipo === "elaborado" ||
      tipo === "elaborados"
    ) {

      prodSelect.innerHTML += `

        <option value="${p.id}">
          ${p.nombre}
        </option>
      `;
    }

    // INSUMOS
    else {

      insumoSelect.innerHTML += `

        <option value="${p.id}">

          ${p.nombre}

          - Stock:
          ${p.stock}

          ${p.unidad || ""}

        </option>
      `;
    }
  });

  // RECETAS
  recetas.forEach(r => {

    const producto =
      productos.find(
        p => p.id === r.productoId
      );

    recetaSelect.innerHTML += `

      <option value="${r.id}">

        ${producto
          ? producto.nombre
          : "Producto"}

      </option>
    `;
  });
}

// =================================
// AGREGAR INGREDIENTE
// =================================

function agregarIngrediente() {

  const insumoId =
    Number(
      document.getElementById(
        "insumoSelect"
      ).value
    );

  const cantidad =
    Number(
      document.getElementById(
        "cantidadInsumo"
      ).value
    );

  if (!insumoId || !cantidad) {

    showToast(
      "Completá los datos",
      "error"
    );

    return;
  }

  // DUPLICADO
  const existe =
    recetaTemp.find(
      r => r.insumoId === insumoId
    );

  if (existe) {

    showToast(
      "Ese ingrediente ya fue agregado",
      "error"
    );

    return;
  }

  recetaTemp.push({

    insumoId,

    cantidad
  });

  document.getElementById(
    "cantidadInsumo"
  ).value = "";

  showToast(
    "Ingrediente agregado",
    "success"
  );
}

// =================================
// GUARDAR RECETA
// =================================

function guardarReceta() {

  const productoId =
    Number(
      document.getElementById(
        "productoFinal"
      ).value
    );

  if (
    !productoId ||
    recetaTemp.length === 0
  ) {

    showToast(
      "Completá la receta",
      "error"
    );

    return;
  }

  // EVITAR DUPLICADAS
  const existe =
    recetas.find(
      r => r.productoId === productoId
    );

  if (existe) {

    showToast(
      "Ese producto ya tiene receta",
      "error"
    );

    return;
  }

  recetas.push({

    id: Date.now(),

    productoId,

    ingredientes:
      [...recetaTemp]
  });

  localStorage.setItem(
    "recetas",
    JSON.stringify(recetas)
  );

  recetaTemp = [];

  document.getElementById(
    "productoFinal"
  ).value = "";

  cargarSelects();

  render();

  showToast(
    "Receta guardada",
    "success"
  );
}

// =================================
// PRODUCIR FORM
// =================================

function producirDesdeFormulario() {

  const recetaId =
    Number(
      document.getElementById(
        "recetaSelect"
      ).value
    );

  const cantidadProducir =
    Number(
      document.getElementById(
        "cantidadProducir"
      ).value
    );

  if (
    !recetaId ||
    !cantidadProducir
  ) {

    showToast(
      "Seleccioná receta y cantidad",
      "error"
    );

    return;
  }

  producir(
    recetaId,
    cantidadProducir
  );
}

// =================================
// PRODUCIR
// =================================

function producir(
  recetaId,
  cantidadProducir = 1
) {

  const receta =
    recetas.find(
      r => r.id === recetaId
    );

  if (!receta) return;

  // VALIDAR STOCK
  for (let ing of receta.ingredientes) {

    const insumo =
      productos.find(
        p => p.id === ing.insumoId
      );
      if (!insumo) {

  showToast(
    "Hay ingredientes eliminados",
    "error"
  );

  return;
}

    const necesaria =
      ing.cantidad *
      cantidadProducir;

    if (!insumo) {

      showToast(
        "Hay un insumo inexistente",
        "error"
      );

      return;
    }

    if (insumo.stock < necesaria) {

      showToast(
        `Stock insuficiente de ${insumo.nombre}`,
        "error"
      );

      return;
    }
  }

  // DESCONTAR
  receta.ingredientes.forEach(ing => {

    const insumo =
      productos.find(
        p => p.id === ing.insumoId
      );

    const necesaria =
      ing.cantidad *
      cantidadProducir;

    insumo.stock -= necesaria;
  });

  // SUMAR FINAL
  const productoFinal =
    productos.find(
      p => p.id === receta.productoId
    );

  if (productoFinal) {

    productoFinal.stock +=
      cantidadProducir;
  }

  // GUARDAR
  localStorage.setItem(
    "productos",
    JSON.stringify(productos)
  );

  document.getElementById(
    "cantidadProducir"
  ).value = "";

  cargarSelects();

  render();

  showToast(

    `Producción realizada:
    ${cantidadProducir}
    ${productoFinal?.unidad || ""}
    de
    ${productoFinal?.nombre}`,

    "success"
  );
}

// =================================
// ELIMINAR RECETA
// =================================

function eliminarReceta(id) {

  showConfirm({

    title: "Eliminar receta",

    message:
      "Esta acción no se puede deshacer.",

    onConfirm: () => {

      recetas =
        recetas.filter(
          r => r.id !== id
        );

      localStorage.setItem(
        "recetas",
        JSON.stringify(recetas)
      );

      cargarSelects();

      render();

      showToast(
        "Receta eliminada",
        "info"
      );
    }
  });
}

// =================================
// RENDER
// =================================

function render() {

  const cont =
    document.getElementById(
      "listaRecetas"
    );

  cont.innerHTML = "";

  // VACIO
  if (recetas.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">
        No hay recetas guardadas
      </div>
    `;

    return;
  }

  // MÁS NUEVAS ARRIBA
  [...recetas]
    .reverse()
    .forEach(r => {

      const producto =
        productos.find(
          p => p.id === r.productoId
        );

      const ingredientesTexto =
        r.ingredientes
          .map(ing => {

            const insumo =
              productos.find(
                p => p.id === ing.insumoId
              );

            return `

              <span class="ingredient-pill">

                ${insumo
                  ? insumo.nombre
                  : "Insumo"}

                :

                ${ing.cantidad}

                ${insumo?.unidad || ""}

              </span>
            `;
          })
          .join("");

      const div =
        document.createElement("div");

      div.className =
        "recipe-card";

      div.innerHTML = `

        <div>

          <h4>

            ${producto
              ? producto.nombre
              : "Producto"}

          </h4>

          <div class="recipe-list">

            ${ingredientesTexto}

          </div>

        </div>

        <div class="table-actions">

          <button
            class="btn-producir"
            onclick="producir(${r.id}, 1)"
          >

            +1
            ${producto?.unidad || ""}

          </button>

          <button
            onclick="eliminarReceta(${r.id})"
          >

            🗑️

          </button>

        </div>
      `;

      cont.appendChild(div);
    });
}

// =================================
// INIT
// =================================

cargarSelects();

render();