import axios from "axios";

axios.defaults.withCredentials = true;

export const config = {
  baseURL: "https://expo-reactnative-backend.onrender.com"
  // baseURL: "https://my-academy-backend.vercel.app/api",
};
const axiosInstance = axios.create(config);

export default axiosInstance;
