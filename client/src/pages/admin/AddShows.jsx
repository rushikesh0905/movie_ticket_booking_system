import React, { useEffect, useRef, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { CheckIcon, StarIcon, CalendarIcon, X } from 'lucide-react';
import { kConverter } from '../../lib/kConverter';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast'; // ✅ Fix 1: added missing toast import

const AddShows = () => {

  
  const { axios, getToken, user } = useAppContext()

  
  const image_base_url = "https://image.tmdb.org/t/p/w500"

  const currency = import.meta.env.VITE_CURRENCY && import.meta.env.VITE_CURRENCY !== "$"
    ? import.meta.env.VITE_CURRENCY
    : "₹"
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");
  const [addingShow, setAddingShow] = useState(false);

  const dateInputRef = useRef(null);

  const fetchNowPlayingMovies = async () => {
    try {
      const { data } = await axios.get('/api/show/now-playing', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        setNowPlayingMovies(data.movies)
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split("T");
    if (!date || !time) return;

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });

    setDateTimeInput("");
  }

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = (prev[date] || []).filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [date]: filteredTimes,
      }
    })
  }

  const handleSubmit = async () => {
    try {
      setAddingShow(true)

  
      if (!selectedMovies) {
        setAddingShow(false)
        return toast.error('Please select a movie');
      }
      if (Object.keys(dateTimeSelection).length === 0) {
        setAddingShow(false)
        return toast.error('Please select at least one date and time');
      }
      if (!showPrice) {
        setAddingShow(false)
        return toast.error('Please enter show price');
      }

      const showsInput = Object.entries(dateTimeSelection).map(
        ([date, times]) => ({ date, time: times })
      );

      const payLoad = {
        movieId: selectedMovies,
        showsInput,
        showPrice: Number(showPrice)
      }

      console.log("Payload being sent:", payLoad);

      const { data } = await axios.post('/api/show/add', payLoad, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      })

      console.log("Response:", data);

      if (data.success) {
        toast.success(data.message)
        setSelectedMovies(null)
        setDateTimeSelection({})
        setShowPrice("")
      } else {
        toast.error(data.message || 'Failed to add show')
      }

    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error?.response?.data?.message || error.message || 'An error occurred. Please try again.')
    } finally {
      setAddingShow(false) 
    }
  }

  useEffect(() => {
    if (user) {
      fetchNowPlayingMovies();
    }
  }, [user]);

  return nowPlayingMovies.length > 0 ? (
    <>
      <Title text1="Add" text2="Shows" />
      <p className='mt-10 text-lg font-medium'>Now Playing Movies</p>

      <div className='overflow-x-auto pb-4'>
        <div className='group flex flex-wrap gap-4 mt-4 w-max'>

          {nowPlayingMovies.map((movie) => (
            <div
              key={movie.id}
              className='relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300'
              onClick={() => setSelectedMovies(movie.id)}
            >
              <div className='relative rounded-lg overflow-hidden'>
                <img
                  src={image_base_url + movie.poster_path}
                  alt={movie.title}
                  className='w-full object-cover brightness-90'
                />

                <div className='text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0'>
                  <p className='flex items-center gap-1 text-gray-400'>
                    <StarIcon className='w-4 h-4 text-primary fill-full' />
                    {movie.vote_average.toFixed(1)}
                  </p>
                  <p className='text-gray-300'>
                    {kConverter(movie.vote_count)} Votes
                  </p>
                </div>
              </div>

              {selectedMovies === movie.id && (
                <div className='absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded'>
                  <CheckIcon className='w-4 h-4 text-white' strokeWidth={2.5} />
                </div>
              )}

              <p className='font-medium truncate'>{movie.title}</p>
              <p className='text-gray-400 text-sm'>{movie.release_date}</p>
            </div>
          ))}

        </div>
      </div>

      {/* PRICE */}
      <div className='mt-8'>
        <label className='block text-sm font-medium mb-2'>Show Price</label>
        <div className='inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md'>
          <p className='text-gray-400 text-sm'>{currency}</p>
          <input
            min={0}
            type='number'
            value={showPrice}
            onChange={(e) => setShowPrice(e.target.value)}
            placeholder='Enter Show price'
            className='outline-none bg-transparent'
          />
        </div>
      </div>

      {/* DATE TIME */}
      <div className='mt-6'>
        <label className='block text-sm font-medium mb-2'>
          Select Date and Time
        </label>

        <div className='inline-flex gap-3 items-center border border-gray-600 p-1 pl-3 rounded-lg'>
          <input
            ref={dateInputRef}
            type='datetime-local'
            value={dateTimeInput}
            onChange={(e) => setDateTimeInput(e.target.value)}
            className='outline-none rounded-md cursor-pointer bg-transparent'
          />

          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker?.()}
            className='bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600'
          >
            <CalendarIcon className='w-5 h-5' />
          </button>

          <button
            onClick={handleDateTimeAdd}
            className='bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer'
          >
            Add Time
          </button>
        </div>
      </div>

      {/* DISPLAY SELECTED TIMES */}
      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold">Selected Date-Time</h2>

          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">{date}</div>

                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time) => (
                    <div
                      key={time}
                      className="border border-primary px-2 py-1 flex items-center rounded"
                    >
                      <span>{time}</span>
                      <X
                        onClick={() => handleRemoveTime(date, time)}
                        size={15}
                        className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={addingShow}
        className='bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {addingShow ? 'Adding...' : 'Add Show'} {/* ✅ Fix 6: show loading text */}
      </button>

    </>
  ) : <Loading />
}

export default AddShows;