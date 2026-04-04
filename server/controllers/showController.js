import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

const tmdbAxios = axios.create({
    timeout: 10000, // 10 second timeout
    headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`
    }
});

// Retry helper with exponential backoff
const retryRequest = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
};

export const getNowPlayingMovies = async (req, res) => {
    try {
        const { data } = await retryRequest(
            () => tmdbAxios.get("https://api.themoviedb.org/3/movie/now_playing")
        );

        const movies = data.results;
        res.json({ success: true, movies });

    } catch (error) {
        console.error("getNowPlayingMovies error:", error.message);
        res.status(502).json({ 
            success: false, 
            message: "TMDB API temporarily unavailable. Please try again in a moment." 
        });
    }
};

// API to add new show
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, showPrice } = req.body;

        console.log("addShow payload:", { movieId, showsInput, showPrice });

        if (!movieId || !showsInput || !showPrice) {
            return res.status(400).json({ success: false, message: "Missing movieId, showsInput, or showPrice" });
        }

        let movie = await Movie.findById(movieId);

        if (!movie) {
            console.log("Movie not in DB, fetching from TMDB with retry...");
            try {
                const [movieDetailsResponse, movieCreditsResponse, movieVideosResponse] = await Promise.all([
                    retryRequest(() =>
                        tmdbAxios.get(`https://api.themoviedb.org/3/movie/${movieId}`)
                    ),
                    retryRequest(() =>
                        tmdbAxios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`)
                    ),
                    retryRequest(() =>
                        tmdbAxios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`)
                    )
                ]);

                const movieApiData = movieDetailsResponse.data;
                const movieCreditsData = movieCreditsResponse.data;
                const movieVideosData = movieVideosResponse.data;

                // Find the official YouTube trailer
                const trailer = movieVideosData.results.find(
                    video => video.type === 'Trailer' && video.site === 'YouTube'
                );
                const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

                const movieDetails = {
                    _id: movieId,
                    title: movieApiData.title,
                    overview: movieApiData.overview,
                    poster_path: movieApiData.poster_path,
                    backdrop_path: movieApiData.backdrop_path,
                    genres: movieApiData.genres,
                    casts: movieCreditsData.cast,
                    release_date: movieApiData.release_date,
                    original_language: movieApiData.original_language,
                    tagline: movieApiData.tagline || "",
                    vote_average: movieApiData.vote_average,
                    runtime: movieApiData.runtime,
                    trailer: trailerUrl
                };

                movie = await Movie.create(movieDetails);
                console.log("Movie created in DB:", movie._id, "Trailer:", trailerUrl);
            } catch (tmdbErr) {
                console.error("TMDB fetch error after retries:", tmdbErr.response?.data || tmdbErr.message);
                return res.status(502).json({ 
                    success: false, 
                    message: "TMDB API error: Unable to fetch movie details. Please try again in a moment. (" + (tmdbErr.message || 'Network error') + ")"
                });
            }
        }

        const showsToCreate = [];
        showsInput.forEach(show => {
            const showDate = show.date;
            const times = Array.isArray(show.time) ? show.time : [show.time];
            
            times.forEach((time) => {
                const dateTimeString = `${showDate} ${time}`;
                const parsedDateTime = new Date(dateTimeString);
                
                if (isNaN(parsedDateTime)) {
                    console.error("Invalid date format:", dateTimeString);
                    return;
                }
                
                showsToCreate.push({
                    movie: movieId,
                    showDateTime: parsedDateTime,
                    showPrice,
                    occupiedSeats: {}
                });
            });
        });

        console.log("Shows to create:", showsToCreate.length, showsToCreate);

        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate);
            console.log("Shows inserted successfully");
        } else {
            return res.status(400).json({ success: false, message: "No valid shows to create" });
        }

        res.json({ success: true, message: "Show Added Successfully" });

    } catch (error) {
        console.error("addShow error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to add show" });
    }
};

// API to get all shows from database
export const getShows = async (req, res) => {
    try {
        const lookbackMs = 60 * 60 * 1000; // 1 hour back for timezone drift
        const now = new Date(Date.now() - lookbackMs);

        const shows = await Show.find({ showDateTime: { $gte: now } })
            .populate('movie')
            .sort({ showDateTime: 1 });

        const moviesById = new Map();
        shows.forEach((show) => {
            if (show.movie && show.movie._id) {
                moviesById.set(show.movie._id.toString(), show.movie);
            }
        });

        res.json({ success: true, shows: Array.from(moviesById.values()) });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get single show from the database
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        const lookbackMs = 60 * 60 * 1000;
        const now = new Date(Date.now() - lookbackMs);

        const shows = await Show.find({ movie: movieId, showDateTime: { $gte: now } });

        const movie = await Movie.findById(movieId);
        const dateTime = {};

        shows.forEach((show) => {
            const localDate = new Date(show.showDateTime).toLocaleDateString('en-CA');
            if (!dateTime[localDate]) {
                dateTime[localDate] = [];
            }
            dateTime[localDate].push({ time: show.showDateTime, showId: show._id });
        });

        res.json({ success: true, movie, dateTime });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};