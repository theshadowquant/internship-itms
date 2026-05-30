import api from './axios';

export const createDailyLog = async (logData) => {
  const response = await api.post('/daily-logs', logData);
  return response.data;
};

export const getMyDailyLogs = async (params = {}) => {
  const response = await api.get('/daily-logs/mine', { params });
  return response.data;
};

export const getAllDailyLogs = async (params = {}) => {
  const response = await api.get('/daily-logs', { params });
  return response.data;
};

export const updateDailyLog = async (id, logData) => {
  const response = await api.patch(`/daily-logs/${id}`, logData);
  return response.data;
};

export const deleteDailyLog = async (id) => {
  const response = await api.delete(`/daily-logs/${id}`);
  return response.data;
};

export const approveDailyLog = async (id, supervisorNote) => {
  const response = await api.patch(`/daily-logs/${id}/approve`, { supervisorNote });
  return response.data;
};

export const rejectDailyLog = async (id, supervisorNote) => {
  const response = await api.patch(`/daily-logs/${id}/reject`, { supervisorNote });
  return response.data;
};

export const exportDailyLogsCSV = async () => {
  const response = await api.get('/daily-logs/export', { responseType: 'blob' });
  return response.data; // Returns Blob file for browser download
};
