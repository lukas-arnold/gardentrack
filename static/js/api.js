const API = {
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            UI.showLoading(true);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            UI.showToast(error.message, 'error');
            throw error;
        } finally {
            UI.showLoading(false);
        }
    },

    // Device API methods
    async getDevices() {
        return this.request(CONFIG.ENDPOINTS.DEVICES);
    },

    async getDevice(id) {
        return this.request(`${CONFIG.ENDPOINTS.DEVICES}/${id}`);
    },

    async createDevice(device) {
        return this.request(CONFIG.ENDPOINTS.DEVICES, {
            method: 'POST',
            body: JSON.stringify(device)
        });
    },

    async deleteDevice(id) {
        return this.request(`${CONFIG.ENDPOINTS.DEVICES}/${id}`, {
            method: 'DELETE'
        });
    },

    async createDeviceOperation(deviceId, operation) {
        return this.request(`${CONFIG.ENDPOINTS.DEVICES}/${deviceId}/operations/`, {
            method: 'POST',
            body: JSON.stringify(operation)
        });
    },

    async deleteDeviceOperation(operationId) {
        return this.request(`${CONFIG.ENDPOINTS.DEVICES}/operations/${operationId}`, {
            method: 'DELETE'
        });
    },

    // Bottle API methods
    async getBottles() {
        return this.request(CONFIG.ENDPOINTS.BOTTLES);
    },

    async getBottle(id) {
        return this.request(`${CONFIG.ENDPOINTS.BOTTLES}/${id}`);
    },

    async createBottle(bottle) {
        return this.request(CONFIG.ENDPOINTS.BOTTLES, {
            method: 'POST',
            body: JSON.stringify(bottle)
        });
    },

    async deleteBottle(id) {
        return this.request(`${CONFIG.ENDPOINTS.BOTTLES}/${id}`, {
            method: 'DELETE'
        });
    },

    async createBottleOperation(bottleId, operation) {
        return this.request(`${CONFIG.ENDPOINTS.BOTTLES}/${bottleId}/operations/`, {
            method: 'POST',
            body: JSON.stringify(operation)
        });
    },

    async deleteBottleOperation(operationId) {
        return this.request(`${CONFIG.ENDPOINTS.BOTTLES}/operations/${operationId}`, {
            method: 'DELETE'
        });
    }
};