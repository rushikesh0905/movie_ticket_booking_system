import express from "express";
import { addShow, getNowPlayingMovies, getShow, getShows } from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

// ❌ REMOVE protectAdmin here
showRouter.get('/now-playing', getNowPlayingMovies);

// ✅ keep admin protection only for adding
showRouter.post('/add', protectAdmin, addShow);

showRouter.get("/all", getShows);
showRouter.get("/:movieId", getShow);

export default showRouter;