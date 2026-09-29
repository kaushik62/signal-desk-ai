import axios from 'axios';

export const api = axios.create({ baseURL: '/api', withCredentials: true });
export const errMsg = (e) => e.response?.data?.error || 'Something went wrong. Try again.';
export const fieldErrors = (e) => e.response?.data?.errors || {};

// If the session expires while the app is open, send the user back to the login page.
api.interceptors.response.use(undefined, (error) => {
  const isAuthCall = error.config?.url?.startsWith('/auth');
  if (error.response?.status === 401 && !isAuthCall) window.location.assign('/login');
  return Promise.reject(error);
});
