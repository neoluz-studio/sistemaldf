// =================================
// STORAGE
// =================================

let productos =

  JSON.parse(

    localStorage.getItem(
      "productos"
    )

  ) || [];

// =================================
// ESTADO
// =================================

let editandoId = null;

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
// AGREGAR / EDITAR
// =================================

function agregarProducto() {

  const nombre =

    document.getElementById(
      "nombre"
    ).value.trim();

  const precio =

    Number(

      document.getElementById(
        "precio"
      ).value
    );

  const costo =

    Number(

      document.getElementById(
        "costo"
      ).value
    );

  const stock =

    Number(

      document.getElementById(
        "stock"
      ).value
    );

  const tipo =

    document.getElementById(
      "tipo"
    ).value;

  const unidad =

    document.getElementById(
      "unidad"
    ).value.trim();

  // =================================
  // VALIDAR
  // =================================

  if (

    !nombre ||

    precio <= 0 ||

    stock < 0

  ) {

    showToast(

      "Completá los campos correctamente",

      "error"
    );

    return;
  }

  // =================================
  // DUPLICADO
  // =================================

  const existe =

    productos.find(p =>

      p.nombre.toLowerCase()

      ===

      nombre.toLowerCase()

      &&

      p.id !== editandoId
    );

  if (existe) {

    showToast(

      "Ese producto ya existe",

      "error"
    );

    return;
  }

  // =================================
  // EDITAR
  // =================================

  if (editandoId) {

    const producto =

      productos.find(
        p => p.id === editandoId
      );

    if (!producto) return;

    producto.nombre = nombre;
    producto.precio = precio;
    producto.costo = costo;
    producto.stock = stock;
    producto.tipo = tipo;
    producto.unidad = unidad;

    producto.updatedAt =
      new Date().toISOString();

    showToast(
      "Producto actualizado",
      "success"
    );

    editandoId = null;

  } else {

    // =================================
    // NUEVO
    // =================================

    productos.push({

      id: Date.now(),

      nombre,

      precio,

      costo,

      stock,

      tipo,

      unidad,

      createdAt:
        new Date().toISOString()
    });

    showToast(

      "Producto agregado correctamente",

      "success"
    );
  }

  guardar();

  limpiarForm();

  render();
}

// =================================
// LIMPIAR
// =================================

function limpiarForm() {

  editandoId = null;

  document.getElementById(
    "nombre"
  ).value = "";

  document.getElementById(
    "precio"
  ).value = "";

  document.getElementById(
    "costo"
  ).value = "";

  document.getElementById(
    "stock"
  ).value = "";

  document.getElementById(
    "unidad"
  ).value = "";

  document.getElementById(
    "tipo"
  ).value = "reventa";
}

// =================================
// ELIMINAR
// =================================

function eliminarProducto(id) {

  const producto =

    productos.find(
      p => p.id === id
    );

  if (!producto) return;

  const confirmar =

    confirm(

      `¿Eliminar ${producto.nombre}?`
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

  editandoId = id;

  document.getElementById(
    "nombre"
  ).value = producto.nombre;

  document.getElementById(
    "precio"
  ).value = producto.precio;

  document.getElementById(
    "costo"
  ).value = producto.costo;

  document.getElementById(
    "stock"
  ).value = producto.stock;

  document.getElementById(
    "tipo"
  ).value = producto.tipo;

  document.getElementById(
    "unidad"
  ).value =
    producto.unidad || "";

  window.scrollTo({

    top: 0,

    behavior: "smooth"
  });

  showToast(

    "Modo edición activado",

    "info"
  );
}

// =================================
// RENDER
// =================================

function render(

  lista = productos

) {

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

  // =================================
  // EMPTY
  // =================================

  if (lista.length === 0) {

    cont.innerHTML = `

      <tr>

        <td colspan="7">

          No hay productos cargados

        </td>

      </tr>
    `;

    return;
  }

  // =================================
  // MÁS NUEVOS ARRIBA
  // =================================

  [...lista]

    .reverse()

    .forEach(p => {

      const tr =
        document.createElement("tr");

      const ganancia =

        Number(p.precio || 0)

        -

        Number(p.costo || 0);

      tr.className =
        "product-row";

      tr.innerHTML = `

        <td>

          <div class="product-info">

            <strong>

              ${p.nombre}

            </strong>

            <small>

              ${p.tipo}

            </small>

          </div>

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
            ${p.stock <= 5
              ? "stock-low"
              : "stock-ok"}
          ">

            ${p.stock}
            ${p.unidad || ""}

          </span>

        </td>

        <td>

          <span class="
            profit-pill
          ">

            $${ganancia.toLocaleString()}

          </span>

        </td>

        <td>

          ${formatFecha(
            p.createdAt
          )}

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
// FECHA
// =================================

function formatFecha(data) {

  if (!data) return "-";

  return new Date(data)

    .toLocaleDateString(
      "es-AR"
    );
}

// =================================
// INIT
// =================================

render();