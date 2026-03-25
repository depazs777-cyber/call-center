// public/js/api.js

// dynamically build the API base URL based on the current path to support subdirectories
let basePath = window.location.pathname.replace(/\/public\/index\.html$/, '');
// Remove trailing slash if it exists
if (basePath.endsWith('/')) {
    basePath = basePath.slice(0, -1);
}
// Remove any hash or query parameters from the pathname check
basePath = basePath.split('#')[0].split('?')[0];

const API_BASE_URL = basePath + '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('jwt_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const apiFetch = async (endpoint, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    };

    if (options.body && options.body instanceof FormData) {
        // fetch automatically sets content-type with boundary for FormData
        delete defaultHeaders['Content-Type'];
    }

    const config = {
        method: options.method || 'GET',
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle 204 No Content
        if (response.status === 204) return null;

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_data');
                window.location.hash = '#login';
                return Promise.reject(new Error('Session expired'));
            }
            throw new Error(data.error || 'API Error');
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

const api = {
    login: (credentials) => apiFetch('/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getSettings: () => apiFetch('/settings'),
    updateSettings: (settings) => apiFetch('/settings', { method: 'POST', body: JSON.stringify(settings) }),
    getUsers: () => apiFetch('/users'),
    createUser: (user) => apiFetch('/users', { method: 'POST', body: JSON.stringify(user) }),
    updateUser: (user) => apiFetch('/users', { method: 'PUT', body: JSON.stringify(user) }),
    deleteUser: (id) => apiFetch(`/users?id=${id}`, { method: 'DELETE' }),
    getCampaigns: () => apiFetch('/campaigns'),
    createCampaign: (campaign) => apiFetch('/campaigns', { method: 'POST', body: JSON.stringify(campaign) }),
    getProspects: (campaignId, searchStr = '') => {
        let url = '/prospects?';
        if (campaignId) url += `campaign_id=${campaignId}&`;
        if (searchStr) url += `search=${encodeURIComponent(searchStr)}&`;
        return apiFetch(url);
    },
    uploadCSV: (formData) => apiFetch('/prospects/upload-csv', { method: 'POST', body: formData }),
    getScript: (campaignId) => apiFetch(`/scripts?campaign_id=${campaignId}`),
    saveScript: (data) => apiFetch('/scripts', { method: 'POST', body: JSON.stringify(data) }),
    startCall: (prospectId) => apiFetch('/calls/start', { method: 'POST', body: JSON.stringify({ prospect_id: prospectId }) }),
    endCall: (formData) => apiFetch('/calls/end', { method: 'POST', body: formData }),
    getCallHistory: () => apiFetch('/calls/history')
};
