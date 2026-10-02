// Lógica principal (Navbar e Index.html)

document.addEventListener("DOMContentLoaded", async function () {
  // Verificar sesión (redirige al login si no está autenticado)
  const usuario = await verificarSesion(true);

  if (usuario) {
    // Mostrar información del usuario
    mostrarInfoUsuario(usuario);

    // Aplicar permisos visuales
    aplicarPermisosNavbar();
    aplicarPermisosTarjetas();

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
}

// Cargar las estadísticas del dashboard
function cargarEstadisticas() {
  // Cargar total de reportes
  getAPI("reportes.php")
    .then((data) => {
      if (data.success && data.reportes) {
        const totalReportes = document.getElementById("totalReportes");
        if (totalReportes) totalReportes.textContent = data.reportes.length;
      }
    })
    .catch((error) => console.error("Error cargando reportes:", error));

  // Cargar total de equipos
  getAPI("equipos.php")
    .then((data) => {
      if (data.success && data.equipos) {
        const totalEquipos = document.getElementById("totalEquipos");
        if (totalEquipos) totalEquipos.textContent = data.equipos.length;
      }
    })
    .catch((error) => console.error("Error cargando equipos:", error));

  // Cargar total de fallas
  getAPI("fallas.php")
    .then((data) => {
      if (data.success && data.fallas) {
        const totalFallas = document.getElementById("totalFallas");
        if (totalFallas) totalFallas.textContent = data.fallas.length;
      }
    })
    .catch((error) => console.error("Error cargando fallas:", error));

  // Cargar total de observaciones
  getAPI("observaciones.php")
    .then((data) => {
      if (data.success && data.observaciones) {
        const totalObservaciones =
          document.getElementById("totalObservaciones");
        if (totalObservaciones)
          totalObservaciones.textContent = data.observaciones.length;
      }
    })
    .catch((error) => console.error("Error cargando observaciones:", error));

  // Cargar total de usuarios (solo si tiene permiso)
  if (tienePermiso("usuarios", "ver")) {
    getAPI("usuarios.php")
      .then((data) => {
        if (data.success && data.usuarios) {
          const totalUsuarios = document.getElementById("totalUsuarios");
          if (totalUsuarios) totalUsuarios.textContent = data.usuarios.length;
        }
      })
      .catch((error) => console.error("Error cargando usuarios:", error));
  }

  // Cargar total de auditoría (solo si tiene permiso)
  if (tienePermiso("auditoria", "ver")) {
    getAPI("auditoria.php")
      .then((data) => {
        if (data.success && data.auditorias) {
          const totalAuditoria = document.getElementById("totalAuditoria");
          if (totalAuditoria)
            totalAuditoria.textContent = data.auditorias.length;
        }
      })
      .catch((error) => console.error("Error cargando auditoría:", error));
  }
}
