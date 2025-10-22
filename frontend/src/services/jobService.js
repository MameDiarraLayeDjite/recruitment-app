import api from './api';

export const jobService = {
  // Créer une offre d'emploi
  createJob: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  // Récupérer toutes les offres
  getAllJobs: async (params = {}) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },

  // Récupérer une offre par ID
  getJobById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  // Mettre à jour une offre
  updateJob: async (id, jobData) => {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response.data;
  },

  // Supprimer une offre (soft delete)
  deleteJob: async (id) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  // Publier une offre
  publishJob: async (id) => {
    const response = await api.post(`/jobs/${id}/publish`);
    return response.data;
  },

  // Fermer une offre
  closeJob: async (id) => {
    const response = await api.post(`/jobs/${id}/close`);
    return response.data;
  },
};