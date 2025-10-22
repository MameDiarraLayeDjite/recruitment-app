import api from './api';

export const notificationService = {
  // Récupérer les notifications
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  // Marquer comme lu
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Marquer toutes comme lues
  markAllAsRead: async () => {
    // Implémentation si l'API le supporte
    // Sinon, on marque une par une côté client
  },
};