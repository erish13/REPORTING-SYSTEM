import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto logout on unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// helper for browser download
const saveBlob = (blob, filename, mimeType) => {
  const fileBlob = new Blob([blob], { type: mimeType });
  const url = window.URL.createObjectURL(fileBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (otp, password) => api.post('/auth/reset-password', { otp, password }),
};

// Records API
export const recordsAPI = {
  getAll: () => api.get('/records'),
  getById: (id) => api.get(`/records/${id}`),
  create: (data) => api.post('/records', data),
  update: (id, data) => api.put(`/records/${id}`, data),
  delete: (id) => api.delete(`/records/${id}`),
  filter: (period, startDate, endDate, type) =>
    api.get('/records/filter/query', {
      params: { period, startDate, endDate, type },
    }),
  getSummary: () => api.get('/records/summary/stats'),
};

// Reports API
export const reportsAPI = {
  // ✅ Preview mode: return the PDF blob (component will create blob URL)
  getPDF: async (period, startDate = '', endDate = '') => {
    console.log('getPDF called with:', { period, startDate, endDate });
    const response = await api.get('/reports/pdf', {
      params: { period, startDate, endDate },
      responseType: 'blob',
      timeout: 60000,
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      let message = `PDF request failed (${response.status})`;
      try {
        const text = await response.data.text();
        if (text) message = text;
      } catch (_) {}
      throw new Error(message);
    }

    if (!response.data || response.data.size === 0) {
      throw new Error('Empty PDF file received');
    }

    // ✅ return blob for preview
    return response.data;
  },

  // keep your existing getExcel/getSummary/getArchived... functions unchanged
  getExcel: async (period, startDate = '', endDate = '', type = '') => {
    console.log('getExcel called with:', { period, startDate, endDate, type });
    const response = await api.get('/reports/excel', {
      params: { period, startDate, endDate, type },
      responseType: 'blob',
      validateStatus: () => true, // (you may keep this, but optional)
    });

    if (response.status !== 200) {
      let message = `Excel request failed (${response.status})`;
      try {
        const text = await response.data.text();
        if (text) message = text;
      } catch (_) {}
      throw new Error(message);
    }

    if (!response.data || response.data.size === 0) {
      throw new Error('Empty Excel file received');
    }

    saveBlob(
      response.data,
      `report-${period || 'custom'}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    return true;
  },

  getSummary: (period, startDate, endDate) =>
    api.get('/reports/summary', {
      params: { period, startDate, endDate },
    }),

  getArchivedReports: () => api.get('/reports/archived'),
  getArchivedWeeks: () => api.get('/reports/archived/weeks'),

  downloadArchivedWeek: async (weekKey) => {
    const response = await api.get(`/reports/archived/week/${encodeURIComponent(weekKey)}`, {
      responseType: 'blob',
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      let message = `Archived download failed (${response.status})`;
      try {
        const text = await response.data.text();
        if (text) message = text;
      } catch (_) {}
      throw new Error(message);
    }

    if (!response.data || response.data.size === 0) {
      throw new Error('Empty archived file received');
    }

    saveBlob(response.data, `archived-week-${weekKey}.pdf`, 'application/pdf');
    return true;
  },
};

export const healthCheck = () => api.get('/health');

export default api;
