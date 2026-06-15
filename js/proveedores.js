// =================================
// SUPABASE PROVEEDORES
// =================================

let proveedores = [];
let caja = [];

// =================================
// HELPERS
// =================================

function money(valor) {
  return `$${Number(valor || 0).toLocaleString("es-AR")}`;
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

function activarFormatoDineroProveedores() {
  ["montoCompra", "montoPagado", "montoPago"].forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.setAttribute("inputmode", "numeric");

    input.addEventListener("input", () => {
      formatMoneyInput(input);
    });
  });
}

function avisar(mensaje, tipo = "info") {
  if (typeof showToast === "function") {
    showToast(mensaje, tipo);
  } else {
    alert(mensaje);
  }
}

// =================================
// CARGAR
// =================================

async function cargarProveedores() {
  const { data, error } = await supabaseClient
    .from("proveedores")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error(error);
    avisar("Error cargando proveedores", "error");
    return;
  }

  proveedores = data || [];

  render();
  actualizarStats();
  cargarSelect();
}

// =================================
// REGISTRAR COMPRA
// =================================

async function registrarCompraProveedor() {
  const nombre = document
    .getElementById("nombreProveedor")
    .value
    .trim();

  const monto = parseMoney(
    document.getElementById("montoCompra").value
  );

  const pagado = parseMoney(
    document.getElementById("montoPagado").value
  );

  if (!nombre || monto <= 0 || pagado < 0) {
    avisar("Datos inválidos", "error");
    return;
  }

  if (pagado > monto) {
    avisar("El pagado no puede superar el total", "error");
    return;
  }

  const deuda = monto - pagado;

  const { data, error } = await supabaseClient
    .from("proveedores")
    .insert([{
      nombre,
      total: monto,
      pagado,
      deuda,
      estado: deuda > 0 ? "pendiente" : "pagado"
    }])
    .select();

  if (error) {
    console.error(error);
    avisar("Error registrando proveedor", "error");
    return;
  }

  await supabaseClient
    .from("proveedor_historial")
    .insert([{
      proveedor_id: data[0].id,
      proveedor: nombre,
      total: monto,
      pagado,
      deuda,
      estado: deuda > 0 ? "pendiente" : "pagado",
      detalle: "Compra registrada"
    }]);

  if (pagado > 0) {
    await supabaseClient
      .from("caja")
      .insert([{
        tipo: "egreso",
        descripcion: `Pago proveedor ${nombre}`,
        monto: pagado
      }]);
  }

  avisar("Compra registrada", "success");

  document.getElementById("nombreProveedor").value = "";
  document.getElementById("montoCompra").value = "";
  document.getElementById("montoPagado").value = "";

  await cargarProveedores();
}

// =================================
// PAGAR CUENTA
// =================================

async function pagarCuenta() {
  const id = document.getElementById("cuentaSelect").value;

  const montoPago = parseMoney(
    document.getElementById("montoPago").value
  );

  const cuenta = proveedores.find(
    p => String(p.id) === String(id)
  );

  if (!cuenta || montoPago <= 0) {
    avisar("Datos inválidos", "error");
    return;
  }

  if (montoPago > Number(cuenta.deuda || 0)) {
    avisar("El pago supera la deuda", "error");
    return;
  }

  const nuevoPagado =
    Number(cuenta.pagado || 0) + montoPago;

  const nuevaDeuda =
    Number(cuenta.deuda || 0) - montoPago;

  const { error } = await supabaseClient
    .from("proveedores")
    .update({
      pagado: nuevoPagado,
      deuda: nuevaDeuda,
      estado: nuevaDeuda > 0 ? "pendiente" : "pagado"
    })
    .eq("id", cuenta.id);

  if (error) {
    console.error(error);
    avisar("Error registrando pago", "error");
    return;
  }

  await supabaseClient
    .from("proveedor_historial")
    .insert([{
      proveedor_id: cuenta.id,
      proveedor: cuenta.nombre,
      total: cuenta.total,
      pagado: nuevoPagado,
      deuda: nuevaDeuda,
      estado: nuevaDeuda > 0 ? "pendiente" : "pagado",
      detalle: `Pago registrado ${money(montoPago)}`
    }]);

  await supabaseClient
    .from("caja")
    .insert([{
      tipo: "egreso",
      descripcion: `Pago deuda ${cuenta.nombre}`,
      monto: montoPago
    }]);

  avisar("Pago registrado", "success");

  document.getElementById("montoPago").value = "";

  await cargarProveedores();
}

// =================================
// SELECT
// =================================

function cargarSelect() {
  const select = document.getElementById("cuentaSelect");

  if (!select) return;

  select.innerHTML = "";

  const pendientes = proveedores.filter(
    p => Number(p.deuda) > 0
  );

  if (pendientes.length === 0) {
    select.innerHTML = `<option>Sin deudas</option>`;
    return;
  }

  pendientes.forEach(p => {
    select.innerHTML += `
      <option value="${p.id}">
        ${p.nombre} - ${money(p.deuda)}
      </option>
    `;
  });
}

// =================================
// RENDER
// =================================

function render() {
  const cont = document.getElementById("listaProveedores");

  if (!cont) return;

  cont.innerHTML = "";

  if (proveedores.length === 0) {
    cont.innerHTML = `
      <tr>
        <td colspan="7">No hay registros</td>
      </tr>
    `;

    return;
  }

  proveedores.forEach(p => {
    const estado =
      Number(p.deuda) > 0
        ? `<span class="stock-low">⚠️ Pendiente</span>`
        : `<span class="stock-ok">✅ Pagado</span>`;

    cont.innerHTML += `
      <tr>
        <td>${p.nombre}</td>
        <td>${money(p.total)}</td>
        <td>${money(p.pagado)}</td>
        <td>${money(p.deuda)}</td>
        <td>${estado}</td>
        <td>${new Date(p.fecha).toLocaleDateString("es-AR")}</td>
        <td>
          <button
            type="button"
            class="detail-btn"
            onclick="editarProveedor('${p.id}')"
          >
            ✏️ Editar
          </button>
        </td>
      </tr>
    `;
  });
}

// =================================
// STATS
// =================================

function actualizarStats() {
  const totalProv = proveedores.length;

  const deudaTotal = proveedores.reduce(
    (acc, p) => acc + Number(p.deuda || 0),
    0
  );

  const totalPagado = proveedores.reduce(
    (acc, p) => acc + Number(p.pagado || 0),
    0
  );

  document.getElementById("totalProveedores").innerText = totalProv;
  document.getElementById("deudaTotal").innerText = money(deudaTotal);
  document.getElementById("totalPagado").innerText = money(totalPagado);
}

// =================================
// EDITAR PROVEEDOR
// =================================

async function editarProveedor(id) {
  const proveedor = proveedores.find(
    p => String(p.id) === String(id)
  );

  if (!proveedor) {
    avisar("Proveedor no encontrado", "error");
    return;
  }

  const nuevoTotal = parseMoney(
    prompt(
      "Nuevo monto total:",
      Number(proveedor.total || 0).toLocaleString("es-AR")
    )
  );

  if (Number.isNaN(nuevoTotal) || nuevoTotal < 0) {
    avisar("Monto total inválido", "error");
    return;
  }

  const nuevoPagado = parseMoney(
    prompt(
      "Nuevo monto pagado:",
      Number(proveedor.pagado || 0).toLocaleString("es-AR")
    )
  );

  if (Number.isNaN(nuevoPagado) || nuevoPagado < 0) {
    avisar("Monto pagado inválido", "error");
    return;
  }

  if (nuevoPagado > nuevoTotal) {
    avisar("El pagado no puede superar el total", "error");
    return;
  }

  const nuevaDeuda = nuevoTotal - nuevoPagado;

  const nuevoEstado =
    nuevaDeuda > 0 ? "pendiente" : "pagado";

  const confirmar = confirm(
    `¿Guardar cambios?\n\nTotal: ${money(nuevoTotal)}\nPagado: ${money(nuevoPagado)}\nDeuda: ${money(nuevaDeuda)}`
  );

  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("proveedores")
    .update({
      total: nuevoTotal,
      pagado: nuevoPagado,
      deuda: nuevaDeuda,
      estado: nuevoEstado
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    avisar("Error editando proveedor", "error");
    return;
  }

  await supabaseClient
    .from("proveedor_historial")
    .insert([{
      proveedor_id: proveedor.id,
      proveedor: proveedor.nombre,
      total: nuevoTotal,
      pagado: nuevoPagado,
      deuda: nuevaDeuda,
      estado: nuevoEstado,
      detalle: "Deuda editada manualmente"
    }]);

  avisar("Deuda editada correctamente", "success");

  await cargarProveedores();
}

// =================================
// INIT
// =================================

document.addEventListener("DOMContentLoaded", () => {
  activarFormatoDineroProveedores();
  cargarProveedores();
});