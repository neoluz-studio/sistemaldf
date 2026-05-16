// =================================
// PROTECCION ADMIN
// =================================

if (
  localStorage.getItem("rol")
  !== "ADMIN"
) {

  showToast(
    "Acceso solo para administradores",
    "error"
  );

  setTimeout(() => {

    window.location.href =
      "index.html";

  }, 1200);
}

// =================================
// STORAGE
// =================================

let proveedores =
  JSON.parse(
    localStorage.getItem("proveedores")
  ) || [];

let cuentas =
  JSON.parse(
    localStorage.getItem("cuentas")
  ) || [];

// =================================
// GUARDAR
// =================================

function guardarTodo() {

  localStorage.setItem(
    "proveedores",
    JSON.stringify(proveedores)
  );

  localStorage.setItem(
    "cuentas",
    JSON.stringify(cuentas)
  );
}

// =================================
// AGREGAR PROVEEDOR
// =================================

function agregarProveedor() {

  const input =
    document.getElementById(
      "nombreProv"
    );

  const nombre =
    input.value.trim();

  if (!nombre) {

    showToast(
      "Ingresá un nombre",
      "error"
    );

    return;
  }

  // EVITAR DUPLICADOS
  const existe =
    proveedores.find(p =>
      p.nombre.toLowerCase()
      === nombre.toLowerCase()
    );

  if (existe) {

    showToast(
      "Ese proveedor ya existe",
      "error"
    );

    return;
  }

  proveedores.push({

    id: Date.now(),

    nombre
  });

  guardarTodo();

  input.value = "";

  cargarSelects();

  render();

  showToast(
    "Proveedor agregado",
    "success"
  );
}

// =================================
// AGREGAR CUENTA
// =================================

function agregarCuenta() {

  const proveedorId =
    Number(
      document.getElementById(
        "proveedorSelect"
      ).value
    );

  const total =
    Number(
      document.getElementById(
        "montoTotal"
      ).value
    );

  if (!proveedorId || !total) {

    showToast(
      "Completá los datos",
      "error"
    );

    return;
  }

  cuentas.push({

    id: Date.now(),

    proveedorId,

    total,

    pagado: 0,

    estado: "pendiente"
  });

  guardarTodo();

  document.getElementById(
    "montoTotal"
  ).value = "";

  render();

  cargarSelects();

  showToast(
    "Deuda registrada",
    "success"
  );
}

// =================================
// PAGAR
// =================================

function pagarCuenta() {

  const cuentaId =
    Number(
      document.getElementById(
        "cuentaSelect"
      ).value
    );

  const monto =
    Number(
      document.getElementById(
        "montoPago"
      ).value
    );

  const cuenta =
    cuentas.find(
      c => c.id === cuentaId
    );

  if (!cuenta || !monto) {

    showToast(
      "Completá los datos",
      "error"
    );

    return;
  }

  const saldo =
    cuenta.total - cuenta.pagado;

  // EVITAR PASARSE
  if (monto > saldo) {

    showToast(
      "El pago supera la deuda",
      "error"
    );

    return;
  }

  cuenta.pagado += monto;

  // PAGADA
  if (cuenta.pagado >= cuenta.total) {

    cuenta.estado = "pagada";
  }

  guardarTodo();

  render();

  cargarSelects();

  document.getElementById(
    "montoPago"
  ).value = "";

  showToast(
    "Pago registrado",
    "success"
  );
}

// =================================
// SELECTS
// =================================

function cargarSelects() {

  const provSel =
    document.getElementById(
      "proveedorSelect"
    );

  const cuentaSel =
    document.getElementById(
      "cuentaSelect"
    );

  provSel.innerHTML = "";

  cuentaSel.innerHTML = "";

  // PROVEEDORES
  proveedores.forEach(p => {

    provSel.innerHTML += `

      <option value="${p.id}">
        ${p.nombre}
      </option>
    `;
  });

  // CUENTAS
  cuentas.forEach(c => {

    const prov =
      proveedores.find(
        p => p.id === c.proveedorId
      );

    const saldo =
      c.total - c.pagado;

    // SOLO PENDIENTES
    if (saldo > 0) {

      cuentaSel.innerHTML += `

        <option value="${c.id}">

          ${prov ? prov.nombre : "Proveedor"}

          - Saldo:
          $${saldo.toLocaleString()}

        </option>
      `;
    }
  });
}

// =================================
// RENDER
// =================================

function render() {

  const cont =
    document.getElementById(
      "listaCuentas"
    );

  cont.innerHTML = "";

  // VACIO
  if (cuentas.length === 0) {

    cont.innerHTML = `

      <div class="empty-state">
        No hay cuentas registradas
      </div>
    `;

    return;
  }

  // MÁS NUEVAS ARRIBA
  [...cuentas]
    .reverse()
    .forEach(c => {

      const prov =
        proveedores.find(
          p => p.id === c.proveedorId
        );

      const saldo =
        c.total - c.pagado;

      const div =
        document.createElement("div");

      div.className = `
        debt-card
        ${c.estado === "pagada"
          ? "deuda-pagada"
          : ""}
      `;

      div.innerHTML = `

        <div>

          <h4>
            ${prov
              ? prov.nombre
              : "Proveedor"}
          </h4>

          <p>
            Total:
            $${c.total.toLocaleString()}
          </p>

          <p>
            Pagado:
            $${c.pagado.toLocaleString()}
          </p>

        </div>

        <div>

          <span class="
            ${c.estado === "pagada"
              ? "badge-success"
              : "badge-danger"}
          ">

            ${c.estado === "pagada"

              ? "✅ PAGADA"

              : `💰 Saldo: $${saldo.toLocaleString()}`
            }

          </span>

        </div>
      `;

      cont.appendChild(div);
    });
}

// =================================
// INIT
// =================================

cargarSelects();

render();