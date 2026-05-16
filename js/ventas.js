let productos =
  JSON.parse(
    localStorage.getItem(
      "productos"
    )
  ) || [];
  let carrito = [];

// PRODUCTOS
// PRODUCTOS
function renderProductos(lista = productos) {

  const cont =
    document.getElementById(
      "productosGrid"
    );

  cont.innerHTML = "";

  lista.forEach(p => {

    const div =
      document.createElement("div");

    div.className = `

      producto-btn

      ${p.stock <= 0
        ? "sin-stock"
        : ""}

    `;

    div.innerHTML = `

      ${p.nombre}

      <br>

      $${p.precio}

    `;

    // SIN STOCK
    if (p.stock <= 0) {

      div.innerHTML += `

        <small class="stock-empty">

          SIN STOCK

        </small>
      `;
    }

    div.onclick = () => {

      agregarAlCarrito(p);

      document.activeElement.blur();
    };

    cont.appendChild(div);
  });
}
// CARRITO

 function agregarAlCarrito(prod) {

  // VALIDAR
  if (!prod) return;

  // SIN STOCK
  if (prod.stock <= 0) {

    showToast(

      `${prod.nombre} sin stock`,

      "error"
    );

    return;
  }

  const existe =
    carrito.find(
      p => p.id === prod.id
    );

  // YA EXISTE
  if (existe) {

    // CONTROL STOCK
    if (

      existe.cantidad >=
      prod.stock

    ) {

      showToast(

        `Stock máximo de ${prod.nombre}`,

        "error"
      );

      return;
    }

    existe.cantidad++;

  }

  else {

    carrito.push({

      ...prod,

      cantidad: 1
    });
  }

  renderCarrito();
}

function renderCarrito() {

  const cont =
    document.getElementById("carritoLista");

  const totalEl =
    document.getElementById("total");

  // LIMPIAR COMPLETO
cont.replaceChildren();

  let total = 0;

  // VACIO
  if (carrito.length === 0) {

    cont.innerHTML = `
      <div class="empty-state">
        No hay productos en el carrito
      </div>
    `;

    totalEl.innerText = "0";

    return;
  }

  carrito.forEach(p => {

    const subtotal =
      p.precio * p.cantidad;

    total += subtotal;

    const div =
      document.createElement("div");

    div.className = "cart-item";

    div.innerHTML = `

      <div class="cart-info">

        <h4>${p.nombre}</h4>

        <small>
          $${p.precio} c/u
        </small>

      </div>

      <div class="cart-actions">

        <button
          class="qty-btn"
          onclick="disminuirCantidad(${p.id})"
        >
          -
        </button>

        <span class="qty">
          ${p.cantidad}
        </span>

        <button
          class="qty-btn"
          onclick="aumentarCantidad(${p.id})"
        >
          +
        </button>

      </div>

      <div class="cart-subtotal">

        $${subtotal.toLocaleString()}

      </div>

      <button
        class="remove-btn"
        onclick="eliminarDelCarrito(${p.id})"
      >
        ✕
      </button>
    `;
      div.dataset.id = p.id;
    cont.appendChild(div);
  });

  totalEl.innerText =
    total.toLocaleString();
}

// BUSCAR
function filtrarProductos() {
  const texto = document.getElementById("buscador").value.toLowerCase();
  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(texto)
  );

  renderProductos(filtrados);
}

// FINALIZAR
function finalizarVenta(metodo) {

  // EVITAR DOBLE CLICK
  if (window.procesandoVenta) return;

  window.procesandoVenta = true;

  try {

    // =========================
    // CARRITO VACIO
    // =========================

    if (carrito.length === 0) {

      showToast(
        "El carrito está vacío",
        "error"
      );

      return;
    }

    let ventas =
      JSON.parse(
        localStorage.getItem("ventas")
      ) || [];

    let caja =
      JSON.parse(
        localStorage.getItem("caja")
      ) || [];

    // =========================
    // VALIDAR STOCK
    // =========================

    for (const item of carrito) {

      const producto =
        productos.find(
          p => p.id === item.id
        );

      if (!producto) {

        showToast(
          `${item.nombre} ya no existe`,
          "error"
        );

        return;
      }

      if (
        item.cantidad >
        producto.stock
      ) {

        showToast(
          `Stock insuficiente de ${producto.nombre}`,
          "error"
        );

        return;
      }
    }

    // =========================
    // TOTAL
    // =========================

    const total =
      carrito.reduce(

        (acc, p) =>

          acc +
          (p.precio * p.cantidad),

        0
      );

    // =========================
    // GANANCIA
    // =========================

    const ganancia =
      carrito.reduce(

        (acc, p) => {

          return acc +

            (
              (p.precio - (p.costo || 0))
              * p.cantidad
            );
        },

        0
      );

    // =========================
    // COPIA DEL CARRITO
    // =========================

    const ticketDetalle =
      [...carrito];

    // =========================
    // NUEVA VENTA
    // =========================

    const nuevaVenta = {

      id: Date.now(),

      fecha:
        new Date()
          .toLocaleString(),

      metodo,

      total,

      ganancia,

      usuario:

        JSON.parse(
          localStorage.getItem(
            "usuario"
          )
        )?.nombre || "Local",

      detalle:

        carrito.map(p => ({

          id: p.id,

          nombre: p.nombre,

          precio: p.precio,

          costo: p.costo || 0,

          cantidad: p.cantidad,

          subtotal:
            p.precio * p.cantidad
        }))
    };

    // =========================
    // GUARDAR VENTA
    // =========================

    ventas.push(nuevaVenta);

    localStorage.setItem(
      "ventas",
      JSON.stringify(ventas)
    );

    // =========================
    // REGISTRAR CAJA
    // =========================

    caja.push({

  id: Date.now(),

  ventaId: nuevaVenta.id,

  tipo: "ingreso",

  monto: total,

  motivo: `Venta (${metodo})`,

  fecha:
    new Date()
      .toLocaleString(),

  usuario:
    nuevaVenta.usuario
});

    localStorage.setItem(
      "caja",
      JSON.stringify(caja)
    );

    // =========================
    // HISTORIAL
    // =========================

    if (
      typeof agregarHistorial ===
      "function"
    ) {

      agregarHistorial({

        tipo: "venta",

        modulo: "Ventas",

        descripcion:
          `Venta realizada por $${total}`,

        monto: total
      });
    }

    // =========================
    // DESCONTAR STOCK
    // =========================

    productos = productos.map(prod => {

      const vendido =
        carrito.find(
          p => p.id === prod.id
        );

      if (vendido) {

        return {

          ...prod,

          stock:
            prod.stock -
            vendido.cantidad
        };
      }

      return prod;
    });

    localStorage.setItem(
      "productos",
      JSON.stringify(productos)
    );

    // =========================
    // LIMPIAR CARRITO
    // =========================

    carrito = [];

    // =========================
    // REFRESCAR UI
    // =========================

    renderCarrito();

    renderProductos();

    // =========================
    // TOAST
    // =========================

    showToast(
      "✅ Venta registrada correctamente",
      "success"
    );
    imprimirTicket(nuevaVenta);

    // =========================
    // MOSTRAR TICKET
    // =========================

    if (
      typeof mostrarTicket ===
      "function"
    ) {

      mostrarTicket({

        fecha:
          new Date()
            .toLocaleString(),

        metodo,

        total,

        detalle:
          ticketDetalle
      });
    }

  }

  catch (error) {

    console.error(error);

    
  }

  finally {

    window.procesandoVenta = false;
  }
}


// INIT
renderProductos();

// =========================
// AUMENTAR
// =========================

function aumentarCantidad(id) {

  const item =
    carrito.find(p => p.id === id);

  const producto =
  productos.find(
    p => p.id === item.id
  );

// NO EXISTE
if (!producto) {

  showToast(

    `El producto "${item.nombre}" ya no existe`,

    "error"
  );

  return;
}

  if (!item || !producto) return;

  // CONTROL STOCK
if (

  item.cantidad >=
  producto.stock

) {

  showToast(

    `No hay más stock de ${producto.nombre}`,

    "error"
  );

  return;
}

  item.cantidad++;

  renderCarrito();
}

// =========================
// DISMINUIR
// =========================

function disminuirCantidad(id) {

  const item =
    carrito.find(p => p.id === id);

  if (!item) return;

  item.cantidad--;

  // ELIMINAR SI ES 0
  if (item.cantidad <= 0) {

    carrito =
      carrito.filter(p => p.id !== id);
  }

  renderCarrito();
}

// =========================
// ELIMINAR ITEM
// =========================

function eliminarDelCarrito(id) {

  carrito =
    carrito.filter(p => p.id !== id);

  renderCarrito();

  showToast(
    "Producto eliminado",
    "info"
  );
}
function imprimirTicket(venta) {

  let contenido = `
  
  <html>
  <head>
    <title>Ticket</title>

    <style>

      body {
        font-family: monospace;
        padding: 20px;
        width: 300px;
      }

      h2 {
        text-align: center;
      }

      .linea {
        border-top: 1px dashed #000;
        margin: 10px 0;
      }

      .item {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
      }

      .total {
        font-size: 20px;
        font-weight: bold;
      }

    </style>
  </head>

  <body>

    <h2> LO DE FAUSTI</h2>

    <p>
      Fecha:
      ${venta.fecha}
    </p>

    <p>
      Ticket:
      #${venta.id}
    </p>

    <div class="linea"></div>

    ${venta.detalle.map(item => `

      <div class="item">
        <span>
          ${item.cantidad}x ${item.nombre}
        </span>

        <span>
          $${item.precio * item.cantidad}
        </span>
      </div>

    `).join("")}

    <div class="linea"></div>

    <p class="total">
      TOTAL:
      $${venta.total}
    </p>

    <p>
      Método:
      ${venta.metodo}
    </p>

    <p>
      Usuario:
      ${venta.usuario}
    </p>

    <br>

    <center>
      ¡Gracias por su compra!
    </center>

    <script>
      window.print();
      window.close();
    </script>

  </body>
  </html>
  `;

  const ventana =
    window.open(
      "",
      "_blank",
      "width=400,height=600"
    );

  ventana.document.write(contenido);

  ventana.document.close();
}