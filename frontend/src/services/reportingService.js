import api from './api';

export const reportingService = {
  // Exporter les candidatures en CSV
  exportApplicationsCSV: async (params = {}) => {
    const response = await api.get('/reports/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Récupérer les métriques du pipeline
  getPipelineMetrics: async () => {
    const response = await api.get('/reports/pipeline');
    return response.data;
  },
};