import axiosInstance from './axiosInstance';

export const getUsers = async () => {
  const res = await axiosInstance.get('/messages/users');
  return res.data;
};

export const getMessages = async (userId) => {
  const res = await axiosInstance.get(`/messages/${userId}`);
  return res.data;
};

export const sendMessage = async (userId, text, imageFile) => {
  const formData = new FormData();
  if (text) formData.append('text', text);
  if (imageFile) formData.append('image', imageFile);

  const res = await axiosInstance.post(`/messages/send/${userId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};


export const deleteMessage = async (messageId) => {
  const res = await axiosInstance.delete(`/messages/${messageId}`);
  return res.data;
};

export const editMessage = async (messageId, text) => {
  const res = await axiosInstance.put(`/messages/${messageId}`, { text });
  return res.data;
};