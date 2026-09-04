import { useEffect, useState } from "react";
import { createContext } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { useContext } from "react";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored).token || null : null;
    }
    return null;
  });
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [loading, setloading] = useState(false);
  const [error, seterror] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const refreshSubscription = async () => {
    if (!token) {
      setSubscription(null);
      return null;
    }

    setSubscriptionLoading(true);
    try {
      const res = await axiosInstance.get("/subscription/me");
      setSubscription(res.data.data);
      return res.data.data;
    } catch (requestError) {
      setSubscription(null);
      return null;
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [token]);

  const Signup = async ({ name, email, password }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/signup", {
        name,
        email,
        password,
      });
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({...data,token}));
      setUser(data);
      setToken(token);
      toast.success("Signup Successful");
    } catch (error) {
      const msg = error.response?.data.message || "Signup failed";
      seterror(msg);
      toast.error(msg);
    }
  };
  const Login = async ({ email, password }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/login", {
        email,
        password,
      });
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({...data,token}));
      setUser(data);
      setToken(token);
      toast.success("Login Successful");
    } catch (error) {
      const msg = error.response?.data.message || "Login failed";
      seterror(msg);
      toast.error(msg);
    }
  };
  const Logout = () => {
    setUser(null);
    setToken(null);
    setSubscription(null);
    localStorage.removeItem("user");
    toast.info("Logged out");
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        subscription,
        subscriptionLoading,
        refreshSubscription,
        Signup,
        Login,
        Logout,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
