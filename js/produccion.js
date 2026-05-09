let productos = JSON.parse(localStorage.getItem("productos")) || [];
let recetas = JSON.parse(localStorage.getItem("recetas")) || [];

let recetaTemp = [];

// CARGAR SELECTS
function cargarSelects() {
  const prodSelect = document.getElementById("productoFinal");
  const insumoSelect = document.getElementById("insumoSelect");
  const recetaSelect = document.getElementById("recetaSelect");

  prodSelect.innerHTML = `<option value="">Producto final</option>`;
  insumoSelect.innerHTML = `<option value="">Insumo</option>`;

  if (recetaSelect) {
    recetaSelect.innerHTML = `<option value="">Seleccionar receta</option>`;
  }

  productos.forEach(p => {

  const tipo =
    p.tipo?.toLowerCase().trim();

  // PRODUCTOS ELABORADOS
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

  recetas.forEach(r => {
    const producto = productos.find(p => p.id === r.productoId);

    if (recetaSelect) {
      recetaSelect.innerHTML += `
        <option value="${r.id}">
          ${producto ? producto.nombre : "Producto"}
        </option>
      `;
    }
  });
}

// AGREGAR INGREDIENTE A RECETA TEMPORAL
function agregarIngrediente() {
  const insumoId = Number(document.getElementById("insumoSelect").value);
  const cantidad = Number(document.getElementById("cantidadInsumo").value);

  if (!insumoId || !cantidad) {
    showToast("Completá el insumo y la cantidad", "error");
    return;
  }

  recetaTemp.push({
    insumoId,
    cantidad
  });

  document.getElementById("cantidadInsumo").value = "";

  showToast("Ingrediente agregado a la receta");
}

// GUARDAR RECETA
function guardarReceta() {
  const productoId = Number(document.getElementById("productoFinal").value);

  if (!productoId || recetaTemp.length === 0) {
    showToast("Seleccioná producto final y agregá ingredientes", "error");
    return;
  }

  recetas.push({
    id: Date.now(),
    productoId,
    ingredientes: recetaTemp
  });

  localStorage.setItem("recetas", JSON.stringify(recetas));

  recetaTemp = [];

  cargarSelects();
  render();

  showToast("Receta guardada");
}

// PRODUCIR DESDE FORMULARIO
function producirDesdeFormulario() {
  const recetaId = Number(document.getElementById("recetaSelect").value);
  const cantidadProducir = Number(document.getElementById("cantidadProducir").value);

  if (!recetaId || !cantidadProducir) {
    showToast("Seleccioná receta y cantidad a producir", "error");
    return;
  }

  producir(recetaId, cantidadProducir);
}

// PRODUCIR
function producir(recetaId, cantidadProducir = 1) {
  const receta = recetas.find(r => r.id === recetaId);

  if (!receta) return;

  // 1. VERIFICAR STOCK ANTES DE DESCONTAR
  for (let ing of receta.ingredientes) {
    const insumo = productos.find(p => p.id === ing.insumoId);
    const cantidadNecesaria = ing.cantidad * cantidadProducir;

    if (!insumo) {
      showToast("Hay un insumo que no existe", "error");
      return;
    }

    if (insumo.stock < cantidadNecesaria) {
      showToast(`Stock insuficiente de ${insumo.nombre}. Necesitás ${cantidadNecesaria} y tenés ${insumo.stock}`, "error");
      return;
    }
  }

  // 2. DESCONTAR INSUMOS
  receta.ingredientes.forEach(ing => {
    const insumo = productos.find(p => p.id === ing.insumoId);
    const cantidadNecesaria = ing.cantidad * cantidadProducir;

    insumo.stock -= cantidadNecesaria;
  });

  // 3. SUMAR PRODUCTO FINAL
  const productoFinal = productos.find(p => p.id === receta.productoId);

  if (productoFinal) {
    productoFinal.stock += cantidadProducir;
  }

  // 4. GUARDAR
  localStorage.setItem("productos", JSON.stringify(productos));

  document.getElementById("cantidadProducir").value = "";

  cargarSelects();
  render();

  showToast(`Producción realizada: ${cantidadProducir} ${productoFinal?.unidad || ""} de ${productoFinal?.nombre}`);
}

// RENDER RECETAS
function render() {
  const cont = document.getElementById("listaRecetas");
  cont.innerHTML = "";

  if (recetas.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        No hay recetas guardadas
      </div>
    `;
    return;
  }

  recetas.forEach(r => {
    const producto = productos.find(p => p.id === r.productoId);

    const ingredientesTexto = r.ingredientes.map(ing => {
      const insumo = productos.find(p => p.id === ing.insumoId);

      return `
        <span class="recipe-ingredient">
          ${insumo ? insumo.nombre : "Insumo"}: ${ing.cantidad} ${insumo?.unidad || ""} por 1 ${producto?.unidad || "unidad"}
        </span>
      `;
    }).join("");

    const div = document.createElement("div");
    div.className = "recipe-card";

    div.innerHTML = `
      <div>
        <h4>${producto ? producto.nombre : "Producto"}</h4>
        <div class="recipe-list">
          ${ingredientesTexto}
        </div>
      </div>

      <button onclick="producir(${r.id}, 1)">+1 ${producto?.unidad || ""}</button>
    `;

    cont.appendChild(div);
  });
}

// INIT
cargarSelects();
render();