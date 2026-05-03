import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "rrushikeshargade@gmail.com";
axios.defaults.baseURL = API;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("authToken") || null);
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // ✅ AXIOS INTERCEPTOR - Add token to all requests
    useEffect(() => {
        const interceptor = axios.interceptors.request.use((config) => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        return () => {
            axios.interceptors.request.eject(interceptor);
        };
    }, [token]);

    // ✅ Check if user is still logged in on mount
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const { data } = await axios.get('/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (data.success) {
                        setUser(data.user);
                        setIsAdmin(data.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
                    } else {
                        localStorage.removeItem("authToken");
                        setToken(null);
                        setUser(null);
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error("Auth check failed:", error);
                    localStorage.removeItem("authToken");
                    setToken(null);
                    setUser(null);
                    setIsAdmin(false);
                }
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // ✅ Check admin status
    const checkAdminStatus = async (authToken = token, email = user?.email) => {
        try {
            if (email) {
                const localAdminStatus = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                setIsAdmin(localAdminStatus);
                if (localAdminStatus) return;
            }

            const { data } = await axios.get('/api/admin/is-admin', {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
            });
            if (data.success) {
                setIsAdmin(data.isAdmin);
            } else {
                setIsAdmin(false);
            }
        } catch (error) {
            console.error("Admin check failed:", error);
            setIsAdmin(false);
        }
    };

    // ✅ REGISTER
    const register = async (email, name, password, confirmPassword) => {
        try {
            const { data } = await axios.post('/api/auth/register', {
                email,
                name,
                password,
                confirmPassword
            });

            if (data.success) {
                localStorage.setItem("authToken", data.token);
                setToken(data.token);
                setUser(data.user);
                setIsAdmin(data.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
                toast.success("Registration successful!");
                return { success: true };
            } else {
                toast.error(data.message || "Registration failed");
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Register error:", error);
            toast.error(error.response?.data?.message || "Registration failed");
            return { success: false, message: error.message };
        }
    };

    // ✅ LOGIN
    const login = async (email, password) => {
        try {
            const { data } = await axios.post('/api/auth/login', {
                email,
                password
            });

            if (data.success) {
                localStorage.setItem("authToken", data.token);
                setToken(data.token);
                setUser(data.user);
                setIsAdmin(data.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
                await checkAdminStatus(data.token, data.user?.email);
                toast.success("Login successful!");
                return { success: true };
            } else {
                toast.error(data.message || "Login failed");
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || "Login failed");
            return { success: false, message: error.message };
        }
    };

    // ✅ FORGOT PASSWORD
    const forgotPassword = async (email) => {
        try {
            const { data } = await axios.post('/api/auth/forgot-password', { email });

            if (data.success) {
                toast.success("OTP sent to your email!");
                return { success: true };
            } else {
                toast.error(data.message || "Failed to send OTP");
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            toast.error(error.response?.data?.message || "Failed to send OTP");
            return { success: false, message: error.message };
        }
    };

    // ✅ RESET PASSWORD
    const resetPassword = async (email, otp, newPassword, confirmPassword) => {
        try {
            const { data } = await axios.post('/api/auth/reset-password', {
                email,
                otp,
                newPassword,
                confirmPassword
            });

            if (data.success) {
                toast.success("Password reset successful! Please login with your new password.");
                return { success: true };
            } else {
                toast.error(data.message || "Password reset failed");
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Reset password error:", error);
            toast.error(error.response?.data?.message || "Password reset failed");
            return { success: false, message: error.message };
        }
    };

    // ✅ LOGOUT
    const logout = () => {
        localStorage.removeItem("authToken");
        setToken(null);
        setUser(null);
        setIsAdmin(null);
        toast.success("Logged out successfully!");
        navigate("/");
    };

    const value = {
        user,
        token,
        isAdmin,
        loading,
        register,
        login,
        forgotPassword,
        resetPassword,
        logout,
        axios,
        checkAdminStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
