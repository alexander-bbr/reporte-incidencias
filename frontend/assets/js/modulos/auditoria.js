/**
 * Módulo de Auditoría (solo lectura)
 */

let auditoriasCargadas = [];

document.addEventListener("DOMContentLoaded", async function () {
  const usuario = await verificarSesion(true);

  if (usuario) {
    mostrarInfoUsuario(usuario);

    protegerModulo("auditoria");
    aplicarPermisosNavbar();

    cargarAuditoria();
  }
});

/**
 * Carga la auditoría desde el backend
 */
function cargarAuditoria() {
  const tbody = document.getElementById("tbodyAuditoria");
  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center">Cargando auditoría...</td></tr>';

  getAPI("auditoria.php")
    .then((data) => {
      if (data.success) {
        auditoriasCargadas = data.auditorias;
        renderizarAuditoria(data.auditorias);
      } else {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${data.mensaje}</td></tr>`;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center text-danger">Error al cargar la auditoría</td></tr>';
    });
}

/**
 * Aplica los filtros seleccionados
 */
function aplicarFiltros() {
  const filtroTabla = document.getElementById("filtroTabla").value;
  const filtroAccion = document.getElementById("filtroAccion").value;

  let filtradas = auditoriasCargadas;

  if (filtroTabla) {
    filtradas = filtradas.filter((a) => a.tabla_afectada === filtroTabla);
  }

  if (filtroAccion) {
    filtradas = filtradas.filter((a) => a.accion === filtroAccion);
  }

  renderizarAuditoria(filtradas);
}

/**
 * Limpia los filtros
 */
function limpiarFiltros() {
  document.getElementById("filtroTabla").value = "";
  document.getElementById("filtroAccion").value = "";
  renderizarAuditoria(auditoriasCargadas);
}

/**
 * Renderiza la tabla de auditoría
 */
function renderizarAuditoria(auditorias) {
  const tbody = document.getElementById("tbodyAuditoria");

  if (!auditorias || auditorias.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center">No hay movimientos registrados</td></tr>';
    return;
  }

  let html = "";
  auditorias.forEach((a) => {
    const fecha = new Date(a.fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const usuario = a.nombre_usuario
      ? `${a.nombre_usuario} ${a.apellido_usuario}`
      : a.cedula_usuario;

    // Clases para badges de acción
    let accionClass = "";
    switch (a.accion) {
      case "CREAR":
        accionClass = "badge-crear";
        break;
      case "EDITAR":
        accionClass = "badge-editar";
        break;
      case "ELIMINAR":
        accionClass = "badge-eliminar";
        break;
    }

    html += `
            <tr>
                <td><strong>#${a.id_auditoria}</strong></td>
                <td>${fecha}</td>
                <td>${usuario}</td>
                <td><span class="badge ${accionClass}">${a.accion}</span></td>
                <td>${a.tabla_afectada}</td>
                <td>${a.descripcion || "-"}</td>
                <td>
                    <button onclick="verDetalle(${a.id_auditoria})" class="edit-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                </td>
            </tr>
        `;
  });

  tbody.innerHTML = html;
}

/**
 * Muestra el detalle de un movimiento
 */
function verDetalle(id) {
  const auditoria = auditoriasCargadas.find((a) => a.id_auditoria === id);
  if (!auditoria) return;

  const modal = document.getElementById("modalDetalle");
  const modalBody = document.getElementById("modalBody");

  let html = `
    <div class="detalle-seccion">
      <h4>Información general</h4>
      <p><strong>ID:</strong> #${auditoria.id_auditoria}</p>
      <p><strong>Fecha:</strong> ${new Date(auditoria.fecha).toLocaleString("es-ES")}</p>
      <p><strong>Usuario:</strong> ${auditoria.nombre_usuario ? `${auditoria.nombre_usuario} ${auditoria.apellido_usuario} (${auditoria.cedula_usuario})` : auditoria.cedula_usuario}</p>
      <p><strong>Acción:</strong> ${auditoria.accion}</p>
      <p><strong>Tabla:</strong> ${auditoria.tabla_afectada}</p>
      <p><strong>ID del registro:</strong> ${auditoria.id_registro || "-"}</p>
      <p><strong>Descripción:</strong> ${auditoria.descripcion || "-"}</p>
    </div>
  `;

  if (auditoria.datos_anteriores) {
    try {
      const datosAnt = JSON.parse(auditoria.datos_anteriores);
      html += `
        <div class="detalle-seccion">
          <h4>Datos anteriores</h4>
          <pre>${JSON.stringify(datosAnt, null, 2)}</pre>
        </div>
      `;
    } catch (e) {
      html += `<div class="detalle-seccion"><h4>Datos anteriores</h4><pre>${auditoria.datos_anteriores}</pre></div>`;
    }
  }

  if (auditoria.datos_nuevos) {
    try {
      const datosNue = JSON.parse(auditoria.datos_nuevos);
      html += `
        <div class="detalle-seccion">
          <h4>Datos nuevos</h4>
          <pre>${JSON.stringify(datosNue, null, 2)}</pre>
        </div>
      `;
    } catch (e) {
      html += `<div class="detalle-seccion"><h4>Datos nuevos</h4><pre>${auditoria.datos_nuevos}</pre></div>`;
    }
  }

  modalBody.innerHTML = html;
  modal.style.display = "flex";
}

/**
 * Cierra el modal
 */
function cerrarModal() {
  document.getElementById("modalDetalle").style.display = "none";
}

/**
 * Muestra información del usuario en la barra de navegación
 */
function mostrarInfoUsuario(usuario) {
  const nombreUsuario = document.getElementById("nombreUsuario");
  const rolUsuario = document.getElementById("rolUsuario");

  if (nombreUsuario) {
    nombreUsuario.textContent = `${usuario.nombre} ${usuario.apellido}`;
  }

  if (rolUsuario) {
    rolUsuario.textContent = usuario.rol;
  }
}

// Cerrar modal al hacer click fuera
document.addEventListener("click", function (e) {
  const modal = document.getElementById("modalDetalle");
  if (modal && e.target === modal) {
    cerrarModal();
  }
});
