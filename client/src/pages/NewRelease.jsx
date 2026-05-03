import React, { useState, useEffect } from 'react'
import axios from 'axios'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'
import { StarIcon, InfoIcon } from 'lucide-react'
import timeFormat from '../lib/timeFormat'

const NewRelease = () => {
  const [releaseMovies, setReleaseMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const { image_base_url } = useAppContext()

  const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN
  const API_BASE_URL = 'https://api.themoviedb.org/3'

  useEffect(() => {
    const fetchReleaseMovies = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/movie/now_playing`,
          {
            params: {
              api_key: TMDB_ACCESS_TOKEN,
              language: 'en-US',
              page: 1,
              region: 'US'
            }
          }
        )

        // Process movies with all necessary data
        const processedMovies = data.results.map(movie => ({
          _id: movie.id,
          title: movie.title,
          release_date: movie.release_date,
          backdrop_path: movie.backdrop_path,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          overview: movie.overview,
          runtime: movie.runtime || 120,
          genres: movie.genres || []
        }))

        setReleaseMovies(processedMovies)
      } catch (error) {
        console.error('Error fetching new releases:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReleaseMovies()
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p className='text-xl'>Loading new releases...</p>
      </div>
    )
  }

  return (
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <BlurCircle top='150px' left='0px' />
      <BlurCircle bottom='50px' right='50px' />

      <h1 className='text-lg font-medium my-4'>New Releases In Theaters</h1>
      <p className='text-sm text-gray-400 mb-6'>
        These movies are currently in theaters. Admins will add them to QuickShow soon!
      </p>

      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {releaseMovies.map((movie) => (
          <div
            key={movie._id}
            className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66'
          >
            <img
              src={image_base_url + movie.backdrop_path}
              alt={movie.title}
              className='rounded-lg h-52 w-full object-cover object-bottom-right'
            />

            <p className='font-semibold mt-2 truncate'>
              {movie.title}
            </p>

            <p className='text-sm text-gray-400 mt-2'>
              {new Date(movie.release_date).getFullYear()} . {timeFormat(movie.runtime)}
            </p>

            <p className='text-xs text-gray-300 mt-2 line-clamp-2'>
              {movie.overview}
            </p>

            <div className='flex items-center justify-between mt-4 pb-3'>
              <div className='flex items-center gap-2'>
                <div className='flex items-center gap-1 text-sm text-gray-400'>
                  <StarIcon className='w-4 h-4 text-primary fill-primary' />
                  {movie.vote_average.toFixed(1)}
                </div>
              </div>
              <button
                disabled
                className='px-4 py-2 text-xs bg-gray-600 text-gray-300 rounded-full font-medium cursor-not-allowed flex items-center gap-1'
              >
                <InfoIcon className='w-3 h-3' />
                Coming Soon
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NewRelease
