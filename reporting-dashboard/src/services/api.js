import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

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
  getArchivedWeeks: () => api.get('/reports/archived/weeks'),
};

// Reports API
export const reportsAPI = {
  getPDF: (period, startDate, endDate, type) => {
    const params = new URLSearchParams({ period, startDate, endDate, type });
    window.open(`${API_BASE_URL}/reports/pdf?${params}`, '_blank');
  },
  getExcel: (period, startDate, endDate, type) => {
    const params = new URLSearchParams({ period, startDate, endDate, type });
    window.open(`${API_BASE_URL}/reports/excel?${params}`, '_blank');
  },
  getSummary: (period, startDate, endDate) =>
    api.get('/reports/summary', {
      params: { period, startDate, endDate },
    }),
  getArchivedReports: () => api.get('/reports/archived'),
  getArchivedWeeks: () => api.get('/reports/archived/weeks'),
  downloadArchivedWeek: (weekKey) => {
    const encodedWeekKey = encodeURIComponent(weekKey);
    window.open(`${API_BASE_URL}/reports/archived/week/${encodedWeekKey}`, '_blank');
  },
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;