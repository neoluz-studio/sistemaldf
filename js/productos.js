// =================================
// PRODUCTOS SUPABASE - LO DE FAUSTI
// =================================

let productos = [];
let editandoId = null;

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
  if (!data) return "-";
  return new Date(data).toLocaleDateString("es-AR");
}

function syncLocalProductos() {
  localStorage.setItem("productos", JSON.stringify(productos));
}

function parseMoney(valor) {
  return Number(
    String(valor || "")
      .replace(/\./g, "")
      .replace(/,/g, ".")
      .replace(/[^\d.]/g, "")
  ) || 0;
}

function formatMoneyInput(input) {
  if (!input) return;

  const limpio = String(input.value || "").replace(/\D/g, "");

  if (!limpio) {
    input.value = "";
    return;
  }

  input.value = Number(limpio).toLocaleString("es-AR");
}

function parseCantidad(valor) {
  const texto = String(valor || "").trim().replace(",", ".");

  if (!texto) return 0;

  if (texto.includes(" ")) {
    const partes = texto.split(" ");
    const entero = Number(partes[0]) || 0;
    const fraccion = partes[1];

    if (fraccion && fraccion.includes("/")) {
      const [num, den] = fraccion.split("/").map(Number);
      return entero + (den ? num / den : 0);
    }

    return entero;
  }

  if (texto.includes("/")) {
    const [num, den] = texto.split("/").map(Number);
    return den ? num / den : 0;
  }

  return Number(texto) || 0;
}

function activarFormatoInputs() {
  ["precio", "costo"].forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.setAttribute("inputmode", "numeric");

    input.addEventListener("input", () => {
      formatMoneyInput(input);
    });
  });
}

function limpiarForm() {
  editandoId = null;

  document.getElementById("nombre").value = "";
  document.getElementById("precio").value = "";
  document.getElementById("costo").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("unidad").value = "unidad";
  document.getElementById("tipo").value = "reventa";

  const btn = document.getElementById("btnGuardarProducto");

  if (btn) {
    btn.innerText = "Guardar Producto";
  }
}

// =================================
// CARGAR PRODUCTOS
// =================================

async function cargarProductosSupabase() {
  const cont = document.getElementById("listaProductos");

  if (cont) {
    cont.innerHTML = `
      <tr>
        <td colspan="7">Cargando productos...</td>
      </tr>
    `;
  }

  const { data, error } = await supabaseClient
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    avisar("Error cargando productos", "error");

    productos = JSON.parse(localStorage.getItem("productos")) || [];
    render(productos);

    return;
  }

  productos = data || [];
  syncLocalProductos();
  render(productos);
}

// =================================
// GUARDAR / EDITAR
// =================================

async function agregarProducto() {
  const nombre = document.getElementById("nombre").value.trim();

  const precio = parseMoney(document.getElementById("precio").value);
  const costo = parseMoney(document.getElementById("costo").value);
  const stock = parseCantidad(document.getElementById("stock").value);

  const tipo = document.getElementById("tipo").value;
  const unidad = document.getElementById("unidad").value || "unidad";

  if (!nombre || precio <= 0 || stock < 0) {
    avisar("Completá los campos correctamente", "error");
    return;
  }

  const existe = productos.find(
    p =>
      String(p.nombre || "").toLowerCase() === nombre.toLowerCase() &&
      String(p.id) !== String(editandoId)
  );

  if (existe) {
    avisar("Ese producto ya existe", "error");
    return;
  }

  const producto = {
    nombre,
    precio,
    costo,
    stock,
    tipo,
    unidad,
    stock_minimo: 5,
    activo: true
  };

  let error;

  if (editandoId) {
    const res = await supabaseClient
      .from("productos")
      .update(producto)
      .eq("id", editandoId);

    error = res.error;
  } else {
    const res = await supabaseClient
      .from("productos")
      .insert([producto]);

    error = res.error;
  }

  if (error) {
    console.error(error);
    avisar("Error guardando producto", "error");
    return;
  }

  avisar(
    editandoId
      ? "Producto actualizado"
      : "Producto agregado correctamente",
    "success"
  );

  limpiarForm();

  await cargarProductosSupabase();
}

// =================================
// EDITAR
// =================================

function editarProducto(id) {
  const producto = productos.find(
    p => String(p.id) === String(id)
  );

  if (!producto) return;

  editandoId = producto.id;

  document.getElementById("nombre").value = producto.nombre || "";
  document.getElementById("precio").value = Number(producto.precio || 0).toLocaleString("es-AR");
  document.getElementById("costo").value = Number(producto.costo || 0).toLocaleString("es-AR");
  document.getElementById("stock").value = producto.stock || 0;
  document.getElementById("tipo").value = producto.tipo || "reventa";
  document.getElementById("unidad").value = producto.unidad || "unidad";

  const btn = document.getElementById("btnGuardarProducto");

  if (btn) {
    btn.innerText = "Actualizar Producto";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  avisar("Modo edición activado", "info");
}

// =================================
// ELIMINAR
// =================================

async function eliminarProducto(id) {
  const producto = productos.find(
    p => String(p.id) === String(id)
  );

  if (!producto) return;

  const confirmar = confirm(`¿Eliminar ${producto.nombre}?`);

  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("productos")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error(error);
    avisar("Error eliminando producto", "error");
    return;
  }

  avisar("Producto eliminado", "info");

  await cargarProductosSupabase();
}

// =================================
// RENDER
// =================================

function render(lista = productos) {
  const cont = document.getElementById("listaProductos");

  if (!cont) return;

  cont.innerHTML = "";

  if (lista.length === 0) {
    cont.innerHTML = `
      <tr>
        <td colspan="7">No hay productos cargados</td>
      </tr>
    `;

    return;
  }

  lista.forEach(p => {
    const precio = Number(p.precio || 0);
    const costo = Number(p.costo || 0);
    const stock = Number(p.stock || 0);
    const ganancia = precio - costo;

    const tr = document.createElement("tr");

    tr.className = "product-row";

    tr.innerHTML = `
      <td>
        <div class="product-info">
          <strong>${p.nombre}</strong>
          <small>${p.tipo || "-"}</small>
        </div>
      </td>

      <td>${money(precio)}</td>

      <td>${money(costo)}</td>

      <td>
        <span class="
          stock-pill
          ${stock <= Number(p.stock_minimo || 5) ? "stock-low" : "stock-ok"}
        ">
          ${stock} ${p.unidad || ""}
        </span>
      </td>

      <td>
        <span class="profit-pill">
          ${money(ganancia)}
        </span>
      </td>

      <td>${formatFecha(p.created_at)}</td>

      <td>
        <div class="table-actions">
          <button
            type="button"
            onclick="editarProducto('${p.id}')"
          >
            ✏️
          </button>

          <button
            type="button"
            onclick="eliminarProducto('${p.id}')"
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
  const texto = document
    .getElementById("buscador")
    .value
    .toLowerCase();

  const filtrados = productos.filter(p =>
    String(p.nombre || "")
      .toLowerCase()
      .includes(texto)
  );

  render(filtrados);
}

// =================================
// INIT
// =================================

document.addEventListener("DOMContentLoaded", () => {
  activarFormatoInputs();
  cargarProductosSupabase();
});