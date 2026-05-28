// =================================
// SUPABASE PROVEEDORES
// =================================

let proveedores = [];
let caja = [];

// =================================
// CARGAR
// =================================

async function cargarProveedores() {

  const {
    data,
    error
  } = await supabaseClient

    .from("proveedores")

    .select("*")

    .order(
      "fecha",
      { ascending: false }
    );

  if (error) {

    console.error(error);

    showToast(
      "Error cargando proveedores",
      "error"
    );

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

  const nombre =
    document.getElementById(
      "nombreProveedor"
    ).value.trim();

  const monto =
    Number(
      document.getElementById(
        "montoCompra"
      ).value
    );

  const pagado =
    Number(
      document.getElementById(
        "montoPagado"
      ).value
    );

  if (!nombre || monto <= 0) {

    showToast(
      "Datos inválidos",
      "error"
    );

    return;
  }

  const deuda =
    monto - pagado;

  // =================================
  // INSERTAR PROVEEDOR
  // =================================

  const {
    data,
    error
  } = await supabaseClient

    .from("proveedores")

    .insert([{

      nombre,

      total: monto,

      pagado,

      deuda,

      estado:
        deuda > 0
          ? "pendiente"
          : "pagado"
    }])

    .select();

  if (error) {

    console.error(error);

    showToast(
      "Error registrando proveedor",
      "error"
    );

    return;
  }

  // =================================
  // HISTORIAL
  // =================================

  await supabaseClient

    .from("proveedor_historial")

    .insert([{

      proveedor_id:
        data[0].id,

      proveedor:
        nombre,

      total: monto,

      pagado,

      deuda,

      estado:
        deuda > 0
          ? "pendiente"
          : "pagado",

      detalle:
        "Compra registrada"
    }]);

  // =================================
  // CAJA
  // =================================

  if (pagado > 0) {

    await supabaseClient

      .from("caja")

      .insert([{

        tipo:
          "egreso",

        descripcion:
          `Pago proveedor ${nombre}`,

        monto:
          pagado
      }]);
  }

  showToast(
    "Compra registrada",
    "success"
  );

  document.getElementById(
    "nombreProveedor"
  ).value = "";

  document.getElementById(
    "montoCompra"
  ).value = "";

  document.getElementById(
    "montoPagado"
  ).value = "";

  await cargarProveedores();
}

// =================================
// PAGAR CUENTA
// =================================

async function pagarCuenta() {

  const id =
    document.getElementById(
      "cuentaSelect"
    ).value;

  const montoPago =
    Number(
      document.getElementById(
        "montoPago"
      ).value
    );

  const cuenta =
    proveedores.find(
      p => p.id === id
    );

  if (!cuenta || montoPago <= 0) {

    showToast(
      "Datos inválidos",
      "error"
    );

    return;
  }

  if (montoPago > cuenta.deuda) {

    showToast(
      "El pago supera la deuda",
      "error"
    );

    return;
  }

  const nuevoPagado =
    Number(cuenta.pagado) + montoPago;

  const nuevaDeuda =
    Number(cuenta.deuda) - montoPago;

  // =================================
  // UPDATE
  // =================================

  const { error } = await supabaseClient

    .from("proveedores")

    .update({

      pagado:
        nuevoPagado,

      deuda:
        nuevaDeuda,

      estado:
        nuevaDeuda > 0
          ? "pendiente"
          : "pagado"
    })

    .eq(
      "id",
      cuenta.id
    );

  if (error) {

    console.error(error);

    showToast(
      "Error registrando pago",
      "error"
    );

    return;
  }

  // =================================
  // HISTORIAL
  // =================================

  await supabaseClient

    .from("proveedor_historial")

    .insert([{

      proveedor_id:
        cuenta.id,

      proveedor:
        cuenta.nombre,

      total:
        cuenta.total,

      pagado:
        nuevoPagado,

      deuda:
        nuevaDeuda,

      estado:
        nuevaDeuda > 0
          ? "pendiente"
          : "pagado",

      detalle:
        `Pago registrado $${montoPago}`
    }]);

  // =================================
  // CAJA
  // =================================

  await supabaseClient

    .from("caja")

    .insert([{

      tipo:
        "egreso",

      descripcion:
        `Pago deuda ${cuenta.nombre}`,

      monto:
        montoPago
    }]);

  showToast(
    "Pago registrado",
    "success"
  );

  document.getElementById(
    "montoPago"
  ).value = "";

  await cargarProveedores();
}

// =================================
// SELECT
// =================================

function cargarSelect() {

  const select =
    document.getElementById(
      "cuentaSelect"
    );

  if (!select) return;

  select.innerHTML = "";

  const pendientes =
    proveedores.filter(
      p => Number(p.deuda) > 0
    );

  if (pendientes.length === 0) {

    select.innerHTML = `
      <option>
        Sin deudas
      </option>
    `;

    return;
  }

  pendientes.forEach(p => {

    select.innerHTML += `
      <option value="${p.id}">
        ${p.nombre}
        - $
        ${Number(p.deuda).toLocaleString()}
      </option>
    `;
  });
}

// =================================
// RENDER
// =================================

function render() {

  const cont =
    document.getElementById(
      "listaProveedores"
    );

  if (!cont) return;

  cont.innerHTML = "";

  if (proveedores.length === 0) {

    cont.innerHTML = `
      <tr>
        <td colspan="6">
          No hay registros
        </td>
      </tr>
    `;

    return;
  }

  proveedores.forEach(p => {

    const estado =
      Number(p.deuda) > 0

      ? `
        <span class="stock-low">
          ⚠️ Pendiente
        </span>
      `

      : `
        <span class="stock-ok">
          ✅ Pagado
        </span>
      `;

    cont.innerHTML += `
      <tr>

        <td>${p.nombre}</td>

        <td>
          $${Number(p.total).toLocaleString()}
        </td>

        <td>
          $${Number(p.pagado).toLocaleString()}
        </td>

        <td>
          $${Number(p.deuda).toLocaleString()}
        </td>

        <td>${estado}</td>

        <td>
          ${new Date(p.fecha)
            .toLocaleDateString(
              "es-AR"
            )}
        </td>

      </tr>
    `;
  });
}

// =================================
// STATS
// =================================

function actualizarStats() {

  const totalProv =
    proveedores.length;

  const deudaTotal =
    proveedores.reduce(
      (acc, p) =>
        acc + Number(p.deuda || 0),
      0
    );

  const totalPagado =
    proveedores.reduce(
      (acc, p) =>
        acc + Number(p.pagado || 0),
      0
    );

  document.getElementById(
    "totalProveedores"
  ).innerText =
    totalProv;

  document.getElementById(
    "deudaTotal"
  ).innerText =
    `$${deudaTotal.toLocaleString()}`;

  document.getElementById(
    "totalPagado"
  ).innerText =
    `$${totalPagado.toLocaleString()}`;
}

// =================================
// INIT
// =================================

cargarProveedores();