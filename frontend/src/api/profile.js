import client from './client.js';

export const getProfile = async () => {
  const { data } = await client.get('/users/profile');
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await client.put('/users/profile', profileData);
  return data;
};

export const updatePassword = async (passwordData) => {
  const { data } = await client.put('/users/password', passwordData);
  return data;
};

export const getNotifications = async () => {
  const { data } = await client.get('/notifications');
  return data;
};

export const markNotificationsRead = async () => {
  const { data } = await client.post('/notifications/mark-read', {});
  return data;
};
