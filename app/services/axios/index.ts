import axios from "axios";

axios.defaults.withCredentials = true;

export const config = {
  // baseURL: "http://192.168.1.5:3001"
  baseURL: "https://expo-reactnative-backend.onrender.com"
};
const axiosInstance = axios.create(config);

export default axiosInstance;
