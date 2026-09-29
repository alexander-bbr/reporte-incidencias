/**
 * CRUD de Observaciones
 */

// Variable para saber si estamos editando
let modoEdicion = false;

/**
 * Carga la lista de observaciones al cargar la página
 */
document.addEventListener("DOMContentLoaded", async function () {
  // Verificar sesión
  const usuario = await verificarSesion(true);

  if (usuario) {
    // Mostrar información del usuario en la barra
    mostrarInfoUsuario(usuario);

    protegerModulo("observaciones");
    aplicarPermisosNavbar();

    // Si estamos en index.html, cargar observaciones
    if (
      window.location.pathname.includes("index.html") ||
      window.location.pathname.endsWith("/observaciones/")
    ) {
      cargarObservaciones();
    }

    // Si estamos en formulario.html, preparar para edición
    if (window.location.pathname.includes("formulario.html")) {
      prepararFormulario(usuario);
    }
  }
});

/**
 * Carga las observaciones desde el backend
 */
function cargarObservaciones() {
  const tbody = document.getElementById("tbodyObservaciones");
  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center">Cargando observaciones...</td></tr>';

  getAPI("observaciones.php")
    .then((data) => {
      if (data.success) {
        renderizarObservaciones(data.observaciones);
      } else {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${data.mensaje}</td></tr>`;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-danger">Error al cargar las observaciones</td></tr>';
    });
}

/**
 * Renderiza la tabla de observaciones
 */
function renderizarObservaciones(observaciones) {
  const tbody = document.getElementById("tbodyObservaciones");

  if (!observaciones || observaciones.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center">No hay observaciones registradas</td></tr>';
    return;
  }

  let html = "";
  observaciones.forEach((observacion) => {
    const fecha = new Date(observacion.fecha_creacion).toLocaleDateString(
      "es-ES",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    const autor = `${observacion.nombre} ${observacion.apellido}`;
    const descripcionCorta =
      observacion.descripcion.length > 80
        ? observacion.descripcion.substring(0, 80) + "..."
        : observacion.descripcion;

    html += `
            <tr>
                <td><strong>#${observacion.id_observacion}</strong></td>
                <td><strong>${observacion.titulo}</strong></td>
                <td>${descripcionCorta}</td>
                <td>${autor}</td>
                <td>${fecha}</td>
                <td>
                    <button onclick="editarObservacion(${observacion.id_observacion})" class="edit-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onclick="eliminarObservacion(${observacion.id_observacion})" class="delete-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            </tr>
        `;
  });

  tbody.innerHTML = html;
}

/**
 * Redirige al formulario para editar una observación
 */
function editarObservacion(id) {
  window.location.href = `formulario.html?id=${id}`;
}

/**
 * Elimina una observación
 */
function eliminarObservacion(id) {
  if (!confirm(`¿Estás seguro de eliminar la observación #${id}?`)) {
    return;
  }

  deleteAPI(`observaciones.php?id=${id}`)
    .then((data) => {
      if (data.success) {
        alert("Observación eliminada correctamente");
        cargarObservaciones();
      } else {
        alert("Error: " + data.mensaje);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al eliminar la observación");
    });
}

/**
 * Prepara el formulario para crear o editar
 */
function prepararFormulario(usuario) {
  // Mostrar el autor
  document.getElementById("nombreAutor").textContent =
    `${usuario.nombre} ${usuario.apellido} (${usuario.cedula_usuario})`;

  // Obtener parámetros de la URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    // Modo edición
    modoEdicion = true;
    document.getElementById("modo").value = "editar";
    document.getElementById("formTitle").textContent = "Editar Observación";
    document.getElementById("btnGuardar").textContent = "Actualizar";

    // Cargar datos de la observación
    cargarObservacion(id);
  } else {
    // Modo creación
    modoEdicion = false;
    document.getElementById("formTitle").textContent = "Agregar Observación";
    document.getElementById("btnGuardar").textContent = "Guardar";
  }
}

/**
 * Carga los datos de una observación para editar
 */
function cargarObservacion(id) {
  getAPI(`observaciones.php?id=${id}`)
    .then((data) => {
      if (data.success && data.observacion) {
        const observacion = data.observacion;
        document.getElementById("idOriginal").value =
          observacion.id_observacion;
        document.getElementById("titulo").value = observacion.titulo;
        document.getElementById("descripcion").value = observacion.descripcion;
      } else {
        alert("Error al cargar la observación: " + data.mensaje);
        window.location.href = "index.html";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al cargar la observación");
      window.location.href = "index.html";
    });
}

/**
 * Guarda o actualiza una observación
 */
function guardarObservacion(event) {
  event.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const modo = document.getElementById("modo").value;

  const btn = document.getElementById("btnGuardar");

  // Validar campos
  if (!titulo || !descripcion) {
    mostrarMensaje("Todos los campos son obligatorios", "error");
    return false;
  }

  // Deshabilitar botón
  btn.disabled = true;
  btn.textContent = "Guardando...";
  ocultarMensaje();

  // Preparar datos
  const datos = {
    titulo: titulo,
    descripcion: descripcion,
  };

  // Determinar método y endpoint
  let metodo, endpoint;
  if (modo === "editar") {
    datos.id = parseInt(document.getElementById("idOriginal").value);
    metodo = putAPI;
    endpoint = "observaciones.php";
  } else {
    metodo = postAPI;
    endpoint = "observaciones.php";
  }

  // Enviar al backend
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
      mostrarMensaje("Error al guardar la observación", "error");
      btn.disabled = false;
      btn.textContent = modo === "editar" ? "Actualizar" : "Guardar";
    });

  return false;
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

/**
 * Muestra un mensaje en el formulario
 */
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

/**
 * Oculta el mensaje del formulario
 */
function ocultarMensaje() {
  const mensajeDiv = document.getElementById("mensaje");
  if (mensajeDiv) {
    mensajeDiv.style.display = "none";
  }
}
