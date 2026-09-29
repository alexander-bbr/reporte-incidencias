/**
 * CRUD de Usuarios
 */

// Variable para saber si estamos editando
let modoEdicion = false;

/**
 * Carga la lista de usuarios al cargar la página
 */
document.addEventListener("DOMContentLoaded", async function () {
  // Verificar sesión
  const usuario = await verificarSesion(true);

  if (usuario) {
    // Mostrar información del usuario en la barra
    mostrarInfoUsuario(usuario);

    protegerModulo("usuarios");
    aplicarPermisosNavbar();

    // Si estamos en index.html, cargar usuarios
    if (
      window.location.pathname.includes("index.html") ||
      window.location.pathname.endsWith("/usuarios/")
    ) {
      cargarUsuarios();
    }

    // Si estamos en formulario.html, preparar para edición
    if (window.location.pathname.includes("formulario.html")) {
      prepararFormulario();
    }
  }
});

/**
 * Carga los usuarios desde el backend
 */
function cargarUsuarios() {
  const tbody = document.getElementById("tbodyUsuarios");
  tbody.innerHTML =
    '<tr><td colspan="5" class="text-center">Cargando usuarios...</td></tr>';

  getAPI("usuarios.php")
    .then((data) => {
      if (data.success) {
        renderizarUsuarios(data.usuarios);
      } else {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${data.mensaje}</td></tr>`;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center text-danger">Error al cargar los usuarios</td></tr>';
    });
}

/**
 * Renderiza la tabla de usuarios
 */
function renderizarUsuarios(usuarios) {
  const tbody = document.getElementById("tbodyUsuarios");

  if (!usuarios || usuarios.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center">No hay usuarios registrados</td></tr>';
    return;
  }

  let html = "";
  usuarios.forEach((usuario) => {
    let badgeClass = "";
    switch (usuario.rol) {
      case "SISTEMAS":
        badgeClass = "badge-sistemas";
        break;
      case "COORDINADORA":
        badgeClass = "badge-coordinadora";
        break;
      case "ADMISIONISTA":
        badgeClass = "badge-admisionista";
        break;
      default:
        badgeClass = "badge-default";
    }

    html += `
            <tr>
                <td><strong>${usuario.cedula_usuario}</strong></td>
                <td>${usuario.nombre} ${usuario.apellido}</td>
                <td>${usuario.telefono}</td>
                <td><span class="badge ${badgeClass}">${usuario.rol}</span></td>
                <td>
                    <button onclick="editarUsuario('${usuario.cedula_usuario}')" class="edit-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onclick="eliminarUsuario('${usuario.cedula_usuario}')" class="delete-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            </tr>
        `;
  });

  tbody.innerHTML = html;
}

/**
 * Redirige al formulario para editar un usuario
 */
function editarUsuario(cedula) {
  window.location.href = `formulario.html?cedula=${cedula}`;
}

/**
 * Elimina un usuario
 */
function eliminarUsuario(cedula) {
  if (!confirm(`¿Estás seguro de eliminar al usuario con cédula ${cedula}?`)) {
    return;
  }

  deleteAPI(`usuarios.php?cedula=${cedula}`)
    .then((data) => {
      if (data.success) {
        alert("Usuario eliminado correctamente");
        cargarUsuarios();
      } else {
        alert("Error: " + data.mensaje);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al eliminar el usuario");
    });
}

/**
 * Prepara el formulario para crear o editar
 */
function prepararFormulario() {
  const params = new URLSearchParams(window.location.search);
  const cedula = params.get("cedula");

  if (cedula) {
    modoEdicion = true;
    document.getElementById("modo").value = "editar";
    document.getElementById("formTitle").textContent = "Editar Usuario";
    document.getElementById("btnGuardar").textContent = "Actualizar";
    document.getElementById("cedula").disabled = true;
    document.getElementById("passHelp").textContent =
      "Déjalo vacío si no quieres cambiar la contraseña";

    cargarUsuario(cedula);
  } else {
    modoEdicion = false;
    document.getElementById("formTitle").textContent = "Agregar Usuario";
    document.getElementById("btnGuardar").textContent = "Guardar";
    document.getElementById("cedula").disabled = false;
    document.getElementById("passHelp").textContent = "Mínimo 6 caracteres.";
    document.getElementById("contrasena").required = true;
  }
}

/**
 * Carga los datos de un usuario para editar
 */
function cargarUsuario(cedula) {
  getAPI(`usuarios.php?cedula=${cedula}`)
    .then((data) => {
      if (data.success && data.usuario) {
        const usuario = data.usuario;
        document.getElementById("cedula").value = usuario.cedula_usuario;
        document.getElementById("cedulaOriginal").value =
          usuario.cedula_usuario;
        document.getElementById("nombre").value = usuario.nombre;
        document.getElementById("apellido").value = usuario.apellido;
        document.getElementById("telefono").value = usuario.telefono;
        document.getElementById("rol").value = usuario.rol;
      } else {
        alert("Error al cargar el usuario: " + data.mensaje);
        window.location.href = "index.html";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al cargar el usuario");
      window.location.href = "index.html";
    });
}

/**
 * Guarda o actualiza un usuario
 */
function guardarUsuario(event) {
  event.preventDefault();

  const cedula = document.getElementById("cedula").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const rol = document.getElementById("rol").value;
  const contrasena = document.getElementById("contrasena").value.trim();
  const modo = document.getElementById("modo").value;

  const btn = document.getElementById("btnGuardar");

  if (!cedula || !nombre || !apellido || !telefono || !rol) {
    mostrarMensaje("Todos los campos son obligatorios", "error");
    return false;
  }

  if (modo === "crear" && (!contrasena || contrasena.length < 6)) {
    mostrarMensaje("La contraseña debe tener al menos 6 caracteres", "error");
    return false;
  }

  btn.disabled = true;
  btn.textContent = "Guardando...";
  ocultarMensaje();

  const datos = {
    cedula: cedula,
    nombre: nombre,
    apellido: apellido,
    telefono: telefono,
    rol: rol,
  };

  if (contrasena) {
    datos.contrasena = contrasena;
  }

  let metodo, endpoint;
  if (modo === "editar") {
    metodo = putAPI;
    endpoint = "usuarios.php";
  } else {
    metodo = postAPI;
    endpoint = "usuarios.php";
    if (!contrasena) {
      mostrarMensaje(
        "La contraseña es obligatoria para nuevos usuarios",
        "error",
      );
      btn.disabled = false;
      btn.textContent = "Guardar";
      return false;
    }
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
      mostrarMensaje("Error al guardar el usuario", "error");
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
