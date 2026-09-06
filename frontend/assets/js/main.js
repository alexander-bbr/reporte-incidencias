// Lógica principal (Navbar e Index.html)

document.addEventListener("DOMContentLoaded", async function () {
  // Verificar sesión (redirige al login si no está autenticado)
  const usuario = await verificarSesion(true);

  if (usuario) {
    // Mostrar información del usuario
    mostrarInfoUsuario(usuario);

    // Cargar estadísticas
    cargarEstadisticas();
  }
});

// Mostrar la información del usuario en la barra de navegación
function mostrarInfoUsuario(usuario) {
  const nombreUsuario = document.getElementById("nombreUsuario");
  const rolUsuario = document.getElementById("rolUsuario");
  const mensajeBienvenida = document.getElementById("mensajeBienvenida");

  if (nombreUsuario) {
    nombreUsuario.textContent = `${usuario.nombre} ${usuario.apellido}`;
  }

  if (rolUsuario) {
    rolUsuario.textContent = usuario.rol;
  }

  if (mensajeBienvenida) {
    mensajeBienvenida.textContent = `¡Bienvenido ${usuario.nombre}!, Selecciona un módulo para comenzar`;
  }

  // Ocultar módulos según rol (ejemplo: ADMISIONISTA no ve Usuarios)
  if (usuario.rol === "ADMISIONISTA") {
    const modulesGrid = document.querySelector(".modules-grid");
    if (modulesGrid) {
      const cards = modulesGrid.querySelectorAll(".module-card");
      // Ocultar el módulo de usuarios (última tarjeta)
      if (cards.length > 4) {
        cards[4].style.display = "none";
      }
    }
  }
}

// Cargar las estadísticas del dashboard
function cargarEstadisticas() {
  // Como aún no tenemos el endpoint de estadísticas,
  // usaremos datos de ejemplo o llamadas a los endpoints existentes

  // Cargar total de reportes
  getAPI("reportes.php")
    .then((data) => {
      if (data.success && data.reportes) {
        document.getElementById("totalReportes").textContent =
          data.reportes.length;
      }
    })
    .catch((error) => console.error("Error cargando reportes:", error));

  // Cargar total de equipos
  getAPI("equipos.php")
    .then((data) => {
      if (data.success && data.equipos) {
        document.getElementById("totalEquipos").textContent =
          data.equipos.length;
      }
    })
    .catch((error) => console.error("Error cargando equipos:", error));

  // Cargar total de fallas
  getAPI("fallas.php")
    .then((data) => {
      if (data.success && data.fallas) {
        document.getElementById("totalFallas").textContent = data.fallas.length;
      }
    })
    .catch((error) => console.error("Error cargando fallas:", error));

  // Cargar total de observaciones
  getAPI("observaciones.php")
    .then((data) => {
      if (data.success && data.observaciones) {
        document.getElementById("totalObservaciones").textContent =
          data.observaciones.length;
      }
    })
    .catch((error) => console.error("Error cargando observaciones:", error));

  // Cargar total de usuarios
  getAPI("usuarios.php")
    .then((data) => {
      if (data.success && data.usuarios) {
        document.getElementById("totalUsuarios").textContent =
          data.usuarios.length;
      }
    })
    .catch((error) => console.error("Error cargando usuarios:", error));
}
