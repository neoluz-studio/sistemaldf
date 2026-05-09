let proveedores = JSON.parse(localStorage.getItem("proveedores")) || [];
let cuentas = JSON.parse(localStorage.getItem("cuentas")) || [];

// GUARDAR
function guardarTodo() {
  localStorage.setItem("proveedores", JSON.stringify(proveedores));
  localStorage.setItem("cuentas", JSON.stringify(cuentas));
}

// AGREGAR PROVEEDOR
function agregarProveedor() {
  const nombre = document.getElementById("nombreProv").value;

  if (!nombre) return;

  proveedores.push({
    id: Date.now(),
    nombre
  });

  guardarTodo();
  cargarSelects();
}

// AGREGAR CUENTA
function agregarCuenta() {
  const proveedorId = Number(document.getElementById("proveedorSelect").value);
  const total = Number(document.getElementById("montoTotal").value);

  if (!proveedorId || !total) return;

  cuentas.push({
    id: Date.now(),
    proveedorId,
    total,
    pagado: 0
  });

  guardarTodo();
  render();
  cargarSelects();
}

// PAGAR
function pagarCuenta() {
  const cuentaId = Number(document.getElementById("cuentaSelect").value);
  const monto = Number(document.getElementById("montoPago").value);

  const cuenta = cuentas.find(c => c.id === cuentaId);

  if (!cuenta || !monto) return;

  cuenta.pagado += monto;

  guardarTodo();
  render();
}

// SELECTS
function cargarSelects() {
  const provSel = document.getElementById("proveedorSelect");
  const cuentaSel = document.getElementById("cuentaSelect");

  provSel.innerHTML = "";
  cuentaSel.innerHTML = "";

  proveedores.forEach(p => {
    provSel.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
  });

  cuentas.forEach(c => {
    const prov = proveedores.find(p => p.id === c.proveedorId);
    const saldo = c.total - c.pagado;

    cuentaSel.innerHTML += `
      <option value="${c.id}">
        ${prov ? prov.nombre : ""} - Deuda: $${saldo}
      </option>
    `;
  });
}

// RENDER
function render() {
  const cont = document.getElementById("listaCuentas");
  cont.innerHTML = "";

  if (cuentas.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        No hay cuentas registradas
      </div>
    `;
    return;
  }

  cuentas.forEach(c => {
    const prov = proveedores.find(p => p.id === c.proveedorId);
    const saldo = c.total - c.pagado;

    const div = document.createElement("div");
    div.className = "debt-card";

    div.innerHTML = `
      <div>
        <h4>${prov ? prov.nombre : "Proveedor"}</h4>
        <p>Total: $${c.total}</p>
        <p>Pagado: $${c.pagado}</p>
      </div>

      <div>
        <span class="${saldo > 0 ? "badge-danger" : "badge-success"}">
          Saldo: $${saldo}
        </span>
      </div>
    `;

    cont.appendChild(div);
  });

  cargarSelects();
}

// INIT
cargarSelects();
render();