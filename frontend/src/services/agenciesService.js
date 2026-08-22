import api from './api';

export const agenciesService = {
  // Get all agencies with search and filters
  getAgencies: async (params = {}) => {
    const response = await api.get('/agencies', { params });
    return response.data;
  },

  // Get single agency profile and stats
  getAgencyDetails: async (id) => {
    const response = await api.get(`/agencies/${id}`);
    return response.data;
  },

  // Create new travel agency + optional admin user
  createAgency: async (data) => {
    const response = await api.post('/agencies', data);
    return response.data;
  },

  // Update existing agency
  updateAgency: async (id, data) => {
    const response = await api.put(`/agencies/${id}`, data);
    return response.data;
  },

  // Delete agency
  deleteAgency: async (id) => {
    const response = await api.delete(`/agencies/${id}`);
    return response.data;
  },

  // Super Admin platform statistics
  getPlatformStats: async () => {
    const response = await api.get('/agencies/stats/overview');
    return response.data;
  }
};
