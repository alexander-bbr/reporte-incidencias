/**
 * Sistema de permisos por rol
 */

const PERMISOS = {
  SISTEMAS: {
    reportes: { ver: true, crear: false, eliminar: false, editar: "parcial" },
    equipos: { ver: true, crear: true, eliminar: true, editar: true },
    fallas: { ver: true, crear: true, eliminar: true, editar: true },
    observaciones: { ver: true, crear: true, eliminar: true, editar: true },
    usuarios: { ver: false, crear: false, eliminar: false, editar: false },
    auditoria: { ver: false, crear: false, eliminar: false, editar: false },
  },
  COORDINADORA: {
    reportes: { ver: true, crear: true, eliminar: true, editar: "parcial" },
    equipos: { ver: true, crear: true, eliminar: true, editar: true },
    fallas: { ver: true, crear: true, eliminar: true, editar: true },
    observaciones: { ver: true, crear: true, eliminar: true, editar: true },
    usuarios: { ver: true, crear: true, eliminar: true, editar: true },
    auditoria: { ver: true, crear: false, eliminar: false, editar: false },
  },
  ADMISIONISTA: {
    reportes: { ver: true, crear: true, eliminar: true, editar: "parcial" },
    equipos: { ver: true, crear: true, eliminar: true, editar: true },
    fallas: { ver: true, crear: true, eliminar: true, editar: true },
    observaciones: { ver: true, crear: true, eliminar: true, editar: true },
    usuarios: { ver: false, crear: false, eliminar: false, editar: false },
    auditoria: { ver: false, crear: false, eliminar: false, editar: false },
  },
};

/**
 * Verifica si el usuario actual puede acceder a un módulo
 */
function tienePermiso(modulo, accion = "ver") {
  const usuario = obtenerUsuarioLogueado();
  if (!usuario) return false;

  const permisosRol = PERMISOS[usuario.rol];
  if (!permisosRol) return false;

  const permisosModulo = permisosRol[modulo];
  if (!permisosModulo) return false;

  return (
    permisosModulo[accion] === true || permisosModulo[accion] === "parcial"
  );
}

/**
 * Redirige al inicio si no tiene permiso para el módulo
 */
function protegerModulo(modulo) {
  if (!tienePermiso(modulo, "ver")) {
    alert("No tienes permisos para acceder a este módulo");
    window.location.href = "../../../index.html";
  }
}

/**
 * Aplica los permisos visuales a la navbar
 */
function aplicarPermisosNavbar() {
  const usuario = obtenerUsuarioLogueado();
  if (!usuario) return;

  const permisosRol = PERMISOS[usuario.rol];
  if (!permisosRol) return;

  const selectores = {
    reportes: 'a[href*="reportes/index.html"]',
    equipos: 'a[href*="equipos/index.html"]',
    fallas: 'a[href*="fallas/index.html"]',
    observaciones: 'a[href*="observaciones/index.html"]',
    usuarios: 'a[href*="usuarios/index.html"]',
    auditoria: 'a[href*="auditoria/index.html"]',
  };

  Object.keys(selectores).forEach((modulo) => {
    const link = document.querySelector(selectores[modulo]);
    if (link && !permisosRol[modulo].ver) {
      link.parentElement.style.display = "none";
    }
  });
}

/**
 * Aplica los permisos a las tarjetas del index.html raíz
 */
function aplicarPermisosTarjetas() {
  const usuario = obtenerUsuarioLogueado();
  if (!usuario) return;

  const permisosRol = PERMISOS[usuario.rol];
  if (!permisosRol) return;

  const selectores = {
    reportes: '.module-card[onclick*="reportes"]',
    equipos: '.module-card[onclick*="equipos"]',
    fallas: '.module-card[onclick*="fallas"]',
    observaciones: '.module-card[onclick*="observaciones"]',
    usuarios: '.module-card[onclick*="usuarios"]',
    auditoria: '.module-card[onclick*="auditoria"]',
  };

  Object.keys(selectores).forEach((modulo) => {
    const card = document.querySelector(selectores[modulo]);
    if (card && !permisosRol[modulo].ver) {
      card.style.display = "none";
    }
  });
}
