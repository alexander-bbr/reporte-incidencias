/**
 * API base para llamar al backend
 */

// Usar ruta relativa desde la raíz del proyecto
const API_BASE = "/reporte-incidencias/backend/api/";

/**
 * Realiza una petición fetch al backend
 * @param {string} endpoint - Endpoint de la API
 * @param {object} options - Opciones de fetch
 * @returns {Promise} Promesa con la respuesta
 */
function llamarAPI(endpoint, options = {}) {
  const url = API_BASE + endpoint;

  console.log("Llamando a:", url);

  // Configuración por defecto
  const config = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  // Convertir body a JSON si es un objeto y el método no es GET
  if (
    options.body &&
    typeof options.body === "object" &&
    options.method !== "GET"
  ) {
    config.body = JSON.stringify(options.body);
  }

  return fetch(url, config)
    .then((response) => {
      console.log("Status de respuesta:", response.status);

      // Verificar si la respuesta es OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        // Si no es JSON, leer como texto para debug
        return response.text().then((text) => {
          console.error("Respuesta NO es JSON. Primeros 200 caracteres:");
          console.error(text.substring(0, 200));
          throw new Error(
            "El servidor no devolvió JSON válido. Revisa los logs de PHP.",
          );
        });
      }
    })
    .catch((error) => {
      console.error("Error en la petición:", error);
      return {
        success: false,
        mensaje: "Error de conexión con el servidor: " + error.message,
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
