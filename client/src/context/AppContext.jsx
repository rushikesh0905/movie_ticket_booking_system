import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const [isAdmin, setIsAdmin] = useState(null);
    const [shows, setShows] = useState([]);
    const [favoriteMovies, setFavoriteMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();

    // ✅ GLOBAL AXIOS INTERCEPTOR (FIX)
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(async (config) => {
            const token = await getToken();

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        });

        return () => {
            axios.interceptors.request.eject(interceptor);
        };
    }, [getToken]);

    // ✅ ADMIN CHECK
    const fetchIsAdmin = async () => {
        try {
            const { data } = await axios.get('/api/admin/is-admin');

            if (data.success) {
                setIsAdmin(data.isAdmin);
            } else {
                setIsAdmin(false);
            }

        } catch (error) {
            console.error(error);
            setIsAdmin(false);
        }
    };

    // ✅ SHOWS
    const fetchShows = async () => {
        try {
            const { data } = await axios.get('/api/show/all');

            if (data.success) {
                setShows(data.shows);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            console.error(error);
        }
    };

    // ✅ FAVORITES
    const fetchFavoriteMovies = async () => {
        try {
            const { data } = await axios.get('/api/user/favorites');

            if (data.success) {
                setFavoriteMovies(data.movies);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchShows();
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);

            if (isLoaded) {
                if (user) {
                    await fetchIsAdmin();
                    await fetchFavoriteMovies();
                } else {
                    setIsAdmin(false);
                }
            }

            setLoading(false);
        };

        init();
    }, [user, isLoaded]);

    const value = {
        axios,
        user,
        getToken,
        navigate,
        isAdmin,
        shows,
        favoriteMovies,
        fetchIsAdmin,
        fetchFavoriteMovies,
        loading,
        image_base_url
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);