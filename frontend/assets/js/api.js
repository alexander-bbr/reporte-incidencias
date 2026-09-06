/**
 * API base para llamar al backend
 */

const API_BASE = "../../backend/api/";

/**
 * Realiza una petición fetch al backend
 * @param {string} endpoint - Endpoint de la API
 * @param {object} options - Opciones de fetch
 * @returns {Promise} Promesa con la respuesta
 */
function llamarAPI(endpoint, options = {}) {
  const url = API_BASE + endpoint;

  // Configuración por defecto
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  // Convertir body a JSON si es un objeto
  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  return fetch(url, config)
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error en la petición:", error);
      return {
        success: false,
        mensaje: "Error de conexión con el servidor",
      };
    });
}

/**
 * Realiza una petición GET
 */
function getAPI(endpoint) {
  return llamarAPI(endpoint, { method: "GET" });
}

/**
 * Realiza una petición POST
 */
function postAPI(endpoint, data) {
  return llamarAPI(endpoint, {
    method: "POST",
    body: data,
  });
}

/**
 * Realiza una petición PUT
 */
function putAPI(endpoint, data) {
  return llamarAPI(endpoint, {
    method: "PUT",
    body: data,
  });
}

/**
 * Realiza una petición DELETE
 */
function deleteAPI(endpoint) {
  return llamarAPI(endpoint, { method: "DELETE" });
}
