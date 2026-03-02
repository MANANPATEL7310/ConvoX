import client from './client.js';

export const getScheduledMeetings = async () => {
  const { data } = await client.get('/schedule');
  return data;
};

export const createScheduledMeeting = async (payload) => {
  const { data } = await client.post('/schedule', payload);
  return data;
};

export const updateScheduledMeeting = async (meetingId, payload) => {
  const { data } = await client.put(`/schedule/${meetingId}`, payload);
  return data;
};

export const deleteScheduledMeeting = async (meetingId, reason = '') => {
  const { data } = await client.delete(`/schedule/${meetingId}`, { data: { reason } });
  return data;
};

// Also handles fetching basic past history
export const getMeetingHistory = async () => {
    // Falls back to the /users namespace since that's where get_history is
    const { data } = await client.get('/users/get_history');
    return data;
};

export const sendMeetingInvites = async (payload) => {
  const { data } = await client.post('/invite/send', payload);
  return data;
};

export const generateSFUToken = async (payload) => {
  // Bypasses the /v1 root client slightly if the backend has different mounting
  // The client mounts to `/api/v1`. The SFU route is `/api/v1/livekit/token`
  const { data } = await client.post('/livekit/token', payload);
  return data;
};
