import { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import timeFormat from '../lib/timeFormat'
import { dateFormat } from '../lib/dateFormat'
import { useAppContext } from '../context/AppContext'
import { useAuth } from "@clerk/clerk-react"
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

const MyBookings = () => {

  const currency = import.meta.env.VITE_CURRENCY
  const { axios, user, image_base_url } = useAppContext()
  const { getToken } = useAuth()

  const [booking, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const location = useLocation() // ✅ detect URL change

  const getMyBookings = async () => {
    try {
      const token = await getToken()

      const { data } = await axios.get('/api/user/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        const normalizedBookings = (data.bookings || []).map((item) => ({
          ...item,
          isPaid: item.isPaid === true || item.isPaid === 'true',
          paymentLink: (item.paymentLink || '').trim()
        }))
        setBookings(normalizedBookings)
      }

    } catch (error) {
      console.log("FETCH ERROR:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayNow = async (bookingId, currentLink) => {
    try {
      const token = await getToken()
      const { data } = await axios.post('/api/booking/refresh', { bookingId }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success && data.url) {
        window.location.href = data.url
        return
      }

      if (currentLink) {
        window.location.href = currentLink
      } else {
        toast.error('Unable to start payment flow. Please refresh and retry.')
      }
    } catch (error) {
      console.error('handlePayNow error:', error)
      if (currentLink) {
        window.location.href = currentLink
      } else {
        toast.error('Unable to start payment flow. Please refresh and retry.')
      }
    }
  }

  useEffect(() => {
    if (user) {
      getMyBookings()
    }
  }, [user])

  // ✅ IMPORTANT: Refetch after payment redirect with delay for webhook processing
  const confirmBookingPayment = async (sessionId) => {
    if (!sessionId) return

    try {
      const token = await getToken()

      const { data } = await axios.get('/api/user/bookings/confirm', {
        params: { session_id: sessionId },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        console.log('Booking confirmed paid on backend')
      } else {
        console.log('Booking payment confirmation status:', data.message)
      }
    } catch (error) {
      console.error('confirmBookingPayment ERROR:', error)
    }
  }

  useEffect(() => {
    let intervalId

    const params = new URLSearchParams(location.search)
    const success = params.get('success') === 'true'
    const sessionId = params.get('session_id')

    const refreshBookings = async () => {
      if (success && sessionId) {
        await confirmBookingPayment(sessionId)
      }

      await getMyBookings()

      intervalId = setInterval(async () => {
        await getMyBookings()
      }, 3000)

      setTimeout(() => {
        clearInterval(intervalId)
      }, 20000)
    }

    if (success) {
      refreshBookings()
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [location.search])

  return !isLoading ? (
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 min-h-[80vh]'>

      <BlurCircle top='100px' left='100px'/>
      <BlurCircle bottom='0px' left='600px'/>

      <h1 className='text-lg font-semibold mb-4'>My Bookings</h1>

      {booking.length === 0 && (
        <p className='text-gray-400'>No bookings found</p>
      )}

      {booking.map((item, index) => (
        <div key={index} className='flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl'>

          <div className='flex flex-col md:flex-row'>

            <img 
              src={image_base_url + (item.show?.movie?.poster_path || '')} 
              alt='' 
              className='md:max-w-45 aspect-video h-auto object-cover object-bottom rounded' 
            />

            <div className='flex flex-col p-4'>
              <p className='text-base font-semibold'>
                {item.show?.movie?.title || "Movie"}
              </p>

              <p className='text-gray-400 text-xs'>
                {item.show?.movie?.runtime 
                  ? timeFormat(item.show.movie.runtime) 
                  : ''}
              </p>

              <p className='text-gray-400 text-sm mt-auto'>
                {item.show?.showDateTime 
                  ? dateFormat(item.show.showDateTime) 
                  : ''}
              </p>
            </div>

          </div>

          <div className='flex flex-col md:items-end md:text-right justify-between p-4'>
            <div className='flex items-center gap-4'>
              <p className='text-2xl font-semibold mb-3'>
                {currency}{item.amount}
              </p>

              {/* ✅ FIXED CONDITION */}
              {!(item.isPaid === true) && item.paymentLink ? (
                <button
                  onClick={() => handlePayNow(item._id, item.paymentLink)}
                  className='bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer text-white hover:bg-primary-darker transition'
                >
                  Pay Now
                </button>
              ) : (
                <span className='px-4 py-1.5 mb-3 text-sm rounded-full font-medium text-green-400'>Paid</span>
              )}
            </div>

            <div className='text-sm'>
              <p>
                <span className='text-gray-400'>Total Tickets:</span> {item.seats.length}
              </p>
              <p>
                <span className='text-gray-400'>Seat Number:</span> {item.seats.join(", ")}
              </p>
            </div>

          </div>

        </div>
      ))}

    </div>
  ) : <Loading/>
}

export default MyBookings