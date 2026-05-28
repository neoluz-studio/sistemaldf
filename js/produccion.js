// =================================
// PRODUCCIÓN PRO + SUPABASE
// LO DE FAUSTI
// =================================

let productos = [];
let recetas = [];
let historialProduccion = [];

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

function formatFecha(data) {
  return new Date(data).toLocaleDateString("es-AR");
}

function formatFechaCompleta(data) {
  return new Date(data).toLocaleString("es-AR");
}

function generarLote() {
  const numero = historialProduccion.length + 1;
  return `LOTE-${String(numero).padStart(4, "0")}`;
}

function getProducto(id) {
  return productos.find(
    p => String(p.id) === String(id)
  );
}

// =================================
// SUPABASE CARGA
// =================================

async function cargarDatosSupabase() {

  if (typeof supabaseClient === "undefined") {

    productos =
      JSON.parse(
        localStorage.getItem("productos")
      ) || [];

    recetas =
      JSON.parse(
        localStorage.getItem("recetas")
      ) || [];

    historialProduccion =
      JSON.parse(
        localStorage.getItem("historialProduccion")
      ) || [];

    return;
  }

  // PRODUCTOS

  const {

    data: productosData,

    error: productosError

  } = await supabaseClient

    .from("productos")

    .select("*")

    .eq("activo", true);

  if (!productosError) {

    productos = productosData || [];

    localStorage.setItem(
      "productos",
      JSON.stringify(productos)
    );
  }

  // RECETAS

  const {

    data: recetasData,

    error: recetasError

  } = await supabaseClient

    .from("recetas")

    .select("*");

  if (recetasError) {

    console.error(recetasError);

  } else {

    recetas = [];

    for (const receta of recetasData || []) {

      const {

        data: ingredientesData,

        error: ingredientesError

      } = await supabaseClient

        .from("receta_ingredientes")

        .select("*")

        .eq(
          "receta_id",
          receta.id
        );

      if (ingredientesError) {
        console.error(ingredientesError);
      }

      recetas.push({

        id:
          receta.id,

        nombre:
          receta.nombre,

        cantidadBase:
          receta.cantidad_base || 1,

        ingredientes:
          (ingredientesData || []).map(i => ({

            productoId:
              i.producto_id,

            nombre:
              i.nombre,

            cantidad:
              Number(i.cantidad || 0)
          }))
      });
    }

    localStorage.setItem(
      "recetas",
      JSON.stringify(recetas)
    );
  }

  // PRODUCCIÓN

  const {

    data: produccionData,

    error: produccionError

  } = await supabaseClient

    .from("produccion")

    .select("*")

    .order(
      "fecha",
      { ascending: false }
    );

  if (produccionError) {

    console.error(produccionError);

  } else {

    historialProduccion = [];

    for (const prod of produccionData || []) {

      const {

        data: detalleData,

        error: detalleError

      } = await supabaseClient

        .from("produccion_detalle")

        .select("*")

        .eq(
          "produccion_id",
          prod.id
        );

      if (detalleError) {
        console.error(detalleError);
      }

      historialProduccion.push({

        id:
          prod.id,

        lote:
          prod.lote,

        recetaId:
          prod.receta_id,

        receta:
          prod.receta,

        cantidad:
          Number(prod.cantidad || 0),

        costoTotal:
          Number(prod.costo_total || 0),

        costoUnitario:
          Number(prod.costo_unitario || 0),

        usuario:
          prod.usuario || "Lodefausti",

        fecha:
          prod.fecha,

        ingredientesUsados:
          (detalleData || []).map(i => ({

            productoId:
              i.producto_id,

            nombre:
              i.nombre,

            cantidad:
              Number(i.cantidad || 0),

            unidad:
              i.unidad,

            costoUnitario:
              Number(i.costo_unitario || 0),

            costoTotal:
              Number(i.costo_total || 0)
          }))
      });
    }

    localStorage.setItem(
      "historialProduccion",
      JSON.stringify(historialProduccion)
    );
  }
}

// =================================
// COSTOS
// =================================

function calcularCostoReceta(
  receta,
  cantidadFinal = null
) {

  if (!receta) {

    return {
      costoTotal: 0,
      costoUnitario: 0
    };
  }

  const cantidadBase =
    Number(
      receta.cantidadBase || 1
    );

  const cantidad =
    cantidadFinal || cantidadBase;

  const factor =
    cantidad / cantidadBase;

  let costoTotal = 0;

  receta.ingredientes.forEach(i => {

    const producto =
      getProducto(i.productoId);

    if (!producto) return;

    const requerido =
      Number(i.cantidad || 0)
      *
      factor;

    const costo =
      Number(producto.costo || 0);

    costoTotal +=
      requerido * costo;
  });

  const costoUnitario =
    cantidad > 0
      ? costoTotal / cantidad
      : 0;

  return {
    costoTotal,
    costoUnitario
  };
}

// =================================
// CREAR RECETA
// =================================

async function crearReceta() {

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

  if (!nombre || cantidad <= 0) {

    avisar(
      "Completá los campos",
      "error"
    );

    return;
  }

  const existe =
    recetas.some(
      r =>
        r.nombre.toLowerCase()
        ===
        nombre.toLowerCase()
    );

  if (existe) {

    avisar(
      "Ya existe una receta",
      "error"
    );

    return;
  }

  const nuevaReceta = {

    nombre,

    cantidad_base:
      cantidad
  };

  if (typeof supabaseClient !== "undefined") {

    const {

      data,

      error

    } = await supabaseClient

      .from("recetas")

      .insert([nuevaReceta])

      .select()

      .single();

    if (error) {

      console.error(error);

      avisar(
        "Error creando receta",
        "error"
      );

      return;
    }

    recetaActual = {

      id:
        data.id,

      nombre:
        data.nombre,

      cantidadBase:
        data.cantidad_base,

      ingredientes:
        []
    };

  } else {

    recetaActual = {

      id:
        Date.now(),

      nombre,

      cantidadBase:
        cantidad,

      ingredientes:
        []
    };
  }

  recetas.push(recetaActual);

  localStorage.setItem(
    "recetas",
    JSON.stringify(recetas)
  );

  document.getElementById(
    "nombreReceta"
  ).value = "";

  document.getElementById(
    "cantidadProduccion"
  ).value = "";

  cargarRecetas();

  renderRecetasGrid();

  renderIngredientes();

  renderResumenReceta();

  renderStatsProduccion();

  avisar(
    "Receta creada",
    "success"
  );
}

// =================================
// PRODUCTOS
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
        |
        Stock:
        ${p.stock || 0}
      </option>
    `;
  });
}

// =================================
// RECETAS
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

  if (recetaActual) {
    select.value = recetaActual.id;
  }
}

function seleccionarReceta() {

  const recetaId =
    document.getElementById(
      "recetaProduccion"
    )?.value;

  recetaActual =
    recetas.find(
      r =>
        String(r.id)
        ===
        String(recetaId)
    );

  renderIngredientes();

  renderResumenReceta();

  renderRecetasGrid();
}

// =================================
// INGREDIENTES
// =================================

async function agregarIngrediente() {

  if (!recetaActual) {

    avisar(
      "Seleccioná una receta",
      "error"
    );

    return;
  }

  const productoId =
    document.getElementById(
      "productoIngrediente"
    ).value;

  const cantidad =
    Number(
      document.getElementById(
        "cantidadIngrediente"
      ).value
    );

  const producto =
    getProducto(productoId);

  if (!producto || cantidad <= 0) {

    avisar(
      "Datos inválidos",
      "error"
    );

    return;
  }

  const ingrediente = {

    receta_id:
      recetaActual.id,

    producto_id:
      productoId,

    nombre:
      producto.nombre,

    cantidad
  };

  if (typeof supabaseClient !== "undefined") {

    const { error } =

      await supabaseClient

        .from("receta_ingredientes")

        .insert([ingrediente]);

    if (error) {

      console.error(error);

      avisar(
        "Error guardando ingrediente",
        "error"
      );

      return;
    }
  }

  recetaActual.ingredientes.push({

    productoId,

    nombre:
      producto.nombre,

    cantidad
  });

  recetas = recetas.map(r =>
    String(r.id)
    ===
    String(recetaActual.id)
      ? recetaActual
      : r
  );

  localStorage.setItem(
    "recetas",
    JSON.stringify(recetas)
  );

  renderIngredientes();

  renderResumenReceta();

  renderRecetasGrid();

  avisar(
    "Ingrediente agregado",
    "success"
  );
}

// =================================
// PRODUCIR
// =================================

async function producir() {

  const recetaId =
    document.getElementById(
      "recetaProduccion"
    ).value;

  const cantidadFinal =
    Number(
      document.getElementById(
        "cantidadFinal"
      ).value
    );

  const receta =
    recetas.find(
      r =>
        String(r.id)
        ===
        String(recetaId)
    );

  if (!receta || cantidadFinal <= 0) {

    avisar(
      "Datos inválidos",
      "error"
    );

    return;
  }

  const cantidadBase =
    Number(
      receta.cantidadBase || 1
    );

  const factor =
    cantidadFinal / cantidadBase;

  const costo =
    calcularCostoReceta(
      receta,
      cantidadFinal
    );

  const ingredientesUsados =
    receta.ingredientes.map(i => {

      const producto =
        getProducto(i.productoId);

      const requerido =
        Number(i.cantidad || 0)
        *
        factor;

      return {

        productoId:
          i.productoId,

        nombre:
          i.nombre,

        cantidad:
          requerido,

        unidad:
          producto?.unidad || "-",

        costoUnitario:
          Number(
            producto?.costo || 0
          ),

        costoTotal:
          requerido *
          Number(
            producto?.costo || 0
          )
      };
    });

  // DESCONTAR STOCK

  for (const item of ingredientesUsados) {

    const producto =
      getProducto(item.productoId);

    if (!producto) continue;

    const nuevoStock =
      Number(producto.stock || 0)
      -
      item.cantidad;

    producto.stock =
      nuevoStock;

    if (typeof supabaseClient !== "undefined") {

      await supabaseClient

        .from("productos")

        .update({
          stock:
            nuevoStock
        })

        .eq(
          "id",
          item.productoId
        );
    }
  }

  // PRODUCTO FINAL

  let productoFinal =
    productos.find(
      p =>
        String(p.nombre || "")
          .toLowerCase()
        ===
        String(receta.nombre || "")
          .toLowerCase()
    );

  if (!productoFinal) {

    productoFinal = {

      nombre:
        receta.nombre,

      precio:
        0,

      costo:
        Math.round(
          costo.costoUnitario
        ),

      stock:
        0,

      tipo:
        "elaborado",

      unidad:
        "unidad",

      activo:
        true
    };

    if (typeof supabaseClient !== "undefined") {

      const {

        data,

        error

      } = await supabaseClient

        .from("productos")

        .insert([productoFinal])

        .select()

        .single();

      if (!error && data) {

        productoFinal.id =
          data.id;
      }
    }

    productos.push(productoFinal);
  }

  productoFinal.stock =
    Number(
      productoFinal.stock || 0
    )
    +
    cantidadFinal;

  productoFinal.costo =
    Math.round(
      costo.costoUnitario
    );

  if (typeof supabaseClient !== "undefined") {

    await supabaseClient

      .from("productos")

      .update({

        stock:
          productoFinal.stock,

        costo:
          productoFinal.costo

      })

      .eq(
        "id",
        productoFinal.id
      );
  }

  // PRODUCCIÓN

  const registro = {

    lote:
      generarLote(),

    receta_id:
      receta.id,

    receta:
      receta.nombre,

    cantidad:
      cantidadFinal,

    costo_total:
      Math.round(
        costo.costoTotal
      ),

    costo_unitario:
      Math.round(
        costo.costoUnitario
      ),

    usuario:
      JSON.parse(
        localStorage.getItem("usuario")
      )?.nombre || "Local",

    fecha:
      new Date().toISOString()
  };

  let produccionId =
    Date.now();

  if (typeof supabaseClient !== "undefined") {

    const {

      data,

      error

    } = await supabaseClient

      .from("produccion")

      .insert([registro])

      .select()

      .single();

    if (error) {

      console.error(error);

      avisar(
        "Error registrando producción",
        "error"
      );

      return;
    }

    produccionId =
      data.id;
  }

  // DETALLE

  if (typeof supabaseClient !== "undefined") {

    const detalleData =
      ingredientesUsados.map(i => ({

        produccion_id:
          produccionId,

        producto_id:
          i.productoId,

        nombre:
          i.nombre,

        cantidad:
          i.cantidad,

        unidad:
          i.unidad,

        costo_unitario:
          i.costoUnitario,

        costo_total:
          i.costoTotal
      }));

    await supabaseClient

      .from("produccion_detalle")

      .insert(detalleData);
  }

  historialProduccion.push({

    id:
      produccionId,

    lote:
      registro.lote,

    recetaId:
      receta.id,

    receta:
      receta.nombre,

    cantidad:
      cantidadFinal,

    costoTotal:
      registro.costo_total,

    costoUnitario:
      registro.costo_unitario,

    ingredientesUsados,

    usuario:
      registro.usuario,

    fecha:
      registro.fecha
  });

  localStorage.setItem(
    "productos",
    JSON.stringify(productos)
  );

  localStorage.setItem(
    "historialProduccion",
    JSON.stringify(historialProduccion)
  );

  cargarProductos();

  renderHistorial();

  renderResumenReceta();

  renderRecetasGrid();

  renderStatsProduccion();

  document.getElementById(
    "cantidadFinal"
  ).value = "";

  avisar(
    "Producción realizada",
    "success"
  );
}

// =================================
// RENDERS
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
    recetaActual.ingredientes.length === 0
  ) {

    cont.innerHTML = `
      <tr>
        <td colspan="5">
          No hay ingredientes
        </td>
      </tr>
    `;

    return;
  }

  recetaActual.ingredientes.forEach(i => {

    const producto =
      getProducto(i.productoId);

    const subtotal =
      Number(producto?.costo || 0)
      *
      Number(i.cantidad || 0);

    cont.innerHTML += `
      <tr>

        <td>${i.nombre}</td>

        <td>${i.cantidad}</td>

        <td>${producto?.unidad || "-"}</td>

        <td>${money(subtotal)}</td>

      </tr>
    `;
  });
}

function renderResumenReceta() {

  const cont =
    document.getElementById(
      "resumenReceta"
    );

  if (!cont) return;

  if (!recetaActual) {

    cont.innerHTML = `
      <div class="empty-state">
        Seleccioná una receta
      </div>
    `;

    return;
  }

  const costo =
    calcularCostoReceta(
      recetaActual
    );

  cont.innerHTML = `

    <div class="recipe-summary-card">

      <span>
        Receta actual
      </span>

      <strong>
        ${recetaActual.nombre}
      </strong>

    </div>

    <div class="recipe-summary-card">

      <span>
        Costo unitario
      </span>

      <strong>
        ${money(costo.costoUnitario)}
      </strong>

    </div>

    <div class="recipe-summary-card">

      <span>
        Ingredientes
      </span>

      <strong>
        ${recetaActual.ingredientes.length}
      </strong>

    </div>
  `;
}

function renderRecetasGrid() {

  const cont =
    document.getElementById(
      "recetasGrid"
    );

  if (!cont) return;

  if (recetas.length === 0) {

    cont.innerHTML = `
      <div class="empty-state">
        No hay recetas
      </div>
    `;

    return;
  }

  cont.innerHTML =
    recetas.map(r => {

      const activa =
        recetaActual &&
        String(recetaActual.id)
        ===
        String(r.id);

      const costo =
        calcularCostoReceta(r);

      return `

        <div class="recipe-card ${activa ? "active" : ""}">

          <div class="recipe-card-header">

            <div>

              <h4>${r.nombre}</h4>

              <p>
                Base:
                ${r.cantidadBase || 1}
              </p>

            </div>

          </div>

          <div class="recipe-card-stats">

            <div>

              <span>
                Costo unit.
              </span>

              <strong>
                ${money(costo.costoUnitario)}
              </strong>

            </div>

          </div>

          <div class="recipe-card-actions">

            <button
              type="button"
              onclick="seleccionarRecetaCard('${r.id}')"
            >
              Seleccionar
            </button>

          </div>

        </div>
      `;
    }).join("");
}

function seleccionarRecetaCard(id) {

  recetaActual =
    recetas.find(
      r =>
        String(r.id)
        ===
        String(id)
    );

  const select =
    document.getElementById(
      "recetaProduccion"
    );

  if (select && recetaActual) {
    select.value =
      recetaActual.id;
  }

  renderIngredientes();

  renderResumenReceta();

  renderRecetasGrid();
}

function renderHistorial() {

  const cont =
    document.getElementById(
      "historialProduccion"
    );

  if (!cont) return;

  cont.innerHTML = "";

  if (historialProduccion.length === 0) {

    cont.innerHTML = `
      <tr>
        <td colspan="7">
          No hay producción
        </td>
      </tr>
    `;

    return;
  }

  historialProduccion
    .slice()
    .reverse()
    .forEach(h => {

      cont.innerHTML += `

        <tr>

          <td>${h.lote || "-"}</td>

          <td>${h.receta}</td>

          <td>${h.cantidad}</td>

          <td>${money(h.costoTotal)}</td>

          <td>${money(h.costoUnitario)}</td>

          <td>${formatFecha(h.fecha)}</td>

        </tr>
      `;
    });
}

function renderStatsProduccion() {

  const totalProducciones =
    historialProduccion.length;

  const costoGlobal =
    historialProduccion.reduce(
      (acc, h) =>
        acc + Number(h.costoTotal || 0),
      0
    );

  const totalRecetasEl =
    document.getElementById(
      "totalRecetas"
    );

  const totalProduccionesEl =
    document.getElementById(
      "totalProducciones"
    );

  const costoProduccionEl =
    document.getElementById(
      "costoProduccion"
    );

  if (totalRecetasEl)
    totalRecetasEl.innerText =
      recetas.length;

  if (totalProduccionesEl)
    totalProduccionesEl.innerText =
      totalProducciones;

  if (costoProduccionEl)
    costoProduccionEl.innerText =
      money(costoGlobal);
}

// =================================
// INIT
// =================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await cargarDatosSupabase();

    cargarProductos();

    cargarRecetas();

    if (recetas.length > 0) {
      recetaActual = recetas[0];
    }

    const recetaSelect =
      document.getElementById(
        "recetaProduccion"
      );

    if (recetaSelect) {

      recetaSelect.addEventListener(
        "change",
        seleccionarReceta
      );
    }

    renderRecetasGrid();

    renderIngredientes();

    renderResumenReceta();

    renderHistorial();

    renderStatsProduccion();
  }
);