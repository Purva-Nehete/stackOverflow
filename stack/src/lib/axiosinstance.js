import axios from "axios";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
axiosInstance.interceptors.request.use((req) => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const token = JSON.parse(user).token;
        if (token) {
          req.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
  }
  return req;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !error.config?.url?.includes("/user/login") &&
      !error.config?.url?.includes("/user/signup")
    ) {
      localStorage.removeItem("user");
      if (window.location.pathname !== "/auth") {
        window.location.assign("/auth");
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
