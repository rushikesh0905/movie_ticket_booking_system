import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL;
axios.defaults.baseURL = API;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const [shows, setShows] = useState([]);
    const [favoriteMovies, setFavoriteMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

    const { user, token, isAdmin } = useAuth();
    const navigate = useNavigate();

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
                // Silently skip authentication errors
                if (data.message !== "User not authenticated") {
                    toast.error(data.message);
                }
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

            if (user) {
                await fetchFavoriteMovies();
            } else {
                setFavoriteMovies([]);
            }

            setLoading(false);
        };

        init();
    }, [user, token]);

    const value = {
        axios,
        user,
        token,
        navigate,
        isAdmin,
        shows,
        favoriteMovies,
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