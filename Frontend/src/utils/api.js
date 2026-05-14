import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL; // e.g., ...onrender.com/api
// Your request should end up being: ${API_URL}/auth/register

const api = axios.create({
  baseURL: API_URL,  // This adds the missing /api
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cf_token");
  if (token) { 
    config.headers.Authorization = `Bearer ${token}`;
  } 
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("cf_token");
      localStorage.removeItem("cf_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;