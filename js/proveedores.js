// =================================
// STORAGE
// =================================

let proveedores =

  JSON.parse(

    localStorage.getItem(
      "proveedores"
    )

  ) || [];

let caja =

  JSON.parse(

    localStorage.getItem(
      "caja"
    )

  ) || [];

// =================================
// GUARDAR
// =================================

function guardar() {

  localStorage.setItem(

    "proveedores",

    JSON.stringify(
      proveedores
    )
  );
}

// =================================
// REGISTRAR COMPRA
// =================================

function registrarCompraProveedor() {

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

  // VALIDAR
  if (

    !nombre ||

    monto <= 0

  ) {

    showToast(

      "Datos inválidos",

      "error"
    );

    return;
  }

  // =================================
  // DEUDA
  // =================================

  const deuda =

    monto - pagado;

  // =================================
  // REGISTRO
  // =================================

  proveedores.push({

    id: Date.now(),

    nombre,

    monto,

    pagado,

    deuda,

    fecha:
      new Date()
        .toISOString()
  });

  // =================================
  // CAJA
  // =================================

  if (pagado > 0) {

    caja.push({

      tipo:
        "egreso",

      descripcion:
        `Pago proveedor ${nombre}`,

      monto:
        pagado,

      fecha:
        new Date()
          .toISOString()
    });

    localStorage.setItem(

      "caja",

      JSON.stringify(caja)
    );
  }

  guardar();

  render();

  actualizarStats();

  cargarSelect();

  showToast(

    "Compra registrada",

    "success"
  );

  // LIMPIAR
  document.getElementById(
    "nombreProveedor"
  ).value = "";

  document.getElementById(
    "montoCompra"
  ).value = "";

  document.getElementById(
    "montoPagado"
  ).value = "";
}

// =================================
// PAGAR
// =================================

function pagarCuenta() {

  const id =

    Number(

      document.getElementById(
        "cuentaSelect"
      ).value
    );

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

  if (

    !cuenta ||

    montoPago <= 0

  ) {

    showToast(

      "Datos inválidos",

      "error"
    );

    return;
  }

  // VALIDAR
  if (

    montoPago > cuenta.deuda

  ) {

    showToast(

      "El pago supera la deuda",

      "error"
    );

    return;
  }

  // =================================
  // ACTUALIZAR
  // =================================

  cuenta.pagado +=
    montoPago;

  cuenta.deuda -=
    montoPago;

  // =================================
  // CAJA
  // =================================

  caja.push({

    tipo:
      "egreso",

    descripcion:
      `Pago deuda ${cuenta.nombre}`,

    monto:
      montoPago,

    fecha:
      new Date()
        .toISOString()
  });

  localStorage.setItem(

    "caja",

    JSON.stringify(caja)
  );

  guardar();

  render();

  actualizarStats();

  cargarSelect();

  showToast(

    "Pago registrado",

    "success"
  );

  document.getElementById(
    "montoPago"
  ).value = "";
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
      p => p.deuda > 0
    );

  if (

    pendientes.length === 0

  ) {

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
        ${p.deuda.toLocaleString()}

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

  // VACIO
  if (

    proveedores.length === 0

  ) {

    cont.innerHTML = `

      <tr>

        <td colspan="6">

          No hay registros

        </td>

      </tr>
    `;

    return;
  }

  [...proveedores]

    .reverse()

    .forEach(p => {

      const estado =

        p.deuda > 0

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

          <td>

            ${p.nombre}

          </td>

          <td>

            $${p.monto.toLocaleString()}

          </td>

          <td>

            $${p.pagado.toLocaleString()}

          </td>

          <td>

            $${p.deuda.toLocaleString()}

          </td>

          <td>

            ${estado}

          </td>

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

        acc + p.deuda,

      0
    );

  const totalPagado =

    proveedores.reduce(

      (acc, p) =>

        acc + p.pagado,

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

render();

actualizarStats();

cargarSelect();