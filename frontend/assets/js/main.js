/**
 * JavaScript principal para la página index.html
 */

document.addEventListener("DOMContentLoaded", async function () {
  // Verificar sesión (redirige al login si no está autenticado)
  const usuario = await verificarSesion(true);

  if (usuario) {
    // Mostrar información del usuario
    mostrarInfoUsuario(usuario);

    // Cargar estadísticas
    cargarEstadisticas();

    // Cargar actividad reciente
    cargarActividadReciente();
  }
});

/**
 * Muestra la información del usuario en la barra de navegación
 */
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
    mensajeBienvenida.textContent = `Bienvenido, ${usuario.nombre}! ¿Qué deseas hacer hoy?`;
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

/**
 * Carga las estadísticas del dashboard
 */
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

/**
 * Carga la actividad reciente (últimos reportes)
 */
function cargarActividadReciente() {
  getAPI("reportes.php?limit=5")
    .then((data) => {
      const container = document.getElementById("ultimosReportes");

      if (data.success && data.reportes && data.reportes.length > 0) {
        let html = "<ul>";
        data.reportes.forEach((reporte) => {
          const fecha = new Date(reporte.fecha_creacion).toLocaleDateString(
            "es-ES",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          );

          html += `
                        <li>
                            <span class="activity-icon">📌</span>
                            <div>
                                <strong>${reporte.titulo || "Sin título"}</strong>
                                <p>${reporte.descripcion ? reporte.descripcion.substring(0, 100) + "..." : "Sin descripción"}</p>
                                <small>${fecha}</small>
                            </div>
                            <span class="badge badge-${(reporte.estado || "pendiente").toLowerCase().replace(" ", "_")}">
                                ${reporte.estado || "PENDIENTE"}
                            </span>
                        </li>
                    `;
        });
        html += "</ul>";
        container.innerHTML = html;
      } else {
        container.innerHTML =
          '<p class="text-muted">No hay reportes recientes</p>';
      }
    })
    .catch((error) => {
      console.error("Error cargando actividad reciente:", error);
      document.getElementById("ultimosReportes").innerHTML =
        '<p class="text-muted">Error al cargar la actividad</p>';
    });
}
