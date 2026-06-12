// =================================
// PRODUCCIÓN MANUAL - LO DE FAUSTI
// Calculadora de recetas/costos
// NO toca stock, NO toca caja, NO toca ventas
// =================================

let recetas = JSON.parse(localStorage.getItem("recetasManual")) || [];
let recetaActual = null;

function money(valor) {
  return `$${Number(valor || 0).toLocaleString("es-AR")}`;
}

function avisar(mensaje, tipo = "info") {
  if (typeof showToast === "function") showToast(mensaje, tipo);
  else alert(mensaje);
}

function guardarRecetas() {
  localStorage.setItem("recetasManual", JSON.stringify(recetas));
}

function normalizarUnidad(valor, unidad) {
  const n = Number(valor || 0);

  if (unidad === "kg") return n * 1000;
  if (unidad === "litro") return n * 1000;
  if (unidad === "docena") return n * 12;

  return n;
}

function calcularCostoIngrediente(i) {
  const compra = normalizarUnidad(i.cantidadCompra, i.unidadCompra);
  const usado = normalizarUnidad(i.cantidadUsada, i.unidadUsada);

  if (compra <= 0 || usado <= 0) return 0;

  return (Number(i.precioCompra || 0) / compra) * usado;
}

function calcularReceta(receta) {
  if (!receta) return { total: 0, costoUnidad: 0 };

  let total = 0;

  receta.ingredientes.forEach(i => {
    total += calcularCostoIngrediente(i);
  });

  const cantidad = Number(receta.cantidadFinal || 1);
  const costoUnidad = cantidad > 0 ? total / cantidad : 0;

  return { total, costoUnidad };
}

function crearReceta() {
  const nombre = document.getElementById("nombreReceta").value.trim();
  const cantidadFinal = Number(document.getElementById("cantidadProduccion").value);
  const unidadFinal = document.getElementById("unidadFinal").value.trim() || "unidad";
  const precioVenta = Number(document.getElementById("precioVentaInicial").value || 0);

  if (!nombre || cantidadFinal <= 0) {
    avisar("Completá nombre y cantidad producida", "error");
    return;
  }

  const nueva = {
    id: Date.now(),
    nombre,
    cantidadFinal,
    unidadFinal,
    precioVenta,
    ingredientes: []
  };

  recetas.push(nueva);
  recetaActual = nueva;
  guardarRecetas();

  document.getElementById("nombreReceta").value = "";
  document.getElementById("cantidadProduccion").value = "";
  document.getElementById("unidadFinal").value = "";
  document.getElementById("precioVentaInicial").value = "";

  renderTodo();
  avisar("Receta creada", "success");
}

function abrirRecetaSeleccionada() {
  const id = document.getElementById("selectorReceta").value;

  if (!id) {
    avisar("Seleccioná una receta", "error");
    return;
  }

  recetaActual = recetas.find(r => String(r.id) === String(id)) || null;
  renderTodo();
}

function editarRecetaSeleccionada() {
  abrirRecetaSeleccionada();
  editarDatosReceta();
}

function duplicarRecetaSeleccionada() {
  const id = document.getElementById("selectorReceta").value;

  if (!id) {
    avisar("Seleccioná una receta", "error");
    return;
  }

  duplicarReceta(id);
}

function eliminarRecetaSeleccionada() {
  const id = document.getElementById("selectorReceta").value;

  if (!id) {
    avisar("Seleccioná una receta", "error");
    return;
  }

  eliminarReceta(id);
}

function seleccionarReceta(id) {
  recetaActual = recetas.find(r => String(r.id) === String(id)) || null;
  renderTodo();
}

function eliminarReceta(id) {
  if (!confirm("¿Eliminar esta receta?")) return;

  recetas = recetas.filter(r => String(r.id) !== String(id));

  if (recetaActual && String(recetaActual.id) === String(id)) {
    recetaActual = recetas[0] || null;
  }

  guardarRecetas();
  renderTodo();
  avisar("Receta eliminada", "success");
}

function duplicarReceta(id) {
  const receta = recetas.find(r => String(r.id) === String(id));
  if (!receta) return;

  const copia = JSON.parse(JSON.stringify(receta));
  copia.id = Date.now();
  copia.nombre = receta.nombre + " - copia";

  recetas.push(copia);
  recetaActual = copia;
  guardarRecetas();
  renderTodo();

  avisar("Receta duplicada", "success");
}

function editarDatosReceta() {
  if (!recetaActual) {
    avisar("Seleccioná una receta", "error");
    return;
  }

  const nombre = prompt("Nombre de receta:", recetaActual.nombre);
  if (!nombre) return;

  const cantidad = Number(prompt("Cantidad producida:", recetaActual.cantidadFinal));
  if (cantidad <= 0) return;

  const unidad = prompt("Unidad final:", recetaActual.unidadFinal) || "unidad";
  const precioVenta = Number(prompt("Precio de venta actual:", recetaActual.precioVenta || 0));

  recetaActual.nombre = nombre;
  recetaActual.cantidadFinal = cantidad;
  recetaActual.unidadFinal = unidad;
  recetaActual.precioVenta = precioVenta;

  guardarRecetas();
  renderTodo();
  avisar("Receta editada", "success");
}

function agregarIngrediente() {
  if (!recetaActual) {
    avisar("Primero creá o seleccioná una receta", "error");
    return;
  }

  const nombre = document.getElementById("nombreIngrediente").value.trim();
  const precioCompra = Number(document.getElementById("precioCompra").value);
  const cantidadCompra = Number(document.getElementById("cantidadCompra").value);
  const unidadCompra = document.getElementById("unidadCompra").value;
  const cantidadUsada = Number(document.getElementById("cantidadUsada").value);
  const unidadUsada = document.getElementById("unidadUsada").value;

  if (!nombre || precioCompra <= 0 || cantidadCompra <= 0 || cantidadUsada <= 0) {
    avisar("Completá bien los datos del ingrediente", "error");
    return;
  }

  recetaActual.ingredientes.push({
    id: Date.now(),
    nombre,
    precioCompra,
    cantidadCompra,
    unidadCompra,
    cantidadUsada,
    unidadUsada
  });

  limpiarFormIngrediente();
  guardarRecetas();
  renderTodo();

  avisar("Ingrediente agregado", "success");
}

function limpiarFormIngrediente() {
  ["nombreIngrediente", "precioCompra", "cantidadCompra", "cantidadUsada"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function editarIngrediente(id) {
  if (!recetaActual) return;

  const ing = recetaActual.ingredientes.find(i => String(i.id) === String(id));
  if (!ing) return;

  const nombre = prompt("Ingrediente:", ing.nombre);
  if (!nombre) return;

  const precioCompra = Number(prompt("Precio total de compra:", ing.precioCompra));
  const cantidadCompra = Number(prompt("Cantidad comprada:", ing.cantidadCompra));
  const unidadCompra = prompt("Unidad compra: g, kg, unidad, docena, ml, litro, paquete, manual", ing.unidadCompra) || ing.unidadCompra;
  const cantidadUsada = Number(prompt("Cantidad usada:", ing.cantidadUsada));
  const unidadUsada = prompt("Unidad usada: g, kg, unidad, docena, ml, litro, paquete, manual", ing.unidadUsada) || ing.unidadUsada;

  if (precioCompra <= 0 || cantidadCompra <= 0 || cantidadUsada <= 0) return;

  ing.nombre = nombre;
  ing.precioCompra = precioCompra;
  ing.cantidadCompra = cantidadCompra;
  ing.unidadCompra = unidadCompra;
  ing.cantidadUsada = cantidadUsada;
  ing.unidadUsada = unidadUsada;

  guardarRecetas();
  renderTodo();
  avisar("Ingrediente editado", "success");
}

function eliminarIngrediente(id) {
  if (!recetaActual) return;

  recetaActual.ingredientes = recetaActual.ingredientes.filter(i => String(i.id) !== String(id));
  guardarRecetas();
  renderTodo();
  avisar("Ingrediente eliminado", "success");
}

function guardarRecetaActual() {
  if (!recetaActual) {
    avisar("No hay receta seleccionada", "error");
    return;
  }

  guardarRecetas();
  renderTodo();
  avisar("Receta guardada correctamente", "success");
}

function renderSelectorRecetas() {
  const selector = document.getElementById("selectorReceta");
  if (!selector) return;

  const valorActual = recetaActual ? String(recetaActual.id) : "";

  selector.innerHTML = `<option value="">Seleccionar receta</option>`;

  recetas.forEach(r => {
    selector.innerHTML += `
      <option value="${r.id}">
        ${r.nombre}
      </option>
    `;
  });

  selector.value = valorActual;
}

function renderIngredientes() {
  const tbody = document.getElementById("listaIngredientes");
  if (!tbody) return;

  if (!recetaActual || recetaActual.ingredientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No hay ingredientes cargados</td></tr>`;
    return;
  }

  tbody.innerHTML = recetaActual.ingredientes.map(i => `
    <tr>
      <td>${i.nombre}</td>
      <td>${money(i.precioCompra)}</td>
      <td>${i.cantidadCompra} ${i.unidadCompra}</td>
      <td>${i.cantidadUsada} ${i.unidadUsada}</td>
      <td><strong>${money(calcularCostoIngrediente(i))}</strong></td>
      <td>
        <button class="detail-btn" onclick="editarIngrediente('${i.id}')">Editar</button>
      </td>
      <td>
        <button class="mini-danger-btn" onclick="eliminarIngrediente('${i.id}')">Eliminar</button>
      </td>
    </tr>
  `).join("");
}

function renderResumen() {
  const cont = document.getElementById("resumenReceta");
  if (!cont) return;

  if (!recetaActual) {
    cont.innerHTML = `<div class="empty-state">Seleccioná una receta</div>`;
    return;
  }

  const calc = calcularReceta(recetaActual);
  const precioVenta = Number(recetaActual.precioVenta || 0);
  const ganancia = precioVenta - calc.total;
  const margen = precioVenta > 0 ? (ganancia / precioVenta) * 100 : 0;

  cont.innerHTML = `
    <div class="recipe-summary-card">
      <span>Receta actual</span>
      <strong>${recetaActual.nombre}</strong>
    </div>

    <div class="recipe-summary-card">
      <span>Cantidad producida</span>
      <strong>${recetaActual.cantidadFinal} ${recetaActual.unidadFinal}</strong>
    </div>

    <div class="recipe-summary-card">
      <span>Costo total</span>
      <strong>${money(calc.total)}</strong>
    </div>

    <div class="recipe-summary-card">
      <span>Costo por unidad</span>
      <strong>${money(calc.costoUnidad)}</strong>
    </div>

    <div class="recipe-summary-card">
      <span>Precio venta actual</span>
      <strong>${money(precioVenta)}</strong>
    </div>

    <div class="recipe-summary-card">
      <span>Ganancia real</span>
      <strong>${money(ganancia)}</strong>
    </div>

    <div class="recipe-summary-card">
      <span>Margen real</span>
      <strong>${margen.toFixed(2)}%</strong>
    </div>

    <div class="recipe-summary-card">
      <span>Precios sugeridos</span>
      <p>30%: <b>${money(calc.total * 1.3)}</b></p>
      <p>50%: <b>${money(calc.total * 1.5)}</b></p>
      <p>70%: <b>${money(calc.total * 1.7)}</b></p>
      <p>100%: <b>${money(calc.total * 2)}</b></p>
    </div>

    <button class="produccion-main-btn" onclick="editarDatosReceta()">
      Editar datos de receta
    </button>
  `;
}

function renderRecetaSeleccionadaBox() {
  const box = document.getElementById("recetaSeleccionadaBox");
  if (!box) return;

  if (!recetaActual) {
    box.innerHTML = `Seleccioná o creá una receta para cargar ingredientes.`;
    return;
  }

  const calc = calcularReceta(recetaActual);

  box.innerHTML = `
    <strong>${recetaActual.nombre}</strong>
    <span>${recetaActual.cantidadFinal} ${recetaActual.unidadFinal} · ${recetaActual.ingredientes.length} ingredientes · Total: ${money(calc.total)}</span>
  `;
}

function renderStats() {
  const totalRecetas = document.getElementById("totalRecetas");
  const totalIngredientes = document.getElementById("totalIngredientes");
  const costoMayor = document.getElementById("costoMayor");
  const recetaActiva = document.getElementById("recetaActiva");

  const ingredientes = recetas.reduce((acc, r) => acc + r.ingredientes.length, 0);
  const costos = recetas.map(r => calcularReceta(r).total);
  const mayor = costos.length ? Math.max(...costos) : 0;

  if (totalRecetas) totalRecetas.innerText = recetas.length;
  if (totalIngredientes) totalIngredientes.innerText = ingredientes;
  if (costoMayor) costoMayor.innerText = money(mayor);
  if (recetaActiva) recetaActiva.innerText = recetaActual ? recetaActual.nombre : "-";
}

function renderTodo() {
  renderSelectorRecetas();
  renderIngredientes();
  renderResumen();
  renderRecetaSeleccionadaBox();
  renderStats();
}

document.addEventListener("DOMContentLoaded", () => {
  recetaActual = recetas[0] || null;
  renderTodo();
});