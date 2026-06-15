// =================================
// PRODUCCIÓN + SUPABASE - LO DE FAUSTI
// Calculadora de recetas/costos
// NO toca stock, NO toca caja, NO toca ventas
// =================================

let recetas = [];
let recetaActual = null;

// =================================
// HELPERS
// =================================

function money(valor) {
  return `$${Number(valor || 0).toLocaleString("es-AR")}`;
}

function avisar(mensaje, tipo = "info") {
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
  } else {
    alert(mensaje);
  }
}

function parseMoney(valor) {
  return Number(
    String(valor || "")
      .replace(/\./g, "")
      .replace(/,/g, ".")
      .replace(/[^\d.]/g, "")
  ) || 0;
}

function formatMoneyInput(input) {
  if (!input) return;

  const limpio = String(input.value || "").replace(/\D/g, "");

  if (!limpio) {
    input.value = "";
    return;
  }

  input.value = Number(limpio).toLocaleString("es-AR");
}

function activarFormatoDineroProduccion() {
  ["precioCompra", "precioVentaInicial"].forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.setAttribute("inputmode", "numeric");

    input.addEventListener("input", () => {
      formatMoneyInput(input);
    });
  });
}

function parseCantidad(valor) {
  const texto = String(valor || "")
    .trim()
    .replace(",", ".");

  if (!texto) return 0;

  if (texto.includes(" ")) {
    const partes = texto.split(" ");
    const entero = Number(partes[0]) || 0;
    const fraccion = partes[1];

    if (fraccion && fraccion.includes("/")) {
      const [num, den] = fraccion.split("/").map(Number);
      return entero + (den ? num / den : 0);
    }

    return entero;
  }

  if (texto.includes("/")) {
    const [num, den] = texto.split("/").map(Number);
    return den ? num / den : 0;
  }

  return Number(texto) || 0;
}

function normalizarUnidad(valor, unidad) {
  const n = parseCantidad(valor);

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

  const cantidad = parseCantidad(receta.cantidadFinal || 1);
  const costoUnidad = cantidad > 0 ? total / cantidad : 0;

  return { total, costoUnidad };
}

function limpiarFormIngrediente() {
  ["nombreIngrediente", "precioCompra", "cantidadCompra", "cantidadUsada"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function limpiarFormReceta() {
  document.getElementById("nombreReceta").value = "";
  document.getElementById("cantidadProduccion").value = "";
  document.getElementById("unidadFinal").value = "unidad";
  document.getElementById("precioVentaInicial").value = "";
}

// =================================
// SUPABASE
// =================================

async function cargarRecetasSupabase() {
  if (typeof supabaseClient === "undefined") {
    avisar("Supabase no está conectado", "error");
    return;
  }

  const { data: recetasData, error: recetasError } =
    await supabaseClient
      .from("recetas")
      .select("*")
      .order("created_at", { ascending: false });

  if (recetasError) {
    console.error(recetasError);
    avisar("Error cargando recetas", "error");
    return;
  }

  recetas = [];

  for (const receta of recetasData || []) {
    const { data: ingredientesData, error: ingredientesError } =
      await supabaseClient
        .from("receta_ingredientes")
        .select("*")
        .eq("receta_id", receta.id)
        .order("created_at", { ascending: true });

    if (ingredientesError) {
      console.error(ingredientesError);
    }

    recetas.push({
      id: receta.id,
      nombre: receta.nombre,
      cantidadFinal: Number(receta.cantidad_final || 1),
      unidadFinal: receta.unidad_final || "unidad",
      precioVenta: Number(receta.precio_venta || 0),
      ingredientes: (ingredientesData || []).map(i => ({
        id: i.id,
        recetaId: i.receta_id,
        nombre: i.nombre,
        precioCompra: Number(i.precio_compra || 0),
        cantidadCompra: Number(i.cantidad_compra || 0),
        unidadCompra: i.unidad_compra || "g",
        cantidadUsada: Number(i.cantidad_usada || 0),
        unidadUsada: i.unidad_usada || "g"
      }))
    });
  }

  if (recetaActual) {
    recetaActual =
      recetas.find(r => String(r.id) === String(recetaActual.id)) ||
      recetas[0] ||
      null;
  } else {
    recetaActual = recetas[0] || null;
  }
}

// =================================
// RECETAS
// =================================

async function crearReceta() {
  const nombre = document.getElementById("nombreReceta").value.trim();
  const cantidadFinal = parseCantidad(document.getElementById("cantidadProduccion").value);
  const unidadFinal = document.getElementById("unidadFinal").value.trim() || "unidad";
  const precioVenta = parseMoney(document.getElementById("precioVentaInicial").value);

  if (!nombre || cantidadFinal <= 0) {
    avisar("Completá nombre y cantidad producida", "error");
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("recetas")
      .insert({
        nombre,
        cantidad_final: cantidadFinal,
        unidad_final: unidadFinal,
        precio_venta: precioVenta
      })
      .select()
      .single();

  if (error) {
    console.error(error);
    avisar("Error creando receta", "error");
    return;
  }

  recetaActual = {
    id: data.id,
    nombre: data.nombre,
    cantidadFinal: Number(data.cantidad_final || 1),
    unidadFinal: data.unidad_final || "unidad",
    precioVenta: Number(data.precio_venta || 0),
    ingredientes: []
  };

  limpiarFormReceta();

  await cargarRecetasSupabase();
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

async function duplicarRecetaSeleccionada() {
  const id = document.getElementById("selectorReceta").value;

  if (!id) {
    avisar("Seleccioná una receta", "error");
    return;
  }

  await duplicarReceta(id);
}

async function eliminarRecetaSeleccionada() {
  const id = document.getElementById("selectorReceta").value;

  if (!id) {
    avisar("Seleccioná una receta", "error");
    return;
  }

  await eliminarReceta(id);
}

async function eliminarReceta(id) {
  if (!confirm("¿Eliminar esta receta? También se borrarán sus ingredientes.")) return;

  const { error } =
    await supabaseClient
      .from("recetas")
      .delete()
      .eq("id", id);

  if (error) {
    console.error(error);
    avisar("Error eliminando receta", "error");
    return;
  }

  if (recetaActual && String(recetaActual.id) === String(id)) {
    recetaActual = null;
  }

  await cargarRecetasSupabase();
  renderTodo();

  avisar("Receta eliminada", "success");
}

async function duplicarReceta(id) {
  const receta = recetas.find(r => String(r.id) === String(id));

  if (!receta) return;

  const { data: nuevaReceta, error: recetaError } =
    await supabaseClient
      .from("recetas")
      .insert({
        nombre: receta.nombre + " - copia",
        cantidad_final: receta.cantidadFinal,
        unidad_final: receta.unidadFinal,
        precio_venta: receta.precioVenta
      })
      .select()
      .single();

  if (recetaError) {
    console.error(recetaError);
    avisar("Error duplicando receta", "error");
    return;
  }

  if (receta.ingredientes.length > 0) {
    const ingredientesCopia =
      receta.ingredientes.map(i => ({
        receta_id: nuevaReceta.id,
        nombre: i.nombre,
        precio_compra: i.precioCompra,
        cantidad_compra: i.cantidadCompra,
        unidad_compra: i.unidadCompra,
        cantidad_usada: i.cantidadUsada,
        unidad_usada: i.unidadUsada
      }));

    const { error: ingError } =
      await supabaseClient
        .from("receta_ingredientes")
        .insert(ingredientesCopia);

    if (ingError) {
      console.error(ingError);
      avisar("La receta se duplicó, pero hubo error con ingredientes", "error");
      return;
    }
  }

  recetaActual = { id: nuevaReceta.id };

  await cargarRecetasSupabase();
  renderTodo();

  avisar("Receta duplicada", "success");
}

async function editarDatosReceta() {
  if (!recetaActual) {
    avisar("Seleccioná una receta", "error");
    return;
  }

  const nombre = prompt("Nombre de receta:", recetaActual.nombre);
  if (!nombre) return;

  const cantidad = parseCantidad(prompt("Cantidad producida:", recetaActual.cantidadFinal));
  if (cantidad <= 0) return;

  const unidad = prompt("Unidad final:", recetaActual.unidadFinal) || "unidad";
  const precioVenta = parseMoney(prompt("Precio de venta actual:", Number(recetaActual.precioVenta || 0).toLocaleString("es-AR")));

  const { error } =
    await supabaseClient
      .from("recetas")
      .update({
        nombre,
        cantidad_final: cantidad,
        unidad_final: unidad,
        precio_venta: precioVenta
      })
      .eq("id", recetaActual.id);

  if (error) {
    console.error(error);
    avisar("Error editando receta", "error");
    return;
  }

  await cargarRecetasSupabase();
  renderTodo();

  avisar("Receta editada", "success");
}

// =================================
// INGREDIENTES
// =================================

async function agregarIngrediente() {
  if (!recetaActual) {
    avisar("Primero creá o seleccioná una receta", "error");
    return;
  }

  const nombre = document.getElementById("nombreIngrediente").value.trim();
  const precioCompra = parseMoney(document.getElementById("precioCompra").value);
  const cantidadCompra = parseCantidad(document.getElementById("cantidadCompra").value);
  const unidadCompra = document.getElementById("unidadCompra").value;
  const cantidadUsada = parseCantidad(document.getElementById("cantidadUsada").value);
  const unidadUsada = document.getElementById("unidadUsada").value;

  if (!nombre || precioCompra <= 0 || cantidadCompra <= 0 || cantidadUsada <= 0) {
    avisar("Completá bien los datos del ingrediente", "error");
    return;
  }

  const { error } =
    await supabaseClient
      .from("receta_ingredientes")
      .insert({
        receta_id: recetaActual.id,
        nombre,
        precio_compra: precioCompra,
        cantidad_compra: cantidadCompra,
        unidad_compra: unidadCompra,
        cantidad_usada: cantidadUsada,
        unidad_usada: unidadUsada
      });

  if (error) {
    console.error(error);
    avisar("Error agregando ingrediente", "error");
    return;
  }

  limpiarFormIngrediente();

  await cargarRecetasSupabase();
  renderTodo();

  avisar("Ingrediente agregado", "success");
}

async function editarIngrediente(id) {
  if (!recetaActual) return;

  const ing = recetaActual.ingredientes.find(i => String(i.id) === String(id));
  if (!ing) return;

  const nombre = prompt("Ingrediente:", ing.nombre);
  if (!nombre) return;

  const precioCompra = parseMoney(prompt("Precio total de compra:", Number(ing.precioCompra || 0).toLocaleString("es-AR")));
  const cantidadCompra = parseCantidad(prompt("Cantidad comprada:", ing.cantidadCompra));
  const unidadCompra = prompt("Unidad compra:", ing.unidadCompra) || ing.unidadCompra;
  const cantidadUsada = parseCantidad(prompt("Cantidad usada:", ing.cantidadUsada));
  const unidadUsada = prompt("Unidad usada:", ing.unidadUsada) || ing.unidadUsada;

  if (precioCompra <= 0 || cantidadCompra <= 0 || cantidadUsada <= 0) return;

  const { error } =
    await supabaseClient
      .from("receta_ingredientes")
      .update({
        nombre,
        precio_compra: precioCompra,
        cantidad_compra: cantidadCompra,
        unidad_compra: unidadCompra,
        cantidad_usada: cantidadUsada,
        unidad_usada: unidadUsada
      })
      .eq("id", id);

  if (error) {
    console.error(error);
    avisar("Error editando ingrediente", "error");
    return;
  }

  await cargarRecetasSupabase();
  renderTodo();

  avisar("Ingrediente editado", "success");
}

async function eliminarIngrediente(id) {
  if (!recetaActual) return;

  if (!confirm("¿Eliminar este ingrediente?")) return;

  const { error } =
    await supabaseClient
      .from("receta_ingredientes")
      .delete()
      .eq("id", id);

  if (error) {
    console.error(error);
    avisar("Error eliminando ingrediente", "error");
    return;
  }

  await cargarRecetasSupabase();
  renderTodo();

  avisar("Ingrediente eliminado", "success");
}

async function guardarRecetaActual() {
  if (!recetaActual) {
    avisar("No hay receta seleccionada", "error");
    return;
  }

  await cargarRecetasSupabase();
  renderTodo();

  avisar("Receta guardada correctamente", "success");
}

// =================================
// RENDER
// =================================

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
    tbody.innerHTML = `
      <tr>
        <td colspan="7">No hay ingredientes cargados</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML =
    recetaActual.ingredientes.map(i => `
      <tr>
        <td>${i.nombre}</td>
        <td>${money(i.precioCompra)}</td>
        <td>${i.cantidadCompra} ${i.unidadCompra}</td>
        <td>${i.cantidadUsada} ${i.unidadUsada}</td>
        <td><strong>${money(calcularCostoIngrediente(i))}</strong></td>
        <td>
          <button class="detail-btn" onclick="editarIngrediente('${i.id}')">
            Editar
          </button>
        </td>
        <td>
          <button class="mini-danger-btn" onclick="eliminarIngrediente('${i.id}')">
            Eliminar
          </button>
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
    <span>
      ${recetaActual.cantidadFinal} ${recetaActual.unidadFinal}
      · ${recetaActual.ingredientes.length} ingredientes
      · Total: ${money(calc.total)}
    </span>
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

// =================================
// INIT
// =================================

document.addEventListener("DOMContentLoaded", async () => {
  activarFormatoDineroProduccion();
  await cargarRecetasSupabase();
  renderTodo();
});