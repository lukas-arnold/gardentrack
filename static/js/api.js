import { CONFIG } from "./config.js";
import { UI } from "./ui.js";

/**
 * Generic API request handler.
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

/**
 * Device API methods to interact with the device-related endpoints.
 * @namespace DeviceAPI
 */
export const DeviceAPI = {
  /**
   * Retrieves all devices.
   * @returns {Promise<Array<Object>>} A list of device objects.
   */
  async getDevices() {
    return apiRequest(CONFIG.ENDPOINTS.DEVICES, "GET");
  },

  /**
   * Retrieves a single device by its ID.
   * @param {number} id - The ID of the device.
   * @returns {Promise<Object>} The device object.
   */
  async getDevice(id) {
    return apiRequest(`${CONFIG.ENDPOINTS.DEVICES}/${id}`, "GET");
  },

  /**
   * Creates a new device.
   * @param {Object} device - The device data to create.
   * @returns {Promise<Object>} The newly created device object.
   */
  async createDevice(device) {
    return apiRequest(CONFIG.ENDPOINTS.DEVICES, "POST", device);
  },

  /**
   * Updates an existing device.
   * @param {number} id - The ID of the device to update.
   * @param {Object} deviceUpdates - The data to update the device with.
   * @returns {Promise<Object>} The updated device object.
   */
  async updateDevice(id, deviceUpdates) {
    return apiRequest(`${CONFIG.ENDPOINTS.DEVICES}/${id}`, "PUT", deviceUpdates);
  },

  /**
   * Deletes a device by its ID.
   * @param {number} id - The ID of the device to delete.
   * @returns {Promise<void>}
   */
  async deleteDevice(id) {
    return apiRequest(`${CONFIG.ENDPOINTS.DEVICES}/${id}`, "DELETE");
  },

  /**
   * Creates an operation for a specific device.
   * @param {Object} operation - The operation data, including a `device_id`.
   * @returns {Promise<Object>} The newly created operation object.
   */
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

  /**
   * Deletes a device operation by its ID.
   * @param {number} operationId - The ID of the operation to delete.
   * @returns {Promise<void>}
   */
  async deleteDeviceOperation(operationId) {
    return apiRequest(
      `${CONFIG.ENDPOINTS.DEVICES}/operations/${operationId}`,
      "DELETE"
    );
  },
};

/**
 * Bottle API methods to interact with the bottle-related endpoints.
 * @namespace BottleAPI
 */
export const BottleAPI = {
  /**
   * Retrieves all bottles.
   * @returns {Promise<Array<Object>>} A list of bottle objects.
   */
  async getBottles() {
    return apiRequest(CONFIG.ENDPOINTS.BOTTLES, "GET");
  },

  /**
   * Retrieves a single bottle by its ID.
   * @param {number} id - The ID of the bottle.
   * @returns {Promise<Object>} The bottle object.
   */
  async getBottle(id) {
    return apiRequest(`${CONFIG.ENDPOINTS.BOTTLES}/${id}`, "GET");
  },

  /**
   * Creates a new bottle.
   * @param {Object} bottle - The bottle data to create.
   * @returns {Promise<Object>} The newly created bottle object.
   */
  async createBottle(bottle) {
    return apiRequest(CONFIG.ENDPOINTS.BOTTLES, "POST", bottle);
  },

  /**
   * Updates an existing bottle.
   * @param {number} id - The ID of the bottle to update.
   * @param {Object} bottleUpdates - The data to update the bottle with.
   * @returns {Promise<Object>} The updated bottle object.
   */
  async updateBottle(id, bottleUpdates) {
    return apiRequest(`${CONFIG.ENDPOINTS.BOTTLES}/${id}`, "PUT", bottleUpdates);
  },

  /**
   * Deletes a bottle by its ID.
   * @param {number} id - The ID of the bottle to delete.
   * @returns {Promise<void>}
   */
  async deleteBottle(id) {
    return apiRequest(`${CONFIG.ENDPOINTS.BOTTLES}/${id}`, "DELETE");
  },

  /**
   * Creates an operation for a specific bottle.
   * @param {Object} operation - The operation data, including a `bottle_id`.
   * @returns {Promise<Object>} The newly created operation object.
   */
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

  /**
   * Deletes a bottle operation by its ID.
   * @param {number} operationId - The ID of the operation to delete.
   * @returns {Promise<void>}
   */
  async deleteBottleOperation(operationId) {
    return apiRequest(
      `${CONFIG.ENDPOINTS.BOTTLES}/operations/${operationId}`,
      "DELETE"
    );
  },
};