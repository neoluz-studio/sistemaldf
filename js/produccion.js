// =================================
// PRODUCCIÓN PRO V2 - LO DE FAUSTI
// =================================

let productos =
  JSON.parse(localStorage.getItem("productos")) || [];

let recetas =
  JSON.parse(localStorage.getItem("recetas")) || [];

let historialProduccion =
  JSON.parse(localStorage.getItem("historialProduccion")) || [];

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

function guardarProductos() {
  localStorage.setItem("productos", JSON.stringify(productos));
}

function guardarRecetas() {
  localStorage.setItem("recetas", JSON.stringify(recetas));
}

function guardarHistorial() {
  localStorage.setItem(
    "historialProduccion",
    JSON.stringify(historialProduccion)
  );
}

function getProducto(id) {
  return productos.find(p => Number(p.id) === Number(id));
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

// =================================
// COSTOS Y CAPACIDAD
// =================================

function calcularCostoReceta(receta, cantidadFinal = null) {
  if (!receta) {
    return {
      costoTotal: 0,
      costoUnitario: 0
    };
  }

  const cantidadBase =
    Number(receta.cantidadBase || receta.cantidad || 1);

  const cantidad =
    cantidadFinal || cantidadBase;

  const factor =
    cantidad / cantidadBase;

  let costoTotal = 0;

  receta.ingredientes.forEach(i => {
    const producto = getProducto(i.productoId);

    if (!producto) return;

    const requerido =
      Number(i.cantidad || 0) * factor;

    const costo =
      Number(producto.costo || 0);

    costoTotal += requerido * costo;
  });

  const costoUnitario =
    cantidad > 0 ? costoTotal / cantidad : 0;

  return {
    costoTotal,
    costoUnitario
  };
}

function calcularProduccionMaxima(receta) {
  if (!receta || !receta.ingredientes.length) {
    return 0;
  }

  const cantidadBase =
    Number(receta.cantidadBase || receta.cantidad || 1);

  let maximo = Infinity;

  receta.ingredientes.forEach(i => {
    const producto = getProducto(i.productoId);

    if (!producto) {
      maximo = 0;
      return;
    }

    const stockDisponible =
      Number(producto.stock || 0);

    const requeridoBase =
      Number(i.cantidad || 0);

    if (requeridoBase <= 0) {
      return;
    }

    const unidadesPosibles =
      Math.floor(
        (stockDisponible / requeridoBase) *
        cantidadBase
      );

    maximo =
      Math.min(maximo, unidadesPosibles);
  });

  if (maximo === Infinity) return 0;

  return Math.max(0, maximo);
}

function obtenerAlertasReceta(receta) {
  if (!receta) return [];

  const alertas = [];

  receta.ingredientes.forEach(i => {
    const producto = getProducto(i.productoId);

    if (!producto) {
      alertas.push({
        tipo: "danger",
        texto: `${i.nombre} no existe en productos`
      });

      return;
    }

    if (Number(producto.stock || 0) <= 0) {
      alertas.push({
        tipo: "danger",
        texto: `${producto.nombre} sin stock`
      });
    }

    if (Number(producto.stock || 0) <= 5) {
      alertas.push({
        tipo: "warning",
        texto: `${producto.nombre} con stock bajo`
      });
    }
  });

  return alertas;
}

// =================================
// CREAR RECETA
// =================================

function crearReceta() {
  const nombre =
    document.getElementById("nombreReceta").value.trim();

  const cantidad =
    Number(document.getElementById("cantidadProduccion").value);

  if (!nombre || cantidad <= 0) {
    avisar("Completá los campos", "error");
    return;
  }

  const existe = recetas.some(
    r => r.nombre.toLowerCase() === nombre.toLowerCase()
  );

  if (existe) {
    avisar("Ya existe una receta con ese nombre", "error");
    return;
  }

  recetaActual = {
    id: Date.now(),
    nombre,
    cantidadBase: cantidad,
    ingredientes: []
  };

  recetas.push(recetaActual);

  guardarRecetas();

  document.getElementById("nombreReceta").value = "";
  document.getElementById("cantidadProduccion").value = "";

  cargarRecetas();
  renderRecetasGrid();
  renderIngredientes();
  renderResumenReceta();
  renderStatsProduccion();

  avisar("Receta creada", "success");
}

// =================================
// CARGAR PRODUCTOS
// =================================

function cargarProductos() {
  const select =
    document.getElementById("productoIngrediente");

  if (!select) return;

  select.innerHTML = "";

  if (productos.length === 0) {
    select.innerHTML = `
      <option value="">
        No hay productos cargados
      </option>
    `;

    return;
  }

  productos.forEach(p => {
    select.innerHTML += `
      <option value="${p.id}">
        ${p.nombre} | Stock: ${p.stock || 0} | Costo: ${money(p.costo || 0)}
      </option>
    `;
  });
}

// =================================
// CARGAR RECETAS
// =================================

function cargarRecetas() {
  const select =
    document.getElementById("recetaProduccion");

  if (!select) return;

  select.innerHTML = "";

  if (recetas.length === 0) {
    select.innerHTML = `
      <option value="">
        No hay recetas
      </option>
    `;

    return;
  }

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

// =================================
// SELECCIONAR RECETA
// =================================

function seleccionarReceta() {
  const recetaId =
    Number(document.getElementById("recetaProduccion")?.value);

  recetaActual =
    recetas.find(r => Number(r.id) === Number(recetaId)) ||
    recetaActual;

  renderIngredientes();
  renderResumenReceta();
  renderRecetasGrid();
}

// =================================
// RECETAS GRID
// =================================

function seleccionarRecetaCard(id) {
  recetaActual =
    recetas.find(r => Number(r.id) === Number(id));

  const select =
    document.getElementById("recetaProduccion");

  if (select && recetaActual) {
    select.value = recetaActual.id;
  }

  renderIngredientes();
  renderResumenReceta();
  renderRecetasGrid();
}

function renderRecetasGrid() {
  const cont =
    document.getElementById("recetasGrid");

  if (!cont) return;

  if (recetas.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        No hay recetas creadas
      </div>
    `;

    return;
  }

  cont.innerHTML = recetas.map(r => {
    const costo =
      calcularCostoReceta(r);

    const maximo =
      calcularProduccionMaxima(r);

    const activa =
      recetaActual &&
      Number(recetaActual.id) === Number(r.id);

    const alertas =
      obtenerAlertasReceta(r);

    return `
      <div class="recipe-card ${activa ? "active" : ""}">

        <div class="recipe-card-header">

          <div>
            <h4>${r.nombre}</h4>
            <p>Base: ${r.cantidadBase || r.cantidad || 1} unidades</p>
          </div>

          <span class="recipe-pill">
            ${r.ingredientes.length} ing.
          </span>

        </div>

        <div class="recipe-card-stats">

          <div>
            <span>Costo unit.</span>
            <strong>${money(costo.costoUnitario)}</strong>
          </div>

          <div>
            <span>Máx. posible</span>
            <strong>${maximo}</strong>
          </div>

        </div>

        ${
          alertas.length > 0
            ? `
              <div class="recipe-alerts">
                ${alertas.slice(0, 2).map(a => `
                  <small class="${a.tipo}">
                    ${a.texto}
                  </small>
                `).join("")}
              </div>
            `
            : `
              <div class="recipe-ok">
                Stock suficiente
              </div>
            `
        }

        <div class="recipe-card-actions">

          <button
            type="button"
            onclick="seleccionarRecetaCard(${r.id})"
          >
            Seleccionar
          </button>

          <button
            type="button"
            onclick="verDetalleReceta(${r.id})"
          >
            Detalle
          </button>

        </div>

      </div>
    `;
  }).join("");
}

// =================================
// AGREGAR INGREDIENTE
// =================================

function agregarIngrediente() {
  if (!recetaActual) {
    avisar("Primero creá o seleccioná una receta", "error");
    return;
  }

  const productoId =
    Number(document.getElementById("productoIngrediente").value);

  const cantidad =
    Number(document.getElementById("cantidadIngrediente").value);

  const producto =
    getProducto(productoId);

  if (!producto || cantidad <= 0) {
    avisar("Datos inválidos", "error");
    return;
  }

  const existente =
    recetaActual.ingredientes.find(
      i => Number(i.productoId) === Number(productoId)
    );

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    recetaActual.ingredientes.push({
      productoId,
      nombre: producto.nombre,
      cantidad
    });
  }

  recetas = recetas.map(r =>
    Number(r.id) === Number(recetaActual.id)
      ? recetaActual
      : r
  );

  guardarRecetas();

  document.getElementById("cantidadIngrediente").value = "";

  renderIngredientes();
  renderResumenReceta();
  renderRecetasGrid();

  avisar("Ingrediente agregado", "success");
}

// =================================
// RENDER INGREDIENTES
// =================================

function renderIngredientes() {
  const cont =
    document.getElementById("listaIngredientes");

  if (!cont) return;

  cont.innerHTML = "";

  if (!recetaActual || recetaActual.ingredientes.length === 0) {
    cont.innerHTML = `
      <tr>
        <td colspan="5">
          No hay ingredientes
        </td>
      </tr>
    `;

    return;
  }

  recetaActual.ingredientes.forEach((i, index) => {
    const producto =
      getProducto(i.productoId);

    const costo =
      Number(producto?.costo || 0);

    const subtotal =
      costo * Number(i.cantidad || 0);

    cont.innerHTML += `
      <tr>
        <td>${i.nombre}</td>
        <td>${i.cantidad}</td>
        <td>${producto?.unidad || "-"}</td>
        <td>${money(subtotal)}</td>
        <td>
          <button
            type="button"
            class="mini-danger-btn"
            onclick="eliminarIngrediente(${index})"
          >
            Eliminar
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
  if (!recetaActual) return;

  recetaActual.ingredientes.splice(index, 1);

  recetas = recetas.map(r =>
    Number(r.id) === Number(recetaActual.id)
      ? recetaActual
      : r
  );

  guardarRecetas();

  renderIngredientes();
  renderResumenReceta();
  renderRecetasGrid();

  avisar("Ingrediente eliminado", "info");
}

// =================================
// RESUMEN RECETA
// =================================

function renderResumenReceta() {
  const cont =
    document.getElementById("resumenReceta");

  if (!cont) return;

  if (!recetaActual) {
    cont.innerHTML = `
      <div class="empty-state">
        Seleccioná o creá una receta para ver el resumen
      </div>
    `;

    return;
  }

  const cantidadBase =
    Number(recetaActual.cantidadBase || recetaActual.cantidad || 1);

  const costo =
    calcularCostoReceta(recetaActual);

  const maximo =
    calcularProduccionMaxima(recetaActual);

  const alertas =
    obtenerAlertasReceta(recetaActual);

  cont.innerHTML = `
    <div class="recipe-summary-card">
      <span>Receta actual</span>
      <strong>${recetaActual.nombre}</strong>
    </div>

    <div class="recipe-summary-card">
      <span>Cantidad base</span>
      <strong>${cantidadBase}</strong>
    </div>

    <div class="recipe-summary-card">
      <span>Costo unitario</span>
      <strong>${money(costo.costoUnitario)}</strong>
    </div>

    <div class="recipe-summary-card">
      <span>Producción máxima posible</span>
      <strong>${maximo}</strong>
    </div>

    ${
      alertas.length > 0
        ? `
          <div class="recipe-alert-box">
            ${alertas.map(a => `
              <div class="${a.tipo}">
                ${a.texto}
              </div>
            `).join("")}
          </div>
        `
        : `
          <div class="recipe-ok big">
            Stock suficiente para producir
          </div>
        `
    }
  `;
}

// =================================
// PRODUCIR
// =================================

function producir() {
  const recetaId =
    Number(document.getElementById("recetaProduccion").value);

  const cantidadFinal =
    Number(document.getElementById("cantidadFinal").value);

  const receta =
    recetas.find(r => Number(r.id) === Number(recetaId));

  if (!receta || cantidadFinal <= 0) {
    avisar("Datos inválidos", "error");
    return;
  }

  if (!receta.ingredientes || receta.ingredientes.length === 0) {
    avisar("La receta no tiene ingredientes", "error");
    return;
  }

  const maximo =
    calcularProduccionMaxima(receta);

  if (cantidadFinal > maximo) {
    avisar(
      `No hay stock suficiente. Máximo posible: ${maximo}`,
      "error"
    );

    return;
  }

  const cantidadBase =
    Number(receta.cantidadBase || receta.cantidad || 1);

  const factor =
    cantidadFinal / cantidadBase;

  const costo =
    calcularCostoReceta(receta, cantidadFinal);

  const ingredientesUsados =
    receta.ingredientes.map(i => {
      const producto =
        getProducto(i.productoId);

      const requerido =
        Number(i.cantidad || 0) * factor;

      return {
        productoId: i.productoId,
        nombre: i.nombre,
        cantidad: requerido,
        unidad: producto?.unidad || "-",
        costoUnitario: Number(producto?.costo || 0),
        costoTotal: requerido * Number(producto?.costo || 0)
      };
    });

  productos = productos.map(p => {
    const usado =
      ingredientesUsados.find(
        i => Number(i.productoId) === Number(p.id)
      );

    if (!usado) return p;

    return {
      ...p,
      stock: Number(p.stock || 0) - usado.cantidad
    };
  });

  let productoFinal =
    productos.find(
      p =>
        String(p.nombre || "").toLowerCase() ===
        String(receta.nombre || "").toLowerCase()
    );

  if (!productoFinal) {
    productoFinal = {
      id: Date.now(),
      nombre: receta.nombre,
      precio: 0,
      costo: Math.round(costo.costoUnitario),
      stock: 0,
      tipo: "elaborado",
      unidad: "unidad"
    };

    productos.push(productoFinal);
  }

  productoFinal.stock =
    Number(productoFinal.stock || 0) + cantidadFinal;

  productoFinal.costo =
    Math.round(costo.costoUnitario);

  const registro = {
    id: Date.now(),
    lote: generarLote(),
    recetaId: receta.id,
    receta: receta.nombre,
    cantidad: cantidadFinal,
    costoTotal: Math.round(costo.costoTotal),
    costoUnitario: Math.round(costo.costoUnitario),
    ingredientesUsados,
    usuario:
      JSON.parse(localStorage.getItem("usuario"))?.nombre || "Local",
    fecha: new Date().toISOString()
  };

  historialProduccion.push(registro);

  guardarProductos();
  guardarHistorial();

  cargarProductos();
  renderHistorial();
  renderResumenReceta();
  renderRecetasGrid();
  renderStatsProduccion();

  document.getElementById("cantidadFinal").value = "";

  avisar("Producción realizada correctamente", "success");
}

// =================================
// HISTORIAL
// =================================

function renderHistorial() {
  const cont =
    document.getElementById("historialProduccion");

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

    renderStatsProduccion();
    return;
  }

  [...historialProduccion]
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
          <td>
            <button
              type="button"
              class="detail-btn"
              onclick="verDetalleProduccion(${h.id})"
            >
              Ver
            </button>
          </td>
        </tr>
      `;
    });

  renderStatsProduccion();
}

// =================================
// DETALLE RECETA
// =================================

function verDetalleReceta(id) {
  const receta =
    recetas.find(r => Number(r.id) === Number(id));

  if (!receta) return;

  const costo =
    calcularCostoReceta(receta);

  const maximo =
    calcularProduccionMaxima(receta);

  const ingredientes = receta.ingredientes.length
    ? receta.ingredientes.map(i => {
        const producto =
          getProducto(i.productoId);

        return `
          <div class="detail-item">
            <div>
              <strong>${i.nombre}</strong>
              <small>Base: ${i.cantidad} ${producto?.unidad || ""}</small>
            </div>

            <span>
              Stock: ${producto?.stock || 0}
            </span>
          </div>
        `;
      }).join("")
    : `<div class="empty-state">Sin ingredientes</div>`;

  abrirModal(`
    <div class="modal-header-pro">
      <div>
        <h3>${receta.nombre}</h3>
        <p>Detalle de receta</p>
      </div>

      <button class="modal-close" onclick="cerrarModalProduccion()">
        ✕
      </button>
    </div>

    <div class="modal-summary-grid">
      <div>
        <span>Costo unitario</span>
        <strong>${money(costo.costoUnitario)}</strong>
      </div>

      <div>
        <span>Máximo posible</span>
        <strong>${maximo}</strong>
      </div>
    </div>

    <div class="detail-list">
      ${ingredientes}
    </div>
  `);
}

// =================================
// DETALLE PRODUCCIÓN
// =================================

function verDetalleProduccion(id) {
  const prod =
    historialProduccion.find(
      h => Number(h.id) === Number(id)
    );

  if (!prod) return;

  const ingredientes = prod.ingredientesUsados?.length
    ? prod.ingredientesUsados.map(i => `
        <div class="detail-item">
          <div>
            <strong>${i.nombre}</strong>
            <small>${i.cantidad} ${i.unidad}</small>
          </div>

          <span>
            ${money(i.costoTotal)}
          </span>
        </div>
      `).join("")
    : `<div class="empty-state">Sin detalle</div>`;

  abrirModal(`
    <div class="modal-header-pro">
      <div>
        <h3>${prod.lote || "Producción"}</h3>
        <p>${prod.receta} · ${formatFechaCompleta(prod.fecha)}</p>
      </div>

      <button class="modal-close" onclick="cerrarModalProduccion()">
        ✕
      </button>
    </div>

    <div class="modal-summary-grid">
      <div>
        <span>Cantidad</span>
        <strong>${prod.cantidad}</strong>
      </div>

      <div>
        <span>Costo total</span>
        <strong>${money(prod.costoTotal)}</strong>
      </div>

      <div>
        <span>Costo unitario</span>
        <strong>${money(prod.costoUnitario)}</strong>
      </div>
    </div>

    <div class="detail-list">
      ${ingredientes}
    </div>
  `);
}

// =================================
// MODAL
// =================================

function abrirModal(contenido) {
  const overlay =
    document.createElement("div");

  overlay.className =
    "modal-overlay";

  overlay.id =
    "modalProduccion";

  overlay.innerHTML = `
    <div class="modal produccion-modal">
      ${contenido}
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.onclick = e => {
    if (e.target === overlay) {
      cerrarModalProduccion();
    }
  };
}

function cerrarModalProduccion() {
  document.getElementById("modalProduccion")?.remove();
}

// =================================
// STATS
// =================================

function renderStatsProduccion() {
  const totalProducciones =
    historialProduccion.length;

  const costoGlobal =
    historialProduccion.reduce(
      (acc, h) => acc + Number(h.costoTotal || 0),
      0
    );

  const hoy =
    new Date();

  const hace7Dias =
    new Date();

  hace7Dias.setDate(hoy.getDate() - 7);

  const produccionSemanal =
    historialProduccion.filter(h => {
      const fecha = new Date(h.fecha);
      return fecha >= hace7Dias && fecha <= hoy;
    }).length;

  const totalRecetasEl =
    document.getElementById("totalRecetas");

  const totalProduccionesEl =
    document.getElementById("totalProducciones");

  const costoProduccionEl =
    document.getElementById("costoProduccion");

  const produccionSemanalEl =
    document.getElementById("produccionSemanal");

  if (totalRecetasEl) totalRecetasEl.innerText = recetas.length;
  if (totalProduccionesEl) totalProduccionesEl.innerText = totalProducciones;
  if (costoProduccionEl) costoProduccionEl.innerText = money(costoGlobal);
  if (produccionSemanalEl) produccionSemanalEl.innerText = produccionSemanal;
}

// =================================
// INIT
// =================================

document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  cargarRecetas();

  if (recetas.length > 0) {
    recetaActual = recetas[0];
  }

  const recetaSelect =
    document.getElementById("recetaProduccion");

  if (recetaSelect) {
    recetaSelect.addEventListener("change", seleccionarReceta);
  }

  renderRecetasGrid();
  renderIngredientes();
  renderResumenReceta();
  renderHistorial();
  renderStatsProduccion();
});