import api from './api';

export const applicationService = {
  // Postuler à une offre
  createApplication: async (jobId, applicationData, resumeFile) => {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('coverLetter', applicationData.coverLetter || '');
    
    const response = await api.post(`/jobs/${jobId}/apply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Récupérer toutes les candidatures
  getAllApplications: async (params = {}) => {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  // Récupérer les candidatures par offre
  getApplicationsByJob: async (jobId, params = {}) => {
    const response = await api.get(`/jobs/${jobId}/applications`, { params });
    return response.data;
  },

  // Mettre à jour le statut d'une candidature
  updateApplicationStatus: async (id, status) => {
    const response = await api.put(`/applications/${id}/status`, { status });
    return response.data;
  },

  // Ajouter une note à une candidature
  addNoteToApplication: async (id, note) => {
    const response = await api.post(`/applications/${id}/notes`, { text: note });
    return response.data;
  },
};