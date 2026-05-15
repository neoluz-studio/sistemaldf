let productos = JSON.parse(localStorage.getItem("productos"));

if (!productos || productos.length === 0) {
  productos = [
    { id: 1, nombre: "Empanadas", precio: 1000, stock: 10 },
    { id: 2, nombre: "Milanesas", precio: 2500, stock: 5 },
    { id: 3, nombre: "Papas fritas", precio: 1500, stock: 8 }
  ];

  localStorage.setItem("productos", JSON.stringify(productos));
}

let carrito = [];

// PRODUCTOS
function renderProductos(lista = productos) {
  const cont = document.getElementById("productosGrid");
  cont.innerHTML = "";

  lista.forEach(p => {
    const div = document.createElement("div");
    div.className = "producto-btn";
    div.innerHTML = `${p.nombre}<br>$${p.precio}`;

 div.onclick = () => {

  agregarAlCarrito(p);

  document.activeElement.blur();
};
    cont.appendChild(div);
  });

}
// CARRITO
function agregarAlCarrito(prod) {
  const existe = carrito.find(p => p.id === prod.id);

  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ ...prod, cantidad: 1 });
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
  event.preventDefault();
  if (carrito.length === 0) {
    showToast("El carrito está vacío", "error");
    return;
  }

  let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
  let caja = JSON.parse(localStorage.getItem("caja")) || [];

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  const ganancia = carrito.reduce((acc, p) => {
    return acc + ((p.precio - (p.costo || 0)) * p.cantidad);
  }, 0);

  const nuevaVenta = {
    id: Date.now(),
    fecha: new Date().toLocaleString(),
    metodo,
    total,
    ganancia,
    usuario: JSON.parse(localStorage.getItem("usuario"))?.user || "Local",
    detalle: carrito.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      costo: p.costo || 0,
      cantidad: p.cantidad,
      subtotal: p.precio * p.cantidad
    }))
  };

  // guardar venta
  ventas.push(nuevaVenta);
  localStorage.setItem("ventas", JSON.stringify(ventas));

  // registrar ingreso automático en caja
  caja.push({

  id: Date.now(),

  tipo: "ingreso",

  monto: total,

  motivo: `Venta (${

  metodo === "mp"

    ? "MERCADO PAGO"


  : metodo === "transferencia"

    ? "TRANSFERENCIA"

  : "EFECTIVO"

})`,

  fecha: new Date().toLocaleString()
  
  
});
agregarHistorial({

  tipo: "venta",

  modulo: "Ventas",

  descripcion:
    `Venta realizada por $${total}`,

  monto: total
});

localStorage.setItem(
  "caja",
  JSON.stringify(caja)
);
  // descontar stock
  productos = productos.map(prod => {
    const vendido = carrito.find(p => p.id === prod.id);

    if (vendido) {
      return {
        ...prod,
        stock: prod.stock - vendido.cantidad
      };
    }

    return prod;
  });

  localStorage.setItem("productos", JSON.stringify(productos));
// ==========================
// MOSTRAR TICKET
// ==========================

// COPIA LIMPIA
const ticketDetalle =
  [...carrito];

mostrarTicket({

  fecha:
    new Date().toLocaleString(),

  metodo,

  total,

  detalle:
    ticketDetalle
});

// LIMPIAR CARRITO
carrito = [];

// RE-RENDER
renderCarrito();
renderProductos();

// TOAST
showToast(
  "✅ Venta registrada correctamente",
  "success"
);
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
    productos.find(p => p.id === id);

  if (!item || !producto) return;

  // CONTROL STOCK
  if (item.cantidad >= producto.stock) {

    showToast(
      "No hay más stock disponible",
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