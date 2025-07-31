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

        // --- DEBUGGING LOGS ---
        console.log('API Request URL:', url);
        console.log('API Request Config:', config);
        // --- END DEBUGGING LOGS ---

        try {
            UI.showLoading(true);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                // Try to parse error data if available, otherwise use status text
                const errorText = await response.text();
                let errorData = {};
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // Not a JSON error, use the raw text
                }
                
                throw new Error(errorData.detail?.[0]?.msg || errorData.detail || errorText || `HTTP ${response.status}: ${response.statusText}`);
            }

            // MODIFIED: Conditionally parse JSON response
            const contentType = response.headers.get('content-type');
            if (response.status !== 204 && contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return data;
            } else {
                // For 204 No Content or responses without JSON body, return null or an empty object
                return null; 
            }
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

    async createDeviceOperation(operation) {
        const deviceId = operation.device_id;
        if (!deviceId) {
            console.error("device_id is missing from operation payload before API call:", operation);
            throw new Error("device_id is missing from operation payload for API call.");
        }
        
        const endpoint = `${CONFIG.ENDPOINTS.DEVICES}/${deviceId}/operations/`;
        
        console.log('DEBUG: createDeviceOperation - Constructed endpoint:', endpoint); 
        
        return this.request(endpoint, {
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

    async createBottleOperation(operation) {
        const bottleId = operation.bottle_id;
        if (!bottleId) {
            console.error("bottle_id is missing from operation payload before API call:", operation);
            throw new Error("bottle_id is missing from operation payload for API call.");
        }
        
        const endpoint = `${CONFIG.ENDPOINTS.BOTTLES}/${bottleId}/operations/`;

        console.log('DEBUG: createBottleOperation - Constructed endpoint:', endpoint); 
        
        return this.request(endpoint, {
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