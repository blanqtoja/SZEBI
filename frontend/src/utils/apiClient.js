/**
 * API Client utility for authenticated requests with CSRF protection
 * Handles Django session authentication and CSRF tokens
 */

const API_BASE_URL = 'http://localhost:8000';

/**
 * Get CSRF token from cookies
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - The API endpoint (e.g., '/api/alert-rules/')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} - The fetch response
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        credentials: 'include', // Include cookies in request
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Add CSRF token for non-GET requests
    if (defaultOptions.method && defaultOptions.method !== 'GET') {
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            defaultOptions.headers['X-CSRFToken'] = csrfToken;
        }
    }

    return fetch(url, defaultOptions);
}

/**
 * Login with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise<object>} - User data if successful
 */
export async function login(username, password) {
    const response = await apiRequest('/api/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
        throw new Error('Login failed');
    }

    return response.json();
}

/**
 * Fetch alert rules
 * @returns {Promise<array>} - List of alert rules
 */
export async function fetchAlertRules() {
    const response = await apiRequest('/api/alert-rules/');
    
    if (!response.ok) {
        throw new Error('Failed to fetch alert rules');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.results || data.alerts || [];
}

/**
 * Create a new alert rule
 * @param {object} ruleData - Rule data
 * @returns {Promise<object>} - Created rule
 */
export async function createAlertRule(ruleData) {
    const response = await apiRequest('/api/alert-rules/', {
        method: 'POST',
        body: JSON.stringify(ruleData)
    });

    if (!response.ok) {
        throw new Error('Failed to create alert rule');
    }

    return response.json();
}

/**
 * Delete an alert rule
 * @param {number} ruleId - Rule ID
 * @returns {Promise<void>}
 */
export async function deleteAlertRule(ruleId) {
    const response = await apiRequest(`/api/alert-rules/${ruleId}/`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error('Failed to delete alert rule');
    }
}

/**
 * Fetch alerts
 * @returns {Promise<array>} - List of alerts
 */
export async function fetchAlerts() {
    const response = await apiRequest('/api/alerts/');
    
    if (!response.ok) {
        throw new Error('Failed to fetch alerts');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.results || data.alerts || [];
}

/**
 * Create a new alert manually
 * @param {object} alertData - Alert data (alert_rule_id, triggering_value, timestamp)
 * @returns {Promise<object>} - Created alert
 */
export async function createAlert(alertData) {
    const response = await apiRequest('/api/alerts/', {
        method: 'POST',
        body: JSON.stringify(alertData)
    });

    if (!response.ok) {
        throw new Error('Failed to create alert');
    }

    return response.json();
}

/**
 * Acknowledge an alert
 * @param {number} alertId - Alert ID
 * @param {string} comment - Optional comment
 * @returns {Promise<object>} - Response data
 */
export async function acknowledgeAlert(alertId, comment = null) {
    const body = comment ? { comment } : {};
    
    const response = await apiRequest(`/api/alerts/${alertId}/acknowledge/`, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
    }

    return response.json();
}

/**
 * Close an alert
 * @param {number} alertId - Alert ID
 * @param {string} comment - Optional comment
 * @returns {Promise<object>} - Response data
 */
export async function closeAlert(alertId, comment = null) {
    const body = comment ? { comment } : {};
    
    const response = await apiRequest(`/api/alerts/${alertId}/close/`, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error('Failed to close alert');
    }

    return response.json();
}

/**
 * Inspect data and check rules
 * @param {object} data - Data to inspect (metric_name, value, timestamp)
 * @returns {Promise<object>} - Response data
 */
export async function inspectData(data) {
    const response = await apiRequest('/api/data-inspection/check_rules/', {
        method: 'POST',
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Failed to inspect data');
    }

    return response.json();
}
