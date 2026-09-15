/**
 * CRUD de Reportes
 */

let modoEdicion = false;
let usuarioActual = null;

document.addEventListener("DOMContentLoaded", async function () {
  usuarioActual = await verificarSesion(true);

  if (usuarioActual) {
    mostrarInfoUsuario(usuarioActual);

    if (
      window.location.pathname.includes("index.html") ||
      window.location.pathname.endsWith("/reportes/")
    ) {
      cargarReportes();
    }

    if (window.location.pathname.includes("formulario.html")) {
      prepararFormulario(usuarioActual);
    }
  }
});

/**
 * Carga la lista de reportes
 */
function cargarReportes() {
  const tbody = document.getElementById("tbodyReportes");
  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center">Cargando reportes...</td></tr>';

  getAPI("reportes.php")
    .then((data) => {
      if (data.success) {
        renderizarReportes(data.reportes);
      } else {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${data.mensaje}</td></tr>`;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center text-danger">Error al cargar los reportes</td></tr>';
    });
}

/**
 * Renderiza la tabla de reportes
 */
function renderizarReportes(reportes) {
  const tbody = document.getElementById("tbodyReportes");

  if (!reportes || reportes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center">No hay reportes registrados</td></tr>';
    return;
  }

  let html = "";
  reportes.forEach((reporte) => {
    const fecha = new Date(reporte.fecha_creacion).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Clases para badges de prioridad
    let prioridadClass = "";
    switch (reporte.prioridad) {
      case "ALTA":
        prioridadClass = "badge-alta";
        break;
      case "MEDIA":
        prioridadClass = "badge-media";
        break;
      case "BAJA":
        prioridadClass = "badge-baja";
        break;
    }

    // Clases para badges de estado
    let estadoClass = "";
    switch (reporte.estado) {
      case "PENDIENTE":
        estadoClass = "badge-pendiente";
        break;
      case "EN REVISION":
        estadoClass = "badge-en-revision";
        break;
      case "REVISADO":
        estadoClass = "badge-revisado";
        break;
    }

    const autor = `${reporte.nombre} ${reporte.apellido}`;

    html += `
            <tr>
                <td><strong>#${reporte.id_reporte}</strong></td>
                <td><strong>${reporte.titulo}</strong></td>
                <td><span class="badge ${prioridadClass}">${reporte.prioridad}</span></td>
                <td><span class="badge ${estadoClass}">${reporte.estado}</span></td>
                <td>${autor}</td>
                <td>${fecha}</td>
                <td>
                    <button onclick="editarReporte(${reporte.id_reporte})" class="edit-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onclick="eliminarReporte(${reporte.id_reporte})" class="delete-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            </tr>
        `;
  });

  tbody.innerHTML = html;
}

function editarReporte(id) {
  window.location.href = `formulario.html?id=${id}`;
}

function eliminarReporte(id) {
  if (!confirm(`¿Estás seguro de eliminar el reporte #${id}?`)) {
    return;
  }

  deleteAPI(`reportes.php?id=${id}`)
    .then((data) => {
      if (data.success) {
        alert("Reporte eliminado correctamente");
        cargarReportes();
      } else {
        alert("Error: " + data.mensaje);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al eliminar el reporte");
    });
}

/**
 * Prepara el formulario
 */
function prepararFormulario(usuario) {
  // Cargar equipos y fallas en los checkboxes
  cargarEquiposCheckbox();
  cargarFallasCheckbox();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    // Modo edición
    modoEdicion = true;
    document.getElementById("modo").value = "editar";
    document.getElementById("formTitle").textContent = "Editar Reporte";
    document.getElementById("btnGuardar").textContent = "Actualizar";

    // Mostrar grupo de estado
    document.getElementById("grupoEstado").style.display = "block";

    // Mostrar grupo de solución solo para SISTEMAS
    if (usuario.rol === "SISTEMAS") {
      document.getElementById("grupoSolucion").style.display = "block";
    }

    cargarReporte(id);
  } else {
    // Modo creación
    modoEdicion = false;
    document.getElementById("formTitle").textContent = "Agregar Reporte";
    document.getElementById("btnGuardar").textContent = "Guardar";
    // En creación, estado y solución no se muestran
    document.getElementById("grupoEstado").style.display = "none";
    document.getElementById("grupoSolucion").style.display = "none";
  }
}

/**
 * Carga los equipos en checkboxes
 */
function cargarEquiposCheckbox() {
  const contenedor = document.getElementById("equiposCheckbox");
  contenedor.innerHTML = '<p class="text-muted">Cargando equipos...</p>';

  getAPI("equipos.php")
    .then((data) => {
      if (data.success && data.equipos.length > 0) {
        let html = "";
        data.equipos.forEach((equipo) => {
          html += `
            <label class="checkbox-item">
              <input type="checkbox" name="equipos" value="${equipo.id_equipo}">
              <span>#${equipo.id_equipo} - ${equipo.nombre} (${equipo.tipo})</span>
            </label>
          `;
        });
        contenedor.innerHTML = html;
      } else {
        contenedor.innerHTML =
          '<p class="text-muted">No hay equipos registrados</p>';
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      contenedor.innerHTML =
        '<p class="text-muted">Error al cargar equipos</p>';
    });
}

/**
 * Carga las fallas en checkboxes
 */
function cargarFallasCheckbox() {
  const contenedor = document.getElementById("fallasCheckbox");
  contenedor.innerHTML = '<p class="text-muted">Cargando fallas...</p>';

  getAPI("fallas.php")
    .then((data) => {
      if (data.success && data.fallas.length > 0) {
        let html = "";
        data.fallas.forEach((falla) => {
          html += `
            <label class="checkbox-item">
              <input type="checkbox" name="fallas" value="${falla.id_falla}">
              <span>#${falla.id_falla} - ${falla.titulo}</span>
            </label>
          `;
        });
        contenedor.innerHTML = html;
      } else {
        contenedor.innerHTML =
          '<p class="text-muted">No hay fallas registradas</p>';
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      contenedor.innerHTML = '<p class="text-muted">Error al cargar fallas</p>';
    });
}

/**
 * Carga un reporte para editar
 */
function cargarReporte(id) {
  getAPI(`reportes.php?id=${id}`)
    .then((data) => {
      if (data.success && data.reporte) {
        const reporte = data.reporte;
        document.getElementById("idOriginal").value = reporte.id_reporte;
        document.getElementById("titulo").value = reporte.titulo;
        document.getElementById("descripcion").value = reporte.descripcion;
        document.getElementById("prioridad").value = reporte.prioridad;
        document.getElementById("estado").value = reporte.estado;

        if (reporte.solucion) {
          document.getElementById("solucion").value = reporte.solucion;
        }

        // Marcar equipos asociados
        const idsEquipos = reporte.equipos.map((e) => e.id_equipo);
        document
          .querySelectorAll('input[name="equipos"]')
          .forEach((checkbox) => {
            if (idsEquipos.includes(parseInt(checkbox.value))) {
              checkbox.checked = true;
            }
          });

        // Marcar fallas asociadas
        const idsFallas = reporte.fallas.map((f) => f.id_falla);
        document
          .querySelectorAll('input[name="fallas"]')
          .forEach((checkbox) => {
            if (idsFallas.includes(parseInt(checkbox.value))) {
              checkbox.checked = true;
            }
          });
      } else {
        alert("Error al cargar el reporte: " + data.mensaje);
        window.location.href = "index.html";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al cargar el reporte");
      window.location.href = "index.html";
    });
}

/**
 * Guarda o actualiza un reporte
 */
function guardarReporte(event) {
  event.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const prioridad = document.getElementById("prioridad").value;
  const modo = document.getElementById("modo").value;

  const btn = document.getElementById("btnGuardar");

  // Validar campos
  if (!titulo || !descripcion || !prioridad) {
    mostrarMensaje("Todos los campos obligatorios deben estar llenos", "error");
    return false;
  }

  // Obtener equipos seleccionados
  const equiposSeleccionados = [];
  document
    .querySelectorAll('input[name="equipos"]:checked')
    .forEach((checkbox) => {
      equiposSeleccionados.push(parseInt(checkbox.value));
    });

  // Obtener fallas seleccionadas
  const fallasSeleccionadas = [];
  document
    .querySelectorAll('input[name="fallas"]:checked')
    .forEach((checkbox) => {
      fallasSeleccionadas.push(parseInt(checkbox.value));
    });

  btn.disabled = true;
  btn.textContent = "Guardando...";
  ocultarMensaje();

  const datos = {
    titulo: titulo,
    descripcion: descripcion,
    prioridad: prioridad,
    equipos: equiposSeleccionados,
    fallas: fallasSeleccionadas,
  };

  let metodo, endpoint;
  if (modo === "editar") {
    datos.id = parseInt(document.getElementById("idOriginal").value);
    datos.estado = document.getElementById("estado").value;

    // Solo enviar solución si es SISTEMAS
    if (usuarioActual.rol === "SISTEMAS") {
      datos.solucion = document.getElementById("solucion").value.trim();
    }

    metodo = putAPI;
    endpoint = "reportes.php";
  } else {
    metodo = postAPI;
    endpoint = "reportes.php";
  }

  metodo(endpoint, datos)
    .then((data) => {
      if (data.success) {
        mostrarMensaje(data.mensaje, "success");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        mostrarMensaje(data.mensaje, "error");
        btn.disabled = false;
        btn.textContent = modo === "editar" ? "Actualizar" : "Guardar";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      mostrarMensaje("Error al guardar el reporte", "error");
      btn.disabled = false;
      btn.textContent = modo === "editar" ? "Actualizar" : "Guardar";
    });

  return false;
}

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

function mostrarMensaje(mensaje, tipo) {
  const mensajeDiv = document.getElementById("mensaje");
  if (mensajeDiv) {
    mensajeDiv.textContent = mensaje;
    mensajeDiv.className = `message message-${tipo}`;
    mensajeDiv.style.display = "block";

    if (tipo === "success") {
      setTimeout(() => {
        mensajeDiv.style.display = "none";
      }, 5000);
    }
  }
}

function ocultarMensaje() {
  const mensajeDiv = document.getElementById("mensaje");
  if (mensajeDiv) {
    mensajeDiv.style.display = "none";
  }
}
