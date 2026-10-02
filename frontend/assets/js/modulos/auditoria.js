/**
 * Módulo de Auditoría (solo lectura)
 */

let auditoriasCargadas = [];

document.addEventListener("DOMContentLoaded", async function () {
  const usuario = await verificarSesion(true);

  if (usuario) {
    mostrarInfoUsuario(usuario);

    // ✅ Verificar permisos
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
    '<tr><td colspan="6" class="text-center">Cargando auditoría...</td></tr>';

  getAPI("auditoria.php")
    .then((data) => {
      if (data.success) {
        auditoriasCargadas = data.auditorias;
        renderizarAuditoria(data.auditorias);
      } else {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${data.mensaje}</td></tr>`;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-danger">Error al cargar la auditoría</td></tr>';
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
      '<tr><td colspan="6" class="text-center">No hay movimientos registrados</td></tr>';
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

    // ✅ Generar descripción legible
    const descripcion = generarDescripcion(a);

    html += `
            <tr>
                <td><strong>#${a.id_auditoria}</strong></td>
                <td>${fecha}</td>
                <td>${usuario}</td>
                <td><span class="badge ${accionClass}">${a.accion}</span></td>
                <td>${a.tabla_afectada}</td>
                <td>${descripcion}</td>
            </tr>
        `;
  });

  tbody.innerHTML = html;
}

/**
 * Genera la descripción legible según la acción
 */
function generarDescripcion(auditoria) {
  const tabla = auditoria.tabla_afectada;
  const accion = auditoria.accion;

  let datosAnt = null;
  let datosNue = null;

  try {
    if (auditoria.datos_anteriores) {
      datosAnt = JSON.parse(auditoria.datos_anteriores);
    }
  } catch (e) {
    datosAnt = null;
  }

  try {
    if (auditoria.datos_nuevos) {
      datosNue = JSON.parse(auditoria.datos_nuevos);
    }
  } catch (e) {
    datosNue = null;
  }

  // Identificar el nombre del recurso según la tabla
  const nombreAnt = datosAnt ? obtenerIdentificador(tabla, datosAnt) : "";
  const nombreNue = datosNue ? obtenerIdentificador(tabla, datosNue) : "";

  if (accion === "CREAR") {
    return `${capitalizar(tabla)} creado: <strong>${nombreNue}</strong>`;
  }

  if (accion === "ELIMINAR") {
    return `${capitalizar(tabla)} eliminado: <strong>${nombreAnt}</strong>`;
  }

  if (accion === "EDITAR") {
    if (!datosAnt || !datosNue) {
      return `${capitalizar(tabla)} editado: <strong>${nombreNue || nombreAnt}</strong>`;
    }

    // Detectar cambios campo por campo
    const cambios = detectarCambios(datosAnt, datosNue);

    if (cambios.length === 0) {
      return `${capitalizar(tabla)} editado: <strong>${nombreNue}</strong>`;
    }

    // Formato: "Antes: X · Ahora: Y"
    const cambiosHtml = cambios
      .map(
        (c) =>
          `<span class="cambio-item">Antes: <em>${c.antes}</em> · Ahora: <strong>${c.ahora}</strong></span>`,
      )
      .join("<br>");

    return `${capitalizar(tabla)} editado: <strong>${nombreNue || nombreAnt}</strong><br>${cambiosHtml}`;
  }

  return auditoria.descripcion || "-";
}

/**
 * Obtiene el identificador principal según la tabla
 */
function obtenerIdentificador(tabla, datos) {
  switch (tabla) {
    case "usuario":
      return `${datos.nombre || ""} ${datos.apellido || ""}`.trim();
    case "reporte":
      return datos.titulo || `#${datos.id_reporte}` || "";
    case "equipo":
      return datos.nombre || "";
    case "falla":
      return datos.titulo || "";
    case "observacion":
      return datos.titulo || "";
    default:
      return "";
  }
}

/**
 * Detecta los campos que cambiaron entre dos objetos
 * @returns {Array} Lista de { campo, antes, ahora }
 */
function detectarCambios(antes, despues) {
  const camposIgnorados = [
    "contrasena",
    "fecha_creacion",
    "equipos",
    "fallas",
    "cedula_usuario",
    "id_reporte",
    "id_equipo",
    "id_falla",
    "id_observacion",
  ];

  const cambios = [];

  Object.keys(despues).forEach((campo) => {
    if (camposIgnorados.includes(campo)) return;
    if (!(campo in antes)) return;

    const valorAntes = antes[campo] ?? "";
    const valorDespues = despues[campo] ?? "";

    // Comparación simple como strings
    if (String(valorAntes) !== String(valorDespues)) {
      cambios.push({
        campo: campo,
        antes: formatearValor(valorAntes),
        ahora: formatearValor(valorDespues),
      });
    }
  });

  return cambios;
}

/**
 * Formatea un valor para mostrarlo
 */
function formatearValor(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "(vacío)";
  }
  return String(valor);
}

/**
 * Capitaliza la primera letra
 */
function capitalizar(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
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
