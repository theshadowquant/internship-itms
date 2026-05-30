import api from './axios';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.patch('/users/profile', profileData);
  return response.data;
};

export const uploadAvatar = async (formData) => {
  const response = await api.post('/users/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getNotifications = async (params = {}) => {
  const response = await api.get('/users/notifications', { params });
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch('/users/notifications/read-all');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.patch(`/users/notifications/${id}/read`);
  return response.data;
};
