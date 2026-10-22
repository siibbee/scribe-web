import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const API = axios.create({
  baseURL: `${BACKEND_URL}/api/auth`,
});

export const loginUser = (email, password) => {
  return API.post("/login", {
    email,
    password,
  });
};

export const registerUser = (email, username, password) => {
  return API.post("/register", {
    email,
    username,
    password,
  });
};