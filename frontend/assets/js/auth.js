/**
 * Autenticación - Login, Logout, Verificación de sesión
 */

// Clave para almacenar en localStorage
const SESSION_KEY = "usuario_incidencias";

/**
 * Prepara el header y la navegación lateral compartida.
 */
document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.querySelector(".navbar");
  const navBrand = document.querySelector(".nav-brand");

  if (!navbar || !navBrand) {
    return;
  }

  const header = document.createElement("header");
  header.className = "site-header";
  header.appendChild(navBrand.querySelector("h1"));
  document.body.prepend(header);

  const toggle = document.createElement("button");
  toggle.className = "menu-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Abrir navegación");
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "☰";
  document.body.appendChild(toggle);

  toggle.addEventListener("click", function () {
    const isOpen = navbar.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Cerrar navegación" : "Abrir navegación",
    );
    toggle.textContent = isOpen ? "×" : "☰";
  });

  navbar.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", function () {
      navbar.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir navegación");
      toggle.textContent = "☰";
    });
  });
});

/**
 * Inicia sesión del usuario
 */
function iniciarSesion(event) {
  event.preventDefault();

  const cedula = document.getElementById("cedula").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const btn = document.getElementById("btnLogin");
  const errorDiv = document.getElementById("mensaje-error");

  // Validar campos
  if (!cedula || !contrasena) {
    mostrarError("Por favor, completa todos los campos");
    return false;
  }

  // Deshabilitar botón y mostrar carga
  btn.textContent = "Iniciando sesión...";
  btn.disabled = true;
  ocultarError();

  // Llamar al backend
  postAPI("auth.php?action=login", {
    cedula: cedula,
    contrasena: contrasena,
  })
    .then((data) => {
      if (data.success) {
        // Guardar usuario en localStorage
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.usuario));

        // Redirigir al index principal
        window.location.href = "/reporte-incidencias/index.html";
      } else {
        mostrarError(data.mensaje || "Credenciales incorrectas");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      mostrarError("Error al conectar con el servidor");
    })
    .finally(() => {
      btn.textContent = "Iniciar Sesión";
      btn.disabled = false;
    });

  return false;
}

/**
 * Verifica si el usuario está autenticado
 * @param {boolean} redirect - Si debe redirigir al login cuando no está autenticado
 * @returns {Promise<object|null>} Datos del usuario o null
 */
function verificarSesion(redirect = true) {
  return new Promise((resolve) => {
    // Primero verificar en localStorage
    const usuarioLocal = localStorage.getItem(SESSION_KEY);

    if (!usuarioLocal) {
      if (redirect) {
        window.location.href = "frontend/login.html";
      }
      resolve(null);
      return;
    }

    // Verificar con el backend que la sesión sigue activa
    getAPI("auth.php?action=verificar")
      .then((data) => {
        if (data.success) {
          // Actualizar localStorage con datos frescos
          localStorage.setItem(SESSION_KEY, JSON.stringify(data.usuario));
          resolve(data.usuario);
        } else {
          // Sesión expirada en el backend
          localStorage.removeItem(SESSION_KEY);
          if (redirect) {
            window.location.href = "frontend/login.html";
          }
          resolve(null);
        }
      })
      .catch((error) => {
        console.error("Error verificando sesión:", error);
        // Si hay error, asumimos que no está autenticado
        localStorage.removeItem(SESSION_KEY);
        if (redirect) {
          window.location.href = "frontend/login.html";
        }
        resolve(null);
      });
  });
}

/**
 * Obtiene el usuario logueado desde localStorage
 * @returns {object|null} Datos del usuario o null
 */
function obtenerUsuarioLogueado() {
  const usuario = localStorage.getItem(SESSION_KEY);
  return usuario ? JSON.parse(usuario) : null;
}

/**
 * Cierra la sesión del usuario
 */
function cerrarSesion() {
  if (!confirm("¿Estás seguro de que quieres Cerrar la Sesión?")) {
    return;
  }

  // Llamar al backend para cerrar sesión
  getAPI("auth.php?action=logout")
    .then((data) => {
      if (data.success) {
        // Eliminar de localStorage
        localStorage.removeItem(SESSION_KEY);
        // Redirigir al login
        window.location.href = "frontend/login.html";
      } else {
        alert("Error al cerrar sesión: " + data.mensaje);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      // Forzar cierre local
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "frontend/login.html";
    });
}

/**
 * Muestra un mensaje de error en el formulario
 */
function mostrarError(mensaje) {
  const errorDiv = document.getElementById("mensaje-error");
  if (errorDiv) {
    errorDiv.textContent = mensaje;
    errorDiv.style.display = "block";
  }
}

/**
 * Oculta el mensaje de error
 */
function ocultarError() {
  const errorDiv = document.getElementById("mensaje-error");
  if (errorDiv) {
    errorDiv.style.display = "none";
  }
}

// Cerrar sesión con la tecla ESC (opcional)
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    // Si estamos en una página protegida y queremos cerrar sesión
    if (
      window.location.pathname.includes("index.html") &&
      !window.location.pathname.includes("login.html")
    ) {
      cerrarSesion();
    }
  }
});
