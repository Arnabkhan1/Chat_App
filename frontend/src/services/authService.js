import axiosInstance from './axiosInstance';

export const signup = async (username, email, password) => {
  const res = await axiosInstance.post('/auth/signup', { username, email, password });
  return res.data;
};

export const login = async (email, password) => {
  const res = await axiosInstance.post('/auth/login', { email, password });
  return res.data;
};