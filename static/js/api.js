import { CONFIG } from "./config.js";
import { UI } from "./ui.js";

/**
 * Generic API request handler.
 * This is a modified version of the apiRequest from api.js to include
 * the UI loading and error handling from api copy.js.
 * @param {string} url - The API endpoint URL.
 * @param {string} method - HTTP method (GET, POST, DELETE, PUT).
 * @param {Object} [data=null] - Data to send with POST and PUT requests.
 * @returns {Promise<Object|void>} - The JSON response or void for 204.
 * @throws {Error} - If the API request fails.
 */
async function apiRequest(url, method, data = null) {
  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  // --- DEBUGGING LOGS ---
  console.log("API Request URL:", url);
  console.log("API Request Config:", options);
  // --- END DEBUGGING LOGS ---

  try {
    UI.showLoading(true);
    const response = await fetch(url, options);

    if (!response.ok) {
      // Try to parse error data if available, otherwise use status text
      const errorText = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // Not a JSON error, use the raw text
      }
      const errorMessage =
        errorData.detail?.[0]?.msg ||
        errorData.detail ||
        errorText ||
        `HTTP ${response.status}: ${response.statusText}`;

      throw new Error(errorMessage);
    }

    // For 204 No Content, response.json() would throw an error
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    } else {
      return null;
    }
  } catch (error) {
    console.error("API Error:", error);
    UI.showToast(error.message, "error");
    throw error;
  } finally {
    UI.showLoading(false);
  }
}

// Device API methods
export const DeviceAPI = {
  async getDevices() {
    return apiRequest(CONFIG.ENDPOINTS.DEVICES, "GET");
  },

  async getDevice(id) {
    return apiRequest(`${CONFIG.ENDPOINTS.DEVICES}/${id}`, "GET");
  },

  async createDevice(device) {
    return apiRequest(CONFIG.ENDPOINTS.DEVICES, "POST", device);
  },

  async updateDevice(id, deviceUpdates) {
    return apiRequest(`${CONFIG.ENDPOINTS.DEVICES}/${id}`, "PUT", deviceUpdates);
  },

  async deleteDevice(id) {
    return apiRequest(`${CONFIG.ENDPOINTS.DEVICES}/${id}`, "DELETE");
  },

  async createDeviceOperation(operation) {
    const deviceId = operation.device_id;
    if (!deviceId) {
      console.error(
        "device_id is missing from operation payload before API call:",
        operation
      );
      throw new Error("device_id is missing from operation payload for API call.");
    }
    const endpoint = `${CONFIG.ENDPOINTS.DEVICES}/${deviceId}/operations/`;
    return apiRequest(endpoint, "POST", operation);
  },

  async deleteDeviceOperation(operationId) {
    return apiRequest(
      `${CONFIG.ENDPOINTS.DEVICES}/operations/${operationId}`,
      "DELETE"
    );
  },
};

// Bottle API methods
export const BottleAPI = {
  async getBottles() {
    return apiRequest(CONFIG.ENDPOINTS.BOTTLES, "GET");
  },

  async getBottle(id) {
    return apiRequest(`${CONFIG.ENDPOINTS.BOTTLES}/${id}`, "GET");
  },

  async createBottle(bottle) {
    return apiRequest(CONFIG.ENDPOINTS.BOTTLES, "POST", bottle);
  },

  async updateBottle(id, bottleUpdates) {
    return apiRequest(`${CONFIG.ENDPOINTS.BOTTLES}/${id}`, "PUT", bottleUpdates);
  },

  async deleteBottle(id) {
    return apiRequest(`${CONFIG.ENDPOINTS.BOTTLES}/${id}`, "DELETE");
  },

  async createBottleOperation(operation) {
    const bottleId = operation.bottle_id;
    if (!bottleId) {
      console.error(
        "bottle_id is missing from operation payload before API call:",
        operation
      );
      throw new Error("bottle_id is missing from operation payload for API call.");
    }
    const endpoint = `${CONFIG.ENDPOINTS.BOTTLES}/${bottleId}/operations/`;
    return apiRequest(endpoint, "POST", operation);
  },

  async deleteBottleOperation(operationId) {
    return apiRequest(
      `${CONFIG.ENDPOINTS.BOTTLES}/operations/${operationId}`,
      "DELETE"
    );
  },
};