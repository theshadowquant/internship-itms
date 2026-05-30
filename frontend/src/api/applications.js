import api from './axios';

export const applyToInternship = async (applicationData) => {
  const response = await api.post('/applications', applicationData);
  return response.data;
};

export const getMyApplications = async () => {
  const response = await api.get('/applications/mine');
  return response.data;
};

export const getAllApplications = async (params = {}) => {
  const response = await api.get('/applications', { params });
  return response.data;
};

export const getApplicationById = async (id) => {
  const response = await api.get(`/applications/${id}`);
  return response.data;
};

export const updateApplicationStatus = async (id, status, note) => {
  const response = await api.patch(`/applications/${id}/status`, { status, note });
  return response.data;
};

export const withdrawApplication = async (id) => {
  const response = await api.delete(`/applications/${id}`);
  return response.data;
};
