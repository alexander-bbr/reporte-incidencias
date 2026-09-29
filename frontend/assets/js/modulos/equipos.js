/**
 * CRUD de Equipos
 */

// Variable para saber si estamos editando
let modoEdicion = false;

/**
 * Carga la lista de equipos al cargar la página
 */
document.addEventListener("DOMContentLoaded", async function () {
  // Verificar sesión
  const usuario = await verificarSesion(true);

  if (usuario) {
    // Mostrar información del usuario en la barra
    mostrarInfoUsuario(usuario);

    protegerModulo("equipos");
    aplicarPermisosNavbar();

    // Si estamos en index.html, cargar equipos
    if (
      window.location.pathname.includes("index.html") ||
      window.location.pathname.endsWith("/equipos/")
    ) {
      cargarEquipos();
    }

    // Si estamos en formulario.html, preparar para edición
    if (window.location.pathname.includes("formulario.html")) {
      prepararFormulario(usuario);
    }
  }
});

/**
 * Carga los equipos desde el backend
 */
function cargarEquipos() {
  const tbody = document.getElementById("tbodyEquipos");
  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center">Cargando equipos...</td></tr>';

  getAPI("equipos.php")
    .then((data) => {
      if (data.success) {
        renderizarEquipos(data.equipos);
      } else {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${data.mensaje}</td></tr>`;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center text-danger">Error al cargar los equipos</td></tr>';
    });
}

/**
 * Renderiza la tabla de equipos
 */
function renderizarEquipos(equipos) {
  const tbody = document.getElementById("tbodyEquipos");

  if (!equipos || equipos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center">No hay equipos registrados</td></tr>';
    return;
  }

  let html = "";
  equipos.forEach((equipo) => {
    let tipoBadgeClass = "";
    switch (equipo.tipo) {
      case "COMPUTADORA":
        tipoBadgeClass = "badge-computadora";
        break;
      case "IMPRESORA":
        tipoBadgeClass = "badge-impresora";
        break;
      case "TELEFONO":
        tipoBadgeClass = "badge-telefono";
        break;
      default:
        tipoBadgeClass = "badge-otro";
    }

    let estadoBadgeClass = "";
    switch (equipo.estado) {
      case "OPERATIVO":
        estadoBadgeClass = "badge-operativo";
        break;
      case "MANTENIMIENTO":
        estadoBadgeClass = "badge-mantenimiento";
        break;
      case "INOPERATIVO":
        estadoBadgeClass = "badge-inoperativo";
        break;
    }

    const autor = `${equipo.nombre_usuario} ${equipo.apellido_usuario}`;
    const descripcionCorta =
      equipo.descripcion && equipo.descripcion.length > 60
        ? equipo.descripcion.substring(0, 60) + "..."
        : equipo.descripcion || "Sin descripción";

    html += `
            <tr>
                <td><strong>#${equipo.id_equipo}</strong></td>
                <td><strong>${equipo.nombre_equipo}</strong></td>
                <td>${descripcionCorta}</td>
                <td><span class="badge ${tipoBadgeClass}">${equipo.tipo}</span></td>
                <td><span class="badge ${estadoBadgeClass}">${equipo.estado}</span></td>
                <td>${autor}</td>
                <td>
                    <button onclick="editarEquipo(${equipo.id_equipo})" class="edit-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onclick="eliminarEquipo(${equipo.id_equipo})" class="delete-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            </tr>
        `;
  });

  tbody.innerHTML = html;
}

/**
 * Redirige al formulario para editar un equipo
 */
function editarEquipo(id) {
  window.location.href = `formulario.html?id=${id}`;
}

/**
 * Elimina un equipo
 */
function eliminarEquipo(id) {
  if (!confirm(`¿Estás seguro de eliminar el equipo #${id}?`)) {
    return;
  }

  deleteAPI(`equipos.php?id=${id}`)
    .then((data) => {
      if (data.success) {
        alert("Equipo eliminado correctamente");
        cargarEquipos();
      } else {
        alert("Error: " + data.mensaje);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al eliminar el equipo");
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
    document.getElementById("formTitle").textContent = "Editar Equipo";
    document.getElementById("btnGuardar").textContent = "Actualizar";

    // Cargar datos del equipo
    cargarEquipo(id);
  } else {
    // Modo creación
    modoEdicion = false;
    document.getElementById("formTitle").textContent = "Agregar Equipo";
    document.getElementById("btnGuardar").textContent = "Guardar";
  }
}

/**
 * Carga los datos de un equipo para editar
 */
function cargarEquipo(id) {
  getAPI(`equipos.php?id=${id}`)
    .then((data) => {
      if (data.success && data.equipo) {
        const equipo = data.equipo;
        document.getElementById("idOriginal").value = equipo.id_equipo;
        document.getElementById("nombre").value = equipo.nombre_equipo;
        document.getElementById("descripcion").value = equipo.descripcion || "";
        document.getElementById("tipo").value = equipo.tipo;
        document.getElementById("estado").value = equipo.estado;
      } else {
        alert("Error al cargar el equipo: " + data.mensaje);
        window.location.href = "index.html";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al cargar el equipo");
      window.location.href = "index.html";
    });
}

/**
 * Guarda o actualiza un equipo
 */
function guardarEquipo(event) {
  event.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const tipo = document.getElementById("tipo").value;
  const estado = document.getElementById("estado").value;
  const modo = document.getElementById("modo").value;

  const btn = document.getElementById("btnGuardar");

  // Validar campos
  if (!nombre || !tipo || !estado) {
    mostrarMensaje("Todos los campos obligatorios deben estar llenos", "error");
    return false;
  }

  // Deshabilitar botón
  btn.disabled = true;
  btn.textContent = "Guardando...";
  ocultarMensaje();

  // Preparar datos
  const datos = {
    nombre: nombre,
    descripcion: descripcion || "",
    tipo: tipo,
    estado: estado,
  };

  // Determinar método y endpoint
  let metodo, endpoint;
  if (modo === "editar") {
    datos.id = parseInt(document.getElementById("idOriginal").value);
    metodo = putAPI;
    endpoint = "equipos.php";
  } else {
    metodo = postAPI;
    endpoint = "equipos.php";
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
      mostrarMensaje("Error al guardar el equipo", "error");
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
