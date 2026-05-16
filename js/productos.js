// =================================
// STORAGE
// =================================

let productos =
  JSON.parse(
    localStorage.getItem("productos")
  ) || [];

// =================================
// GUARDAR
// =================================

function guardar() {

  localStorage.setItem(
    "productos",
    JSON.stringify(productos)
  );
}

// =================================
// AGREGAR
// =================================

function agregarProducto() {

  const nombre =
    document.getElementById("nombre")
      .value
      .trim();

  const precio =
    Number(
      document.getElementById("precio")
        .value
    );

  const costo =
    Number(
      document.getElementById("costo")
        .value
    );

  const stock =
    Number(
      document.getElementById("stock")
        .value
    );

  const tipo =
    document.getElementById("tipo")
      .value;

  const unidad =
    document.getElementById("unidad")
      .value
      .trim();

  // VALIDAR
  if (!nombre || !precio || stock < 0) {

    showToast(
      "Completá los campos obligatorios",
      "error"
    );

    return;
  }

  // DUPLICADO
  const existe =
    productos.find(p =>
      p.nombre.toLowerCase()
      === nombre.toLowerCase()
    );

  if (existe) {

    showToast(
      "Ese producto ya existe",
      "error"
    );

    return;
  }

  productos.push({

    id: Date.now(),

    nombre,

    precio,

    costo,

    stock,

    tipo,

    unidad
  });

  guardar();

  limpiarForm();

  render();

  showToast(
    "Producto agregado correctamente",
    "success"
  );
}

// =================================
// LIMPIAR
// =================================

function limpiarForm() {

  document.getElementById("nombre").value = "";

  document.getElementById("precio").value = "";

  document.getElementById("costo").value = "";

  document.getElementById("stock").value = "";

  document.getElementById("unidad").value = "";

  document.getElementById("tipo").value =
    "reventa";
}

// =================================
// ELIMINAR
// =================================

function eliminarProducto(id) {

  const confirmar =
    confirm(
      "¿Eliminar producto?"
    );

  if (!confirmar) return;

  productos =
    productos.filter(
      p => p.id !== id
    );

  guardar();

  render();

  showToast(
    "Producto eliminado",
    "info"
  );
}
// =================================
// EDITAR
// =================================

function editarProducto(id) {

  const producto =
    productos.find(
      p => p.id === id
    );

  if (!producto) return;

  // CARGAR FORM
  document.getElementById("nombre").value =
    producto.nombre;

  document.getElementById("precio").value =
    producto.precio;

  document.getElementById("costo").value =
    producto.costo;

  document.getElementById("stock").value =
    producto.stock;

  document.getElementById("tipo").value =
    producto.tipo;

  document.getElementById("unidad").value =
    producto.unidad || "";

  // BORRAR ORIGINAL
  productos =
    productos.filter(
      p => p.id !== id
    );

  guardar();

  render();

  window.scrollTo({

    top: 0,

    behavior: "smooth"
  });

  showToast(
    "Editando producto",
    "info"
  );
}

// =================================
// RENDER
// =================================

function render(lista = productos) {
// REFRESCAR STORAGE
productos =
  JSON.parse(
    localStorage.getItem(
      "productos"
    )
  ) || [];
  const cont =
    document.getElementById(
      "listaProductos"
    );

  cont.innerHTML = "";

  // VACIO
  if (lista.length === 0) {

    cont.innerHTML = `

      <tr>

        <td colspan="6">
          No hay productos cargados
        </td>

      </tr>
    `;

    return;
  }

  // MÁS NUEVOS ARRIBA
  [...lista]
    .reverse()
    .forEach(p => {

      const tr =
        document.createElement("tr");

      tr.className =
        "product-row";

      tr.innerHTML = `

        <td>

          <strong>
            ${p.nombre}
          </strong>

        </td>

        <td>

          $${p.precio.toLocaleString()}

        </td>

        <td>

          $${(p.costo || 0)
            .toLocaleString()}

        </td>

        <td>

          <span class="
            stock-pill
            ${p.stock < 5
              ? "stock-low"
              : "stock-ok"}
          ">

            ${p.stock}
            ${p.unidad || ""}

          </span>

        </td>

        <td>

         ${p.tipo || "reventa"}

        </td>

        <td>

          <div class="table-actions">

            <button
              onclick="editarProducto(${p.id})"
            >
              ✏️
            </button>

            <button
              onclick="eliminarProducto(${p.id})"
            >
              🗑️
            </button>

          </div>

        </td>
      `;

      cont.appendChild(tr);
    });
}

// =================================
// FILTRAR
// =================================

function filtrarProductos() {

  const texto =
    document.getElementById(
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

  render(filtrados);
}

// =================================
// INIT
// =================================

render();