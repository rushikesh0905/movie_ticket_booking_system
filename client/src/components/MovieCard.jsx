import { StarIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import timeFormat from '../lib/timeFormat';
import { useAppContext } from '../context/AppContext';

const MovieCard = ({ movie }) => {

  const navigate = useNavigate();
  const {image_base_url, axios}=useAppContext();
  const currency = import.meta.env.VITE_CURRENCY && import.meta.env.VITE_CURRENCY !== "$"
    ? import.meta.env.VITE_CURRENCY
    : "₹";
  const [showPrice, setShowPrice] = useState(movie.showPrice ?? null)

  useEffect(() => {
    const fetchShowPrice = async () => {
      if (showPrice !== null && showPrice !== undefined && Number(showPrice) > 0) return;

      try {
        const { data } = await axios.get(`/api/show/${movie._id}`)
        if (data?.success) {
          const price = data.showPrice ?? data.movie?.showPrice ?? 0
          setShowPrice(price)
        }
      } catch (error) {
        console.error('Failed to load show price:', error)
      }
    }

    fetchShowPrice()
  }, [axios, movie._id, showPrice])

  return (
    <div className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66'>

      <img
        onClick={() => { navigate(`/movies/${movie._id}`); window.scrollTo(0,0); }}
        src={image_base_url+ movie.backdrop_path}
        alt=''
        className='rounded-lg h-52 w-full object-cover object-bottom-right cursor-pointer'
      />

      <p className='font-semibold mt-2 truncate'>
        {movie.title}
      </p>

      <p className='text-sm text-gray-400 mt-2'>
        {new Date(movie.release_date).getFullYear()} . {movie.genres.slice(0,2).map(genre => genre.name).join(" | ")} . {timeFormat(movie.runtime)}
      </p>

      <p className='text-sm mt-1 text-primary font-medium'>
        Price: {currency}{showPrice ?? 0}
      </p>

      <div className='flex items-center justify-between mt-4 pb-3'>
        <button onClick={() => { navigate(`/movies/${movie._id}`); window.scrollTo(0,0);}} className='px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>Buy Tickets</button>
        <p className='flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1'>
            <StarIcon className='w-4 h-4 text-primary full-primary fill-primary'/>
            {movie.vote_average.toFixed(1)}
        </p>
      </div>

    </div>
  )
}

export default MovieCard