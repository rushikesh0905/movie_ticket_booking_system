import { ArrowRight } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import MovieCard from "./MovieCard";
import { useAppContext } from "../context/AppContext";

const FeatureSection = () => {

  const navigate = useNavigate();
  const {shows}=useAppContext();

  return (
    <div className="relative px-6 md:px-16 lg:px-24 xl:px-44 py-10 overflow-hidden">

      {/* Background blur */}
      <BlurCircle top="-80px" right="-100px" />

      {/* Section Header */}
      <div className="flex items-center justify-between">

        <p className="text-gray-300 font-medium text-lg">
          Now Showing
        </p>

        <button
          onClick={() => navigate("/movies")}
          className="group flex items-center gap-2 text-sm text-gray-300 hover:text-white transition cursor-pointer"
        >
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
        </button>

      </div>

      {/* Movie Cards */}
      <div className="flex flex-wrap max-sm:justify-center gap-8 mt-8">
        {shows.slice(0,4).map((show)=>(
          <MovieCard key={show._id} movie={show}/>
        ))}
      </div>

      {/* Show More Button */}
      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate("/movies");
            window.scrollTo(0,0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show More
        </button>
      </div>

    </div>
  );
};

export default FeatureSection;