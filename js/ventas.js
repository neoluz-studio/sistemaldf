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

function getUsuarioActual() {
  return (
    JSON.parse(localStorage.getItem("usuario"))?.nombre ||
    "Local"
  );
}

function guardarProductos() {
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

      <small>
        Stock: ${stock}
      </small>

      ${
        stock <= 0
          ? `<small class="stock-empty">SIN STOCK</small>`
          : ""
      }
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
  const input = document.getElementById("buscador");
  if (!input) return;

  const texto = input.value.toLowerCase().trim();

  const filtrados = productos.filter(p =>
    String(p.nombre || "")
      .toLowerCase()
      .includes(texto)
  );

  renderProductos(filtrados);
}

// =================================
// CARRITO
// =================================

function agregarAlCarrito(prod) {
  if (!prod) return;

  const stock = Number(prod.stock || 0);

  if (stock <= 0) {
    showToast(`${prod.nombre} sin stock`, "error");
    return;
  }

  const existe = carrito.find(p => p.id === prod.id);

  if (existe) {
    if (existe.cantidad >= stock) {
      showToast(`Stock máximo de ${prod.nombre}`, "error");
      return;
    }

    existe.cantidad++;
  } else {
    carrito.push({
      id: prod.id,
      nombre: prod.nombre,
      precio: Number(prod.precio || 0),
      costo: Number(prod.costo || 0),
      stock: stock,
      cantidad: 1,
      descuentoTipo: "porcentaje",
      descuentoValor: 0
    });
  }

  renderCarrito();
}

function aumentarCantidad(id) {
  const item = carrito.find(p => p.id === id);
  const producto = productos.find(p => p.id === id);

  if (!item || !producto) return;

  const stock = Number(producto.stock || 0);

  if (item.cantidad >= stock) {
    showToast("No hay más stock disponible", "error");
    return;
  }

  item.cantidad++;
  renderCarrito();
}

function disminuirCantidad(id) {
  const item = carrito.find(p => p.id === id);
  if (!item) return;

  item.cantidad--;

  if (item.cantidad <= 0) {
    carrito = carrito.filter(p => p.id !== id);
  }

  renderCarrito();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(p => p.id !== id);
  renderCarrito();

  showToast("Producto eliminado", "info");
}

// =================================
// DESCUENTOS
// =================================

function aplicarDescuentoProducto(id, tipo) {
  const item = carrito.find(p => p.id === id);
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
    showToast("Descuento inválido", "error");
    return;
  }

  if (tipo === "porcentaje") {
    numero = limitarNumero(numero, 0, 100);
  } else {
    numero = limitarNumero(numero, 0, subtotalItem);
  }

  item.descuentoTipo = tipo;
  item.descuentoValor = numero;

  renderCarrito();
}

function quitarDescuentoProducto(id) {
  const item = carrito.find(p => p.id === id);
  if (!item) return;

  item.descuentoTipo = "porcentaje";
  item.descuentoValor = 0;

  renderCarrito();

  showToast("Descuento quitado", "info");
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
    cont.innerHTML = `
      <div class="empty-state">
        No hay productos en el carrito
      </div>
    `;

    resetResumenVenta();
    return;
  }

  carrito.forEach(item => {
    const subtotalItem = item.precio * item.cantidad;
    const descuentoItem = calcularDescuentoProducto(item);
    const totalItem = subtotalItem - descuentoItem;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <div class="cart-info">

        <h4>${item.nombre}</h4>

        <small>
          ${money(item.precio)} c/u
        </small>

        ${
          descuentoItem > 0
            ? `
              <div class="item-discount-badge">
                Descuento: -${money(descuentoItem)}
              </div>
            `
            : ""
        }

        <div class="item-discount">

          <button
            type="button"
            onclick="aplicarDescuentoProducto(${item.id}, 'porcentaje')"
          >
            % OFF
          </button>

          <button
            type="button"
            onclick="aplicarDescuentoProducto(${item.id}, 'monto')"
          >
            $ OFF
          </button>

          ${
            descuentoItem > 0
              ? `
                <button
                  type="button"
                  onclick="quitarDescuentoProducto(${item.id})"
                >
                  Quitar
                </button>
              `
              : ""
          }

        </div>

      </div>

      <div class="cart-actions">

        <button
  type="button"
  class="qty-btn"
  onclick="disminuirCantidad(${item.id})"
>
  −
</button>

        <span class="qty">${item.cantidad}</span>

        <button
  type="button"
  class="qty-btn"
  onclick="aumentarCantidad(${item.id})"
>
  +
</button>

      </div>

      <div class="cart-subtotal">

        ${
          descuentoItem > 0
            ? `
              <div class="old-price">
                ${money(subtotalItem)}
              </div>
            `
            : ""
        }

        ${money(totalItem)}

      </div>

      <button
        type="button"
        class="remove-btn"
        onclick="eliminarDelCarrito(${item.id})"
      >
        ✕
      </button>
    `;

    cont.appendChild(div);
  });

  actualizarResumenVenta();
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

  if (subtotalEl) {
    subtotalEl.innerText = money(totales.subtotal);
  }

  if (descProdEl) {
    descProdEl.innerText = `-${money(totales.descuentoProductos)}`;
  }

  if (descCarritoEl) {
    descCarritoEl.innerText = `-${money(totales.descuentoGeneral)}`;
  }

  if (totalEl) {
    totalEl.innerText =
      Number(totales.total || 0).toLocaleString("es-AR");
  }
}

// =================================
// FINALIZAR VENTA
// =================================

function finalizarVenta(metodo) {
  if (procesandoVenta) return;

  procesandoVenta = true;

  try {
    if (carrito.length === 0) {
      showToast("El carrito está vacío", "error");
      return;
    }

    for (const item of carrito) {
      const producto = productos.find(p => p.id === item.id);

      if (!producto) {
        showToast(`${item.nombre} ya no existe`, "error");
        return;
      }

      if (item.cantidad > Number(producto.stock || 0)) {
        showToast(`Stock insuficiente de ${item.nombre}`, "error");
        return;
      }
    }

    const ventas = getStorage("ventas");
    const caja = getStorage("caja");
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

    const nuevaVenta = {
      id: Date.now(),
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

    ventas.push(nuevaVenta);
    setStorage("ventas", ventas);

    caja.push({
      id: Date.now(),
      ventaId: nuevaVenta.id,
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

    if (typeof agregarHistorial === "function") {
      agregarHistorial({
        tipo: "venta",
        modulo: "Ventas",
        descripcion:
          `Venta registrada: ${money(nuevaVenta.total)} ` +
          `(desc: ${money(nuevaVenta.descuento)})`,
        monto: nuevaVenta.total
      });
    }

    productos = productos.map(prod => {
      const vendido = carrito.find(p => p.id === prod.id);

      if (!vendido) return prod;

      return {
        ...prod,
        stock: Number(prod.stock || 0) - vendido.cantidad
      };
    });

    guardarProductos();

    carrito = [];
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

    showToast("✅ Venta registrada correctamente", "success");

    imprimirTicket(nuevaVenta);

  } catch (error) {
    console.error(error);
    showToast("Error al registrar la venta", "error");
  } finally {
    procesandoVenta = false;
  }
}

// =================================
// TICKET
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

  function lineaProducto(item) {
    const cantidad = item.cantidad || 0;
    const nombre = String(item.nombre || "Producto").slice(0, 18);
    const total = Number(item.total || item.subtotal || 0);

    return `${cantidad}x ${nombre.padEnd(18, " ")} ${money(total)}`;
  }

  const detalle = (venta.detalle || [])
    .map(item => lineaProducto(item))
    .join("\n");

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

    body {
      font-family: "Courier New", monospace;
      width: 58mm;
      margin: 0;
      padding: 6px;
      background: #fff;
      color: #000;
      font-size: 10.5px;
      line-height: 1.25;
    }

    .center {
      text-align: center;
    }

    .logo {
      width: 120px;
      max-height: 70px;
      object-fit: contain;
      display: block;
      margin: 0 auto 4px auto;
      filter: grayscale(1) contrast(1.4);
    }

    .brand {
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 1px;
    }

    .small {
      font-size: 10px;
    }

    .line {
      border-top: 1px dashed #000;
      margin: 7px 0;
    }

    pre {
      font-family: "Courier New", monospace;
      white-space: pre-wrap;
      margin: 0;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .total {
      font-size: 17px;
      font-weight: bold;
      text-align: center;
      margin: 8px 0;
    }

    img {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
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

    

  <div class="line"></div>

  <pre>Fecha: ${venta.fecha || "-"}
Usuario: Lodefausti
Venta Nº: ${venta.id || "-"}
Metodo: ${metodoTicket(venta.metodo)}</pre>

  <div class="line"></div>

  <pre>${detalle}</pre>

  <div class="line"></div>

  <div class="row">
    <span>Subtotal:</span>
    <strong>${money(venta.subtotal || venta.total || 0)}</strong>
  </div>

  <div class="row">
    <span>Descuento:</span>
    <strong>-${money(venta.descuento || 0)}</strong>
  </div>

  <div class="line"></div>

  <div class="total">
    TOTAL<br>
    ${money(venta.total || 0)}
  </div>

  <div class="line"></div>

  <div class="center">
    Gracias por su compra<br>
    @lodefausti.congelados
  </div>

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

  const ventana = window.open("", "_blank", "width=300,height=600");

  if (!ventana) {
    showToast("El navegador bloqueó el ticket", "error");
    return;
  }

  ventana.document.open();
  ventana.document.write(contenido);
  ventana.document.close();
}
// =================================
// INIT
// =================================

document.addEventListener("DOMContentLoaded", () => {
  renderProductos();
  renderCarrito();
});