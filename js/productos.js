let productos = JSON.parse(localStorage.getItem("productos")) || [];

// GUARDAR
function guardar() {
  localStorage.setItem("productos", JSON.stringify(productos));
}

// AGREGAR
function agregarProducto() {

  const nombre = document.getElementById("nombre").value;
  const precio = Number(document.getElementById("precio").value);
  const costo = Number(document.getElementById("costo").value);
  const stock = Number(document.getElementById("stock").value);
  const tipo = document.getElementById("tipo").value;
  const unidad = document.getElementById("unidad").value;

  // VALIDACION
  if (!nombre || !precio || !stock) {

    showToast("Completá los campos obligatorios", "error");
    return;
  }

  const producto = {
    id: Date.now(),
    nombre,
    precio,
    costo,
    stock,
    tipo,
    unidad
  };

  productos.push(producto);

  guardar();

  limpiarForm();

  render();

  // ✅ TOAST
  showToast("Producto agregado correctamente");
}

// LIMPIAR
function limpiarForm() {

  document.getElementById("nombre").value = "";
  document.getElementById("precio").value = "";
  document.getElementById("costo").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("unidad").value = "";
}

// ELIMINAR
function eliminarProducto(id) {

  showConfirm({

    title: "Eliminar producto",

    message: "Esta acción no se puede deshacer.",

    onConfirm: () => {

      productos =
        productos.filter(p => p.id !== id);

      guardar();

      render();

      showToast(
        "Producto eliminado",
        "info"
      );
    }
  });
}
// RENDER
function render(lista = productos) {

  const cont = document.getElementById("listaProductos");

  cont.innerHTML = "";

  if (lista.length === 0) {

    cont.innerHTML = `
      <tr>
        <td colspan="6">No hay productos cargados</td>
      </tr>
    `;

    return;
  }

  lista.forEach(p => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <strong>${p.nombre}</strong>
      </td>

      <td>
        $${p.precio}
      </td>

      <td>
        $${p.costo || 0}
      </td>

      <td>
        <span class="${
          p.stock < 5
            ? "badge-danger"
            : "badge-success"
        }">
          ${p.stock} ${p.unidad || ""}
        </span>
      </td>

      <td>
        ${p.tipo}
      </td>

      <td>
        <button onclick="eliminarProducto(${p.id})">
          Eliminar
        </button>
      </td>
    `;

    cont.appendChild(tr);
  });
}

// FILTRAR
function filtrarProductos() {

  const texto =
    document.getElementById("buscador")
      .value
      .toLowerCase();

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(texto)
  );

  render(filtrados);
}

// INIT
render();