import api from './axios';

export const getInternships = async (params = {}) => {
  const response = await api.get('/internships', { params });
  return response.data;
};

export const getRecommendedInternships = async () => {
  const response = await api.get('/internships/recommended');
  return response.data;
};

export const getInternshipById = async (id) => {
  const response = await api.get(`/internships/${id}`);
  return response.data;
};

export const createInternship = async (internshipData) => {
  const response = await api.post('/internships', internshipData);
  return response.data;
};

export const updateInternship = async (id, internshipData) => {
  const response = await api.patch(`/internships/${id}`, internshipData);
  return response.data;
};

export const deleteInternship = async (id) => {
  const response = await api.delete(`/internships/${id}`);
  return response.data;
};
