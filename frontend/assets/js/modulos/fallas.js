/**
 * CRUD de Fallas
 */

// Variable para saber si estamos editando
let modoEdicion = false;

/**
 * Carga la lista de fallas al cargar la página
 */
document.addEventListener("DOMContentLoaded", async function () {
  // Verificar sesión
  const usuario = await verificarSesion(true);

  if (usuario) {
    // Mostrar información del usuario en la barra
    mostrarInfoUsuario(usuario);

    protegerModulo("fallas");
    aplicarPermisosNavbar();

    // Si estamos en index.html, cargar fallas
    if (
      window.location.pathname.includes("index.html") ||
      window.location.pathname.endsWith("/fallas/")
    ) {
      cargarFallas();
    }

    // Si estamos en formulario.html, preparar para edición
    if (window.location.pathname.includes("formulario.html")) {
      prepararFormulario();
    }
  }
});

/**
 * Carga las fallas desde el backend
 */
function cargarFallas() {
  const tbody = document.getElementById("tbodyFallas");
  tbody.innerHTML =
    '<tr><td colspan="4" class="text-center">Cargando fallas...</td></tr>';

  getAPI("fallas.php")
    .then((data) => {
      if (data.success) {
        renderizarFallas(data.fallas);
      } else {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${data.mensaje}</td></tr>`;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-center text-danger">Error al cargar las fallas</td></tr>';
    });
}

/**
 * Renderiza la tabla de fallas
 */
function renderizarFallas(fallas) {
  const tbody = document.getElementById("tbodyFallas");

  if (!fallas || fallas.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center">No hay fallas registradas</td></tr>';
    return;
  }

  let html = "";
  fallas.forEach((falla) => {
    const descripcionCorta =
      falla.descripcion.length > 80
        ? falla.descripcion.substring(0, 80) + "..."
        : falla.descripcion;

    html += `
            <tr>
                <td><strong>#${falla.id_falla}</strong></td>
                <td><strong>${falla.titulo}</strong></td>
                <td>${descripcionCorta}</td>
                <td>
                    <button onclick="editarFalla(${falla.id_falla})" class="edit-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onclick="eliminarFalla(${falla.id_falla})" class="delete-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            </tr>
        `;
  });

  tbody.innerHTML = html;
}

/**
 * Redirige al formulario para editar una falla
 */
function editarFalla(id) {
  window.location.href = `formulario.html?id=${id}`;
}

/**
 * Elimina una falla
 */
function eliminarFalla(id) {
  if (!confirm(`¿Estás seguro de eliminar la falla #${id}?`)) {
    return;
  }

  deleteAPI(`fallas.php?id=${id}`)
    .then((data) => {
      if (data.success) {
        alert("Falla eliminada correctamente");
        cargarFallas();
      } else {
        alert("Error: " + data.mensaje);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al eliminar la falla");
    });
}

/**
 * Prepara el formulario para crear o editar
 */
function prepararFormulario() {
  // Obtener parámetros de la URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    // Modo edición
    modoEdicion = true;
    document.getElementById("modo").value = "editar";
    document.getElementById("formTitle").textContent = "Editar Falla";
    document.getElementById("btnGuardar").textContent = "Actualizar";

    // Cargar datos de la falla
    cargarFalla(id);
  } else {
    // Modo creación
    modoEdicion = false;
    document.getElementById("formTitle").textContent = "Agregar Falla";
    document.getElementById("btnGuardar").textContent = "Guardar";
  }
}

/**
 * Carga los datos de una falla para editar
 */
function cargarFalla(id) {
  getAPI(`fallas.php?id=${id}`)
    .then((data) => {
      if (data.success && data.falla) {
        const falla = data.falla;
        document.getElementById("idOriginal").value = falla.id_falla;
        document.getElementById("titulo").value = falla.titulo;
        document.getElementById("descripcion").value = falla.descripcion;
      } else {
        alert("Error al cargar la falla: " + data.mensaje);
        window.location.href = "index.html";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al cargar la falla");
      window.location.href = "index.html";
    });
}

/**
 * Guarda o actualiza una falla
 */
function guardarFalla(event) {
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
    endpoint = "fallas.php";
  } else {
    metodo = postAPI;
    endpoint = "fallas.php";
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
      mostrarMensaje("Error al guardar la falla", "error");
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
