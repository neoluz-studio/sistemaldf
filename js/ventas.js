// =================================
// VENTAS PRO + SUPABASE - LO DE FAUSTI
// =================================

let productoSeleccionadoId = null;

let productos =
  JSON.parse(localStorage.getItem("productos")) || [];

let carrito = [];

let descuentoCarrito = {
  tipo: "porcentaje",
  valor: 0
};

let procesandoVenta = false;

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

function getUsuarioActual() {
  return (
    JSON.parse(localStorage.getItem("usuario"))?.nombre ||
    "Lodefausti"
  );
}

function guardarProductosLocal() {
  localStorage.setItem("productos", JSON.stringify(productos));
}

function getStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function limitarNumero(valor, min = 0, max = Infinity) {
  const numero = Number(valor || 0);

  if (numero < min) return min;
  if (numero > max) return max;

  return numero;
}

// =================================
// VENTA PENDIENTE
// =================================

function guardarVentaPendiente() {
  localStorage.setItem(
    "ventaPendienteFausti",
    JSON.stringify({
      carrito,
      descuentoCarrito,
      productoSeleccionadoId
    })
  );
}

function cargarVentaPendiente() {
  const data = JSON.parse(
    localStorage.getItem("ventaPendienteFausti") || "null"
  );

  if (!data) return;

  carrito = data.carrito || [];

  descuentoCarrito =
    data.descuentoCarrito || {
      tipo: "porcentaje",
      valor: 0
    };

  productoSeleccionadoId =
    data.productoSeleccionadoId || null;

  const tipoDesc =
    document.getElementById("tipoDescuentoCarrito");

  const valorDesc =
    document.getElementById("valorDescuentoCarrito");

  if (tipoDesc) tipoDesc.value = descuentoCarrito.tipo || "porcentaje";
  if (valorDesc) valorDesc.value = descuentoCarrito.valor || "";
}

function borrarVentaPendiente() {
  localStorage.removeItem("ventaPendienteFausti");
}

// =================================
// CARGAR PRODUCTOS
// =================================

async function cargarProductosIniciales() {
  if (typeof supabaseClient !== "undefined") {
    const { data, error } = await supabaseClient
      .from("productos")
      .select("*")
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      productos = data;
      guardarProductosLocal();
      renderProductos();
      return;
    }

    console.error(error);
  }

  productos =
    JSON.parse(localStorage.getItem("productos")) || [];

  renderProductos();
}

// =================================
// PRODUCTOS
// =================================

function renderProductos(lista = productos) {
  const cont = document.getElementById("productosGrid");
  if (!cont) return;

  cont.innerHTML = "";

  if (lista.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        No hay productos para mostrar
      </div>
    `;
    return;
  }

  lista.forEach(p => {
    const stock = Number(p.stock || 0);
    const precio = Number(p.precio || 0);

    const div = document.createElement("div");

    div.className = `
      producto-btn
      ${stock <= 0 ? "sin-stock" : ""}
    `;

    div.innerHTML = `
      <strong>${p.nombre}</strong>
      <small>${money(precio)}</small>
      <small>Stock: ${stock}</small>
      ${stock <= 0 ? `<small class="stock-empty">SIN STOCK</small>` : ""}
    `;

    div.onclick = () => {
      agregarAlCarrito(p);
      document.activeElement.blur();
    };

    cont.appendChild(div);
  });
}

// =================================
// BUSCADOR
// =================================

function filtrarProductos() {
  mostrarResultadosBusqueda();
}

function mostrarResultadosBusqueda() {
  const input = document.getElementById("buscador");
  const dropdown = document.getElementById("resultadosBusqueda");

  if (!input || !dropdown) return;

  const texto = input.value.toLowerCase().trim();

  if (!texto) {
    dropdown.classList.add("hidden");
    dropdown.innerHTML = "";
    return;
  }

  const filtrados = productos
    .filter(p =>
      String(p.nombre || "")
        .toLowerCase()
        .includes(texto)
    )
    .slice(0, 8);

  if (filtrados.length === 0) {
    dropdown.innerHTML = `
      <div class="search-result-empty">
        No se encontraron productos
      </div>
    `;
    dropdown.classList.remove("hidden");
    return;
  }

  dropdown.innerHTML = filtrados.map(p => {
    const stock = Number(p.stock || 0);
    const precio = Number(p.precio || 0);

    return `
      <button
        type="button"
        class="search-result-item ${stock <= 0 ? "disabled" : ""}"
        onclick="seleccionarProductoBusqueda('${p.id}')"
      >
        <div>
          <strong>${p.nombre}</strong>
          <small>Stock: ${stock}</small>
        </div>

        <span>${money(precio)}</span>
      </button>
    `;
  }).join("");

  dropdown.classList.remove("hidden");
}

function seleccionarProductoBusqueda(id) {
  const producto = productos.find(
    p => String(p.id) === String(id)
  );

  if (!producto) return;

  agregarAlCarrito(producto);

  const input = document.getElementById("buscador");
  const dropdown = document.getElementById("resultadosBusqueda");

  if (input) {
    input.value = "";
    input.focus();
  }

  if (dropdown) {
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden");
  }
}

document.addEventListener("click", function (e) {
  const wrapper = document.querySelector(".pos-search-wrapper");
  const dropdown = document.getElementById("resultadosBusqueda");

  if (!wrapper || !dropdown) return;

  if (!wrapper.contains(e.target)) {
    dropdown.classList.add("hidden");
  }
});

// =================================
// CARRITO
// =================================

function agregarAlCarrito(prod) {
  if (!prod) return;

  const stock = Number(prod.stock || 0);

  if (stock <= 0) {
    avisar(`${prod.nombre} sin stock`, "error");
    return;
  }

  const existe = carrito.find(
    p => String(p.id) === String(prod.id)
  );

  if (existe) {
    if (existe.cantidad >= stock) {
      avisar(`Stock máximo de ${prod.nombre}`, "error");
      return;
    }

    existe.cantidad++;
  } else {
    carrito.push({
      id: prod.id,
      nombre: prod.nombre,
      precio: Number(prod.precio || 0),
      costo: Number(prod.costo || 0),
      stock,
      cantidad: 1,
      descuentoTipo: "porcentaje",
      descuentoValor: 0
    });
  }

  productoSeleccionadoId = prod.id;

  renderCarrito();
}

function aumentarCantidad(id) {
  const item = carrito.find(
    p => String(p.id) === String(id)
  );

  const producto = productos.find(
    p => String(p.id) === String(id)
  );

  if (!item || !producto) return;

  const stock = Number(producto.stock || 0);

  if (item.cantidad >= stock) {
    avisar("No hay más stock disponible", "error");
    return;
  }

  item.cantidad++;
  productoSeleccionadoId = id;

  renderCarrito();
}

function disminuirCantidad(id) {
  const item = carrito.find(
    p => String(p.id) === String(id)
  );

  if (!item) return;

  item.cantidad--;

  if (item.cantidad <= 0) {
    carrito = carrito.filter(
      p => String(p.id) !== String(id)
    );

    if (String(productoSeleccionadoId) === String(id)) {
      productoSeleccionadoId = null;
    }
  } else {
    productoSeleccionadoId = id;
  }

  renderCarrito();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(
    p => String(p.id) !== String(id)
  );

  if (String(productoSeleccionadoId) === String(id)) {
    productoSeleccionadoId = null;
  }

  renderCarrito();

  avisar("Producto eliminado", "info");
}

// =================================
// DESCUENTOS
// =================================

function aplicarDescuentoProducto(id, tipo) {
  const item = carrito.find(
    p => String(p.id) === String(id)
  );

  if (!item) return;

  const subtotalItem = item.precio * item.cantidad;

  const mensaje =
    tipo === "porcentaje"
      ? "¿Qué porcentaje querés descontar? Máximo 100"
      : `¿Qué monto querés descontar? Máximo ${money(subtotalItem)}`;

  const valor = prompt(mensaje, "0");

  if (valor === null) return;

  let numero = Number(valor || 0);

  if (Number.isNaN(numero)) {
    avisar("Descuento inválido", "error");
    return;
  }

  if (tipo === "porcentaje") {
    numero = limitarNumero(numero, 0, 100);
  } else {
    numero = limitarNumero(numero, 0, subtotalItem);
  }

  item.descuentoTipo = tipo;
  item.descuentoValor = numero;
  productoSeleccionadoId = id;

  renderCarrito();
}

function quitarDescuentoProducto(id) {
  const item = carrito.find(
    p => String(p.id) === String(id)
  );

  if (!item) return;

  item.descuentoTipo = "porcentaje";
  item.descuentoValor = 0;
  productoSeleccionadoId = id;

  renderCarrito();

  avisar("Descuento quitado", "info");
}

function actualizarDescuentoCarrito() {
  const tipoEl = document.getElementById("tipoDescuentoCarrito");
  const valorEl = document.getElementById("valorDescuentoCarrito");

  if (!tipoEl || !valorEl) return;

  descuentoCarrito.tipo = tipoEl.value;
  descuentoCarrito.valor = Number(valorEl.value || 0);

  renderCarrito();
}

function calcularDescuentoProducto(item) {
  const subtotalItem = item.precio * item.cantidad;
  let descuento = 0;

  if (item.descuentoTipo === "porcentaje") {
    const porcentaje = limitarNumero(item.descuentoValor, 0, 100);
    descuento = subtotalItem * (porcentaje / 100);
  } else {
    descuento = limitarNumero(item.descuentoValor, 0, subtotalItem);
  }

  return Math.round(descuento);
}

function calcularTotalesVenta(aplicarLimites = true) {
  let subtotal = 0;
  let descuentoProductos = 0;
  let costoTotal = 0;

  carrito.forEach(item => {
    const subtotalItem = item.precio * item.cantidad;
    const descuentoItem = calcularDescuentoProducto(item);

    subtotal += subtotalItem;
    descuentoProductos += descuentoItem;
    costoTotal += Number(item.costo || 0) * item.cantidad;
  });

  const subtotalConDescuentoProductos =
    subtotal - descuentoProductos;

  let descuentoGeneral = 0;

  if (descuentoCarrito.tipo === "porcentaje") {
    const porcentaje = aplicarLimites
      ? limitarNumero(descuentoCarrito.valor, 0, 100)
      : Number(descuentoCarrito.valor || 0);

    descuentoGeneral =
      subtotalConDescuentoProductos * (porcentaje / 100);
  } else {
    const monto = aplicarLimites
      ? limitarNumero(
          descuentoCarrito.valor,
          0,
          subtotalConDescuentoProductos
        )
      : Number(descuentoCarrito.valor || 0);

    descuentoGeneral = monto;
  }

  descuentoGeneral = Math.round(descuentoGeneral);

  const descuentoTotal =
    descuentoProductos + descuentoGeneral;

  const total =
    Math.max(
      0,
      subtotalConDescuentoProductos - descuentoGeneral
    );

  const ganancia =
    Math.max(0, total - costoTotal);

  return {
    subtotal,
    descuentoProductos,
    subtotalConDescuentoProductos,
    descuentoGeneral,
    descuentoTotal,
    total,
    costoTotal,
    ganancia
  };
}

// =================================
// RENDER CARRITO
// =================================

function renderCarrito() {
  const cont = document.getElementById("carritoLista");
  const totalEl = document.getElementById("total");

  if (!cont || !totalEl) return;

  cont.innerHTML = "";

  if (carrito.length === 0) {
    productoSeleccionadoId = null;

    cont.innerHTML = `
      <div class="aronium-empty">
        <h3>No hay artículos</h3>
        <p>Buscá productos arriba y agregalos a la orden</p>
      </div>
    `;

    resetResumenVenta();
    actualizarPanelProductoSeleccionado();
    guardarVentaPendiente();
    return;
  }

  carrito.forEach(item => {
    const subtotalItem = item.precio * item.cantidad;
    const descuentoItem = calcularDescuentoProducto(item);
    const totalItem = subtotalItem - descuentoItem;

    const row = document.createElement("div");

    row.className = `
      aronium-row
      ${String(productoSeleccionadoId) === String(item.id) ? "selected" : ""}
    `;

    row.onclick = () => seleccionarProductoCarrito(item.id);

    row.innerHTML = `
      <div class="aronium-product-name">
        <div>
          <strong>${item.nombre}</strong>
          <small>Stock: ${Number(item.stock || 0)}</small>
          ${
            descuentoItem > 0
              ? `<em>Descuento: -${money(descuentoItem)}</em>`
              : ""
          }
        </div>
      </div>

      <div class="aronium-qty">
        <button type="button" onclick="event.stopPropagation(); disminuirCantidad('${item.id}')">−</button>
        <strong>${item.cantidad}</strong>
        <button type="button" onclick="event.stopPropagation(); aumentarCantidad('${item.id}')">+</button>
      </div>

      <div class="aronium-price">
        ${money(item.precio)}
      </div>

      <div class="aronium-total">
        ${money(totalItem)}
      </div>
    `;

    cont.appendChild(row);
  });

  actualizarResumenVenta();
  actualizarPanelProductoSeleccionado();
  guardarVentaPendiente();
}

function seleccionarProductoCarrito(id) {
  productoSeleccionadoId = id;
  renderCarrito();
}

function getProductoSeleccionadoCarrito() {
  return carrito.find(
    item => String(item.id) === String(productoSeleccionadoId)
  );
}

function actualizarPanelProductoSeleccionado() {
  const nombreEl = document.getElementById("productoSeleccionadoNombre");
  const infoEl = document.getElementById("productoSeleccionadoInfo");

  const item = getProductoSeleccionadoCarrito();

  if (!nombreEl || !infoEl) return;

  if (!item) {
    nombreEl.innerText = "Ningún producto seleccionado";
    infoEl.innerText = "Tocá una fila de la venta para editarla";
    return;
  }

  nombreEl.innerText = item.nombre;
  infoEl.innerText = `${item.cantidad} unidad/es · ${money(item.precio)} c/u`;
}

function descuentoProductoSeleccionado(tipo) {
  const item = getProductoSeleccionadoCarrito();

  if (!item) {
    avisar("Seleccioná un producto del carrito", "error");
    return;
  }

  aplicarDescuentoProducto(item.id, tipo);
}

function quitarDescuentoSeleccionado() {
  const item = getProductoSeleccionadoCarrito();

  if (!item) {
    avisar("Seleccioná un producto del carrito", "error");
    return;
  }

  quitarDescuentoProducto(item.id);
}

function eliminarProductoSeleccionado() {
  const item = getProductoSeleccionadoCarrito();

  if (!item) {
    avisar("Seleccioná un producto del carrito", "error");
    return;
  }

  eliminarDelCarrito(item.id);
  productoSeleccionadoId = null;
  actualizarPanelProductoSeleccionado();
}

function limpiarCarrito() {
  if (carrito.length === 0) {
    avisar("El carrito ya está vacío", "info");
    return;
  }

  if (!confirm("¿Vaciar la venta actual?")) return;

  carrito = [];
  productoSeleccionadoId = null;

  descuentoCarrito = {
    tipo: "porcentaje",
    valor: 0
  };

  const tipoDesc = document.getElementById("tipoDescuentoCarrito");
  const valorDesc = document.getElementById("valorDescuentoCarrito");

  if (tipoDesc) tipoDesc.value = "porcentaje";
  if (valorDesc) valorDesc.value = "";

  renderCarrito();
  borrarVentaPendiente();

  avisar("Venta limpiada", "info");
}

// =================================
// RESUMEN
// =================================

function resetResumenVenta() {
  const subtotalEl = document.getElementById("subtotalVenta");
  const descProdEl = document.getElementById("descuentoProductos");
  const descCarritoEl = document.getElementById("descuentoCarrito");
  const totalEl = document.getElementById("total");

  if (subtotalEl) subtotalEl.innerText = "$0";
  if (descProdEl) descProdEl.innerText = "-$0";
  if (descCarritoEl) descCarritoEl.innerText = "-$0";
  if (totalEl) totalEl.innerText = "0";
}

function actualizarResumenVenta() {
  const totales = calcularTotalesVenta();

  const subtotalEl = document.getElementById("subtotalVenta");
  const descProdEl = document.getElementById("descuentoProductos");
  const descCarritoEl = document.getElementById("descuentoCarrito");
  const totalEl = document.getElementById("total");

  if (subtotalEl) subtotalEl.innerText = money(totales.subtotal);
  if (descProdEl) descProdEl.innerText = `-${money(totales.descuentoProductos)}`;
  if (descCarritoEl) descCarritoEl.innerText = `-${money(totales.descuentoGeneral)}`;

  if (totalEl) {
    totalEl.innerText =
      Number(totales.total || 0).toLocaleString("es-AR");
  }
}

// =================================
// SUPABASE
// =================================

async function guardarVentaSupabase(venta) {
  if (typeof supabaseClient === "undefined") {
    throw new Error("Supabase no está conectado");
  }

  const ventaData = {
    fecha: new Date().toISOString(),
    metodo: venta.metodo,
    subtotal: venta.subtotal,
    descuento_productos: venta.descuentoProductos,
    descuento_carrito: venta.descuentoCarrito,
    descuento_total: venta.descuento,
    total: venta.total,
    costo_total: venta.costoTotal,
    ganancia: venta.ganancia,
    usuario: venta.usuario
  };

  const { data: ventaInsert, error: ventaError } =
    await supabaseClient
      .from("ventas")
      .insert([ventaData])
      .select()
      .single();

  if (ventaError) {
    console.error("Error venta:", ventaError);
    throw ventaError;
  }

  const detalleData = venta.detalle.map(item => ({
    venta_id: ventaInsert.id,
    producto_id: item.id,
    nombre: item.nombre,
    precio: item.precio,
    costo: item.costo,
    cantidad: item.cantidad,
    descuento_tipo: item.descuentoTipo,
    descuento_valor: item.descuentoValor,
    descuento: item.descuento,
    subtotal: item.subtotal,
    total: item.total
  }));

  const { error: detalleError } =
    await supabaseClient
      .from("venta_detalle")
      .insert(detalleData);

  if (detalleError) {
    console.error("Error detalle:", detalleError);
    throw detalleError;
  }

  const { error: cajaError } =
    await supabaseClient
      .from("caja")
      .insert([{
        venta_id: ventaInsert.id,
        tipo: "ingreso",
        metodo: venta.metodo,
        motivo: `Venta (${venta.metodo})`,
        subtotal: venta.subtotal,
        descuento: venta.descuento,
        monto: venta.total,
        usuario: venta.usuario
      }]);

  if (cajaError) {
    console.error("Error caja:", cajaError);
    throw cajaError;
  }

  for (const item of venta.detalle) {
    const producto = productos.find(
      p => String(p.id) === String(item.id)
    );

    if (!producto) continue;

    const nuevoStock =
      Number(producto.stock || 0) - Number(item.cantidad || 0);

    const { error: stockError } =
      await supabaseClient
        .from("productos")
        .update({ stock: nuevoStock })
        .eq("id", item.id);

    if (stockError) {
      console.error("Error stock:", stockError);
      throw stockError;
    }
  }

  return ventaInsert;
}

// =================================
// FINALIZAR VENTA
// =================================

async function finalizarVenta(metodo) {
  if (procesandoVenta) return;

  procesandoVenta = true;

  try {
    if (carrito.length === 0) {
      avisar("El carrito está vacío", "error");
      return;
    }

    for (const item of carrito) {
      const producto = productos.find(
        p => String(p.id) === String(item.id)
      );

      if (!producto) {
        avisar(`${item.nombre} ya no existe`, "error");
        return;
      }

      if (item.cantidad > Number(producto.stock || 0)) {
        avisar(`Stock insuficiente de ${item.nombre}`, "error");
        return;
      }
    }

    const usuario = getUsuarioActual();
    const totales = calcularTotalesVenta();

    const detalle = carrito.map(item => {
      const subtotalItem = item.precio * item.cantidad;
      const descuentoItem = calcularDescuentoProducto(item);
      const totalItem = subtotalItem - descuentoItem;

      return {
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        costo: item.costo || 0,
        cantidad: item.cantidad,
        descuentoTipo: item.descuentoTipo,
        descuentoValor: item.descuentoValor,
        descuento: descuentoItem,
        subtotal: subtotalItem,
        total: totalItem
      };
    });

    const ventaLocalId = Date.now();

    const ultimoRecibo =
      Number(localStorage.getItem("ultimoReciboFausti") || 0) + 1;

    localStorage.setItem("ultimoReciboFausti", ultimoRecibo);

    const numeroRecibo =
      String(ultimoRecibo).padStart(6, "0");

    const nuevaVenta = {
      id: ventaLocalId,
      numeroRecibo,
      fecha: new Date().toLocaleString(),
      metodo,
      subtotal: totales.subtotal,
      descuentoProductos: totales.descuentoProductos,
      descuentoCarrito: totales.descuentoGeneral,
      descuento: totales.descuentoTotal,
      total: totales.total,
      costoTotal: totales.costoTotal,
      ganancia: totales.ganancia,
      usuario,
      detalle
    };

    const ventaSupabase =
      await guardarVentaSupabase(nuevaVenta);

    nuevaVenta.supabaseId = ventaSupabase.id;

    const ventas = getStorage("ventas");
    const caja = getStorage("caja");

    ventas.push(nuevaVenta);
    setStorage("ventas", ventas);

    caja.push({
      id: Date.now(),
      ventaId: nuevaVenta.id,
      supabaseVentaId: ventaSupabase.id,
      tipo: "ingreso",
      subtotal: nuevaVenta.subtotal,
      descuento: nuevaVenta.descuento,
      monto: nuevaVenta.total,
      metodo,
      motivo: `Venta (${metodo})`,
      fecha: nuevaVenta.fecha,
      usuario
    });

    setStorage("caja", caja);

    productos = productos.map(prod => {
      const vendido = carrito.find(
        p => String(p.id) === String(prod.id)
      );

      if (!vendido) return prod;

      return {
        ...prod,
        stock: Number(prod.stock || 0) - vendido.cantidad
      };
    });

    guardarProductosLocal();

    carrito = [];
    productoSeleccionadoId = null;

    descuentoCarrito = {
      tipo: "porcentaje",
      valor: 0
    };

    const tipoDesc = document.getElementById("tipoDescuentoCarrito");
    const valorDesc = document.getElementById("valorDescuentoCarrito");

    if (tipoDesc) tipoDesc.value = "porcentaje";
    if (valorDesc) valorDesc.value = "";

    renderProductos();
    renderCarrito();
    borrarVentaPendiente();

    avisar("✅ Venta registrada correctamente", "success");

    imprimirTicket(nuevaVenta);

  } catch (error) {
    console.error(error);
    avisar("Error al registrar la venta", "error");
  } finally {
    procesandoVenta = false;
  }
}

// =================================
// TICKET POS58
// =================================

function imprimirTicket(venta) {
  function metodoTicket(metodo) {
    const metodos = {
      efectivo: "EFECTIVO",
      transferencia: "TRANSFERENCIA",
      mp: "MERCADO PAGO",
      qr: "QR",
      qr_banco: "QR BANCO",
      promo_bn: "PROMO NACIÓN"
    };

    return metodos[metodo] || metodo || "-";
  }

  function fechaTicket(fecha) {
    const f = fecha ? new Date(fecha) : new Date();

    if (isNaN(f.getTime())) return fecha || "-";

    return f.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function cortarTexto(texto, max = 28) {
    const t = String(texto || "");
    return t.length > max ? t.slice(0, max) : t;
  }

  function lineaProducto(item) {
    const cantidad = Number(item.cantidad || 0);
    const nombre = cortarTexto(item.nombre || "Producto", 28);
    const precioUnitario = Number(item.precio || item.precioVenta || item.unitario || 0);
    const totalItem = Number(item.total || item.subtotal || precioUnitario * cantidad || 0);
    const descuentoItem = Number(item.descuento || 0);

    return `
${nombre}
${cantidad} x ${money(precioUnitario)} = ${money(totalItem)}
${descuentoItem > 0 ? `Desc. item: -${money(descuentoItem)}\n` : ""}`;
  }

  const productosTicket = venta.detalle || [];
  const detalle = productosTicket.map(item => lineaProducto(item)).join("");

  const cantidadArticulos = productosTicket.reduce((acc, item) => {
    return acc + Number(item.cantidad || 0);
  }, 0);

  const numeroRecibo =
    venta.numeroRecibo || String(venta.id || Date.now()).slice(-6);

  const metodo = metodoTicket(venta.metodo);

  const subtotal = Number(venta.subtotal || 0);
  const descProductos = Number(venta.descuentoProductos || 0);
  const descCarrito = Number(venta.descuentoCarrito || 0);
  const descuentoTotal = Number(venta.descuento || descProductos + descCarrito || 0);
  const total = Number(venta.total || 0);
  const recibido = Number(venta.recibido || venta.total || 0);
  const vuelto = Math.max(0, recibido - total);

  const contenido = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Ticket</title>

<style>
  @page {
    size: 58mm auto;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #000;
  }

  body {
    font-family: Consolas, "Courier New", monospace;
    width: 56mm;
    max-width: 56mm;
    padding: 2mm 1mm;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.15;
    overflow: hidden;
  }

  .center {
    text-align: center;
  }

  .logo {
    width: 140px;
    max-height: 75px;
    object-fit: contain;
    display: block;
    margin: 0 auto 4px auto;
    filter: grayscale(1) contrast(1.9);
  }

  .line {
    border-top: 1px dashed #000;
    margin: 6px 0;
  }

  pre {
    font-family: Consolas, "Courier New", monospace;
    white-space: pre-wrap;
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.18;
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    margin: 3px 0;
  }

  .row span,
  .row strong {
    white-space: nowrap;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 6px;
    font-size: 18px;
    font-weight: 900;
    line-height: 1.05;
    margin: 8px 0;
  }

  .total-row span {
    white-space: nowrap;
  }

  .footer {
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    margin-top: 7px;
  }

  @media print {
    html,
    body {
      width: 56mm;
      max-width: 56mm;
      padding: 2mm 1mm;
      overflow: hidden;
    }
  }
</style>
</head>

<body>

<div class="center">
  <img
    src="assets/icons/images/logo1.png"
    class="logo"
    onerror="this.style.display='none'"
  >
</div>

<div class="line"></div>

<pre>Madre Cabrini 78 - Local 2
Villa Mercedes, San Luis

N° Recibo: ${numeroRecibo}
${fechaTicket(venta.fecha)}
Usuario: Lo de Fausti</pre>

<div class="line"></div>

<pre>${detalle}</pre>

<div class="line"></div>

<pre>Cantidad de artículos: ${cantidadArticulos}</pre>

<div class="line"></div>

<div class="row">
  <span>Subtotal:</span>
  <strong>${money(subtotal || total + descuentoTotal)}</strong>
</div>

${
  descProductos > 0
    ? `
<div class="row">
  <span>Desc. productos:</span>
  <strong>-${money(descProductos)}</strong>
</div>
`
    : ""
}

${
  descCarrito > 0
    ? `
<div class="row">
  <span>Desc. carrito:</span>
  <strong>-${money(descCarrito)}</strong>
</div>
`
    : ""
}

${
  descuentoTotal > 0
    ? `
<div class="row">
  <span>Descuento total:</span>
  <strong>-${money(descuentoTotal)}</strong>
</div>
`
    : ""
}

<div class="line"></div>

<div class="total-row">
  <span>TOTAL:</span>
  <span>${money(total)}</span>
</div>

<div class="line"></div>

<div class="row">
  <span>${metodo}:</span>
  <strong>${money(total)}</strong>
</div>

<div class="row">
  <span>Recibido:</span>
  <strong>${money(recibido)}</strong>
</div>

${
  vuelto > 0
    ? `
<div class="row">
  <span>Vuelto:</span>
  <strong>${money(vuelto)}</strong>
</div>
`
    : ""
}

<div class="line"></div>

<div class="footer">¡Gracias por elegirnos!</div>
<div class="footer">@lodefausti.congelados</div>
<div class="footer">2657-718676</div>

<script>
  window.onload = function () {
    setTimeout(function () {
      window.print();

      setTimeout(function () {
        window.close();
      }, 600);
    }, 300);
  };
</script>

</body>
</html>
`;

  const ventana = window.open("", "_blank", "width=360,height=800");

  ventana.document.open();
  ventana.document.write(contenido);
  ventana.document.close();
}

// =================================
// ANULAR ÚLTIMA VENTA
// =================================

function ventaEstaAnuladaLocal(venta) {
  return (
    venta?.estado === "anulada" ||
    venta?.anulada === true
  );
}

async function anularUltimaVenta() {
  const ventasLocal = getStorage("ventas");

  if (!ventasLocal || ventasLocal.length === 0) {
    avisar("No hay ventas para anular", "error");
    return;
  }

  const ultimaVenta = [...ventasLocal]
    .reverse()
    .find(v => !ventaEstaAnuladaLocal(v));

  if (!ultimaVenta) {
    avisar("No hay ventas activas para anular", "info");
    return;
  }

  const confirmar = confirm(
    `¿Anular la última venta?\n\nVenta #${ultimaVenta.numeroRecibo || ultimaVenta.id}\nTotal: ${money(ultimaVenta.total)}\n\nSe devolverá el stock.`
  );

  if (!confirmar) return;

  const motivo =
    prompt("Motivo de anulación:", "Anulación desde Ventas") ||
    "Anulación desde Ventas";

  const usuario = getUsuarioActual();

  try {
    if (typeof supabaseClient !== "undefined") {
      for (const item of ultimaVenta.detalle || []) {
        const productoId =
          item.producto_id ||
          item.productoId ||
          item.id;

        let productoData = null;

        if (productoId) {
          const { data, error } =
            await supabaseClient
              .from("productos")
              .select("id, stock")
              .eq("id", productoId)
              .single();

          if (!error && data) productoData = data;
        }

        if (!productoData && item.nombre) {
          const { data, error } =
            await supabaseClient
              .from("productos")
              .select("id, stock")
              .eq("nombre", item.nombre)
              .single();

          if (!error && data) productoData = data;
        }

        if (!productoData) {
          console.warn("No se encontró producto:", item.nombre);
          continue;
        }

        const nuevoStock =
          Number(productoData.stock || 0) +
          Number(item.cantidad || 0);

        const { error: stockError } =
          await supabaseClient
            .from("productos")
            .update({ stock: nuevoStock })
            .eq("id", productoData.id);

        if (stockError) {
          console.error(stockError);
          avisar(`Error devolviendo stock de ${item.nombre}`, "error");
          return;
        }
      }

      if (ultimaVenta.supabaseId) {
        const { error: ventaError } =
          await supabaseClient
            .from("ventas")
            .update({
              estado: "anulada",
              anulada: true,
              anulada_por: usuario,
              anulada_fecha: new Date().toISOString(),
              motivo_anulacion: motivo
            })
            .eq("id", ultimaVenta.supabaseId);

        if (ventaError) {
          console.error(ventaError);
          avisar("Error anulando venta en Supabase", "error");
          return;
        }
      }
    }

    const ventasActualizadas = ventasLocal.map(v => {
      const mismaVenta =
        String(v.id) === String(ultimaVenta.id) ||
        String(v.supabaseId) === String(ultimaVenta.supabaseId);

      if (!mismaVenta) return v;

      return {
        ...v,
        estado: "anulada",
        anulada: true,
        anuladaPor: usuario,
        anuladaFecha: new Date().toLocaleString("es-AR"),
        motivoAnulacion: motivo
      };
    });

    setStorage("ventas", ventasActualizadas);

    const historial = getStorage("historial");

    historial.push({
      id: Date.now(),
      tipo: "anulacion",
      modulo: "Ventas",
      descripcion: `Venta #${ultimaVenta.numeroRecibo || ultimaVenta.id} anulada desde Ventas por ${usuario}. Motivo: ${motivo}`,
      monto: ultimaVenta.total,
      fecha: new Date().toLocaleString("es-AR"),
      usuario
    });

    setStorage("historial", historial);

    await cargarProductosIniciales();

    avisar("Última venta anulada y stock devuelto", "success");

  } catch (error) {
    console.error(error);
    avisar("Error inesperado al anular la última venta", "error");
  }
}

// =================================
// INIT
// =================================

document.addEventListener("DOMContentLoaded", async () => {
  await cargarProductosIniciales();
  cargarVentaPendiente();
  renderCarrito();
});