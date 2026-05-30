import api from './axios';

export const getStudentAnalytics = async () => {
  const response = await api.get('/analytics/student');
  return response.data;
};

export const getAdminAnalytics = async () => {
  const response = await api.get('/analytics/admin');
  return response.data;
};
