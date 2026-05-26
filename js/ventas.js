let productos =
  JSON.parse(
    localStorage.getItem(
      "productos"
    )
  ) || [];

let carrito = [];

let descuentoCarrito = {

  tipo: "porcentaje",

  valor: 0
};

// =================================
// PRODUCTOS
// =================================

function renderProductos(
  lista = productos
) {

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

      <strong>
        ${p.nombre}
      </strong>

      <small>
        $${Number(
          p.precio
        ).toLocaleString()}
      </small>

      ${p.stock <= 0
        ? `
          <small class="stock-empty">
            SIN STOCK
          </small>
        `
        : ""}
    `;

    div.onclick = () => {

      agregarAlCarrito(p);

      document.activeElement.blur();
    };

    cont.appendChild(div);
  });
}

// =================================
// AGREGAR
// =================================

function agregarAlCarrito(prod) {

  if (!prod) return;

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

  if (existe) {

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

  } else {

    carrito.push({

      ...prod,

      cantidad: 1,

      descuentoTipo: "porcentaje",

      descuentoValor: 0
    });
  }

  renderCarrito();
}

// =================================
// CALCULAR DESCUENTO ITEM
// =================================

function calcularDescuentoItem(
  item
) {

  const subtotal =

    item.precio *
    item.cantidad;

  let descuento = 0;

  if (

    item.descuentoTipo
    ===
    "porcentaje"

  ) {

    descuento =

      subtotal *

      (
        Number(
          item.descuentoValor || 0
        )

        / 100
      );

  } else {

    descuento =

      Number(
        item.descuentoValor || 0
      );
  }

  return descuento;
}

// =================================
// RENDER CARRITO
// =================================

function renderCarrito() {

  const cont =
    document.getElementById(
      "carritoLista"
    );

  const totalEl =
    document.getElementById(
      "total"
    );

  cont.replaceChildren();

  // VACIO
  if (carrito.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">
        No hay productos en el carrito
      </div>
    `;

    totalEl.innerText = "0";

    actualizarResumenDescuento(
      0,
      0,
      0
    );

    return;
  }

  let subtotalGeneral = 0;

  let descuentoProductos = 0;

  carrito.forEach(p => {

    const subtotal =
      p.precio * p.cantidad;

    const descuento =
      calcularDescuentoItem(p);

    const subtotalFinal =
      subtotal - descuento;

    subtotalGeneral +=
      subtotal;

    descuentoProductos +=
      descuento;

    const div =
      document.createElement("div");

    div.className =
      "cart-item";

    div.innerHTML = `

      <div class="cart-info">

        <h4>
          ${p.nombre}
        </h4>

        <small>
          $${p.precio} c/u
        </small>

        ${descuento > 0
          ? `
            <div class="item-discount-badge">
              🔥 Descuento aplicado
            </div>
          `
          : ""}

        <div class="item-discount">

          <button
            onclick="aplicarDescuentoProducto(${p.id}, 'porcentaje')"
          >
            % OFF
          </button>

          <button
            onclick="aplicarDescuentoProducto(${p.id}, 'monto')"
          >
            $ OFF
          </button>

        </div>

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

        ${descuento > 0
          ? `
            <div class="old-price">
              $${subtotal.toLocaleString()}
            </div>
          `
          : ""}

        $${subtotalFinal.toLocaleString()}

      </div>

      <button
        class="remove-btn"
        onclick="eliminarDelCarrito(${p.id})"
      >
        ✕
      </button>
    `;

    cont.appendChild(div);
  });

  // =================================
  // DESCUENTO GENERAL
  // =================================

  let descuentoGeneral = 0;

  const subtotalConDescuentoProductos =

    subtotalGeneral -
    descuentoProductos;

  if (

    descuentoCarrito.tipo
    ===
    "porcentaje"

  ) {

    descuentoGeneral =

      subtotalConDescuentoProductos *

      (
        Number(
          descuentoCarrito.valor || 0
        ) / 100
      );

  } else {

    descuentoGeneral =

      Number(
        descuentoCarrito.valor || 0
      );
  }

  const totalFinal =

    subtotalConDescuentoProductos -
    descuentoGeneral;

  totalEl.innerText =
    Math.max(
      0,
      totalFinal
    ).toLocaleString();

  actualizarResumenDescuento(

    subtotalGeneral,

    descuentoProductos
    +
    descuentoGeneral,

    totalFinal
  );
}

// =================================
// RESUMEN
// =================================

function actualizarResumenDescuento(

  subtotal,
  descuento,
  total

) {

  const box =
    document.getElementById(
      "discountSummary"
    );

  if (!box) return;

  box.innerHTML = `

    <div class="discount-summary">

      <div class="discount-line">

        <span>
          Subtotal
        </span>

        <strong>
          $${subtotal.toLocaleString()}
        </strong>

      </div>

      <div class="discount-line">

        <span>
          Descuento
        </span>

        <strong>
          -$${Math.round(
            descuento
          ).toLocaleString()}
        </strong>

      </div>

      <div class="discount-total">

        <span>
          TOTAL
        </span>

        <span class="final-total">
          $${Math.max(
            0,
            total
          ).toLocaleString()}
        </span>

      </div>

    </div>
  `;
}

// =================================
// DESCUENTO ITEM
// =================================

function aplicarDescuentoProducto(

  id,
  tipo

) {

  const item =
    carrito.find(
      p => p.id === id
    );

  if (!item) return;

  const valor =
    prompt(

      tipo === "porcentaje"
      ?
      "¿Qué porcentaje descontar?"
      :
      "¿Qué monto descontar?"
    );

  if (
    valor === null
  ) return;

  item.descuentoTipo =
    tipo;

  item.descuentoValor =
    Number(valor || 0);

  renderCarrito();
}

// =================================
// DESCUENTO GENERAL
// =================================

function actualizarDescuentoCarrito() {

  descuentoCarrito.tipo =

    document.getElementById(
      "tipoDescuentoCarrito"
    ).value;

  descuentoCarrito.valor =

    Number(

      document.getElementById(
        "valorDescuentoCarrito"
      ).value || 0
    );

  renderCarrito();
}

// =================================
// FILTRAR
// =================================

function filtrarProductos() {

  const texto =

    document
      .getElementById(
        "buscador"
      )

      .value

      .toLowerCase();

  const filtrados =

    productos.filter(p =>

      p.nombre
        .toLowerCase()
        .includes(texto)
    );

  renderProductos(
    filtrados
  );
}

// =================================
// FINALIZAR
// =================================

function finalizarVenta(
  metodo
) {

  if (
    window.procesandoVenta
  ) return;

  window.procesandoVenta =
    true;

  try {

    if (
      carrito.length === 0
    ) {

      showToast(
        "Carrito vacío",
        "error"
      );

      return;
    }

    let ventas =
      JSON.parse(
        localStorage.getItem(
          "ventas"
        )
      ) || [];

    let caja =
      JSON.parse(
        localStorage.getItem(
          "caja"
        )
      ) || [];

    // =================================
    // CALCULOS
    // =================================

    let subtotal = 0;

    let descuentoProductos = 0;

    carrito.forEach(p => {

      subtotal +=
        p.precio *
        p.cantidad;

      descuentoProductos +=
        calcularDescuentoItem(p);
    });

    const subtotalConDescuento =

      subtotal -
      descuentoProductos;

    let descuentoGeneral = 0;

    if (

      descuentoCarrito.tipo
      ===
      "porcentaje"

    ) {

      descuentoGeneral =

        subtotalConDescuento *

        (
          Number(
            descuentoCarrito.valor || 0
          ) / 100
        );

    } else {

      descuentoGeneral =

        Number(
          descuentoCarrito.valor || 0
        );
    }

    const total = Math.max(

      0,

      subtotalConDescuento
      -
      descuentoGeneral
    );

    // =================================
    // GANANCIA
    // =================================

    const ganancia =

      carrito.reduce(

        (acc, p) => {

          return acc +

            (
              (
                p.precio -
                (p.costo || 0)
              )

              *

              p.cantidad
            );

        },

        0
      );

    // =================================
    // NUEVA VENTA
    // =================================

    const nuevaVenta = {

      id: Date.now(),

      fecha:
        new Date()
          .toLocaleString(),

      metodo,

      subtotal,

      descuento:

        descuentoProductos
        +
        descuentoGeneral,

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

          cantidad: p.cantidad,

          descuentoTipo:
            p.descuentoTipo,

          descuentoValor:
            p.descuentoValor,

          subtotal:
            p.precio * p.cantidad
        }))
    };

    ventas.push(
      nuevaVenta
    );

    localStorage.setItem(

      "ventas",

      JSON.stringify(
        ventas
      )
    );

    // =================================
    // CAJA
    // =================================

    caja.push({

      id: Date.now(),

      ventaId:
        nuevaVenta.id,

      tipo: "ingreso",

      subtotal,

      descuento:

        nuevaVenta.descuento,

      monto: total,

      motivo:

        `Venta (${metodo})`,

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

    // =================================
    // DESCONTAR STOCK
    // =================================

    productos = productos.map(prod => {

      const vendido =
        carrito.find(
          p => p.id === prod.id
        );

      if (vendido) {

        return {

          ...prod,

          stock:

            prod.stock
            -
            vendido.cantidad
        };
      }

      return prod;
    });

    localStorage.setItem(

      "productos",

      JSON.stringify(productos)
    );

    // =================================
    // LIMPIAR
    // =================================

    carrito = [];

    descuentoCarrito = {

      tipo: "porcentaje",

      valor: 0
    };

    // =================================
    // UI
    // =================================

    renderCarrito();

    renderProductos();

    showToast(

      "✅ Venta registrada",

      "success"
    );

    imprimirTicket(
      nuevaVenta
    );

  }

  catch(error) {

    console.error(error);

  }

  finally {

    window.procesandoVenta =
      false;
  }
}

// =================================
// CANTIDADES
// =================================

function aumentarCantidad(id) {

  const item =
    carrito.find(
      p => p.id === id
    );

  const producto =
    productos.find(
      p => p.id === id
    );

  if (
    !item
    ||
    !producto
  ) return;

  if (

    item.cantidad >=
    producto.stock

  ) {

    showToast(
      `No hay más stock`,
      "error"
    );

    return;
  }

  item.cantidad++;

  renderCarrito();
}

function disminuirCantidad(id) {

  const item =
    carrito.find(
      p => p.id === id
    );

  if (!item) return;

  item.cantidad--;

  if (
    item.cantidad <= 0
  ) {

    carrito =
      carrito.filter(
        p => p.id !== id
      );
  }

  renderCarrito();
}

function eliminarDelCarrito(id) {

  carrito =
    carrito.filter(
      p => p.id !== id
    );

  renderCarrito();

  showToast(
    "Producto eliminado",
    "info"
  );
}

// =================================
// TICKET
// =================================

function imprimirTicket(
  venta
) {

  const contenido = `

  <html>

  <head>

    <title>
      Ticket
    </title>

    <style>

      body {

        font-family:
          monospace;

        padding: 20px;

        width: 300px;
      }

      h2 {

        text-align:
          center;
      }

      .linea {

        border-top:
          1px dashed #000;

        margin: 10px 0;
      }

      .item {

        display: flex;

        justify-content:
          space-between;

        margin: 5px 0;
      }

      .total {

        font-size: 22px;

        font-weight: bold;
      }

    </style>

  </head>

  <body>

    <h2>
      LO DE FAUSTI
    </h2>

    <p>
      Fecha:
      ${venta.fecha}
    </p>

    <div class="linea"></div>

    ${venta.detalle.map(item => `

      <div class="item">

        <span>

          ${item.cantidad}x ${item.nombre}

        </span>

        <span>

          $${(

            item.precio *
            item.cantidad

          ).toLocaleString()}

        </span>

      </div>

    `).join("")}

    <div class="linea"></div>

    <p>
      Subtotal:
      $${venta.subtotal.toLocaleString()}
    </p>

    <p>
      Descuento:
      -$${Math.round(
        venta.descuento
      ).toLocaleString()}
    </p>

    <p class="total">
      TOTAL:
      $${venta.total.toLocaleString()}
    </p>

    <p>
      Método:
      ${venta.metodo}
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

  ventana.document.write(
    contenido
  );

  ventana.document.close();
}

// =================================
// INIT
// =================================

renderProductos();

renderCarrito();