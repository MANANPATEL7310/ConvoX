import client from './client.js';

export const submitFeedback = async (payload) => {
  const { data } = await client.post('/feedback', payload);
  return data;
};

export const getPublicFeedback = async () => {
  const { data } = await client.get('/feedback/public');
  return data;
};
