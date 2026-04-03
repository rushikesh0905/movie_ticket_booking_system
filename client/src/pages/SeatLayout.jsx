import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import { ArrowRightIcon, ClockIcon } from 'lucide-react'
import isoTimeFormat from '../lib/isoTimeFormat'
import BlurCircle from '../components/BlurCircle'
import toast from "react-hot-toast"
import { useAppContext } from '../context/AppContext'

const SeatLayout = () => {

  const groupRows = [["A","B"],["C","D"],["E","F"],["G","H"],["I","J"]]

  const { id, date } = useParams()
  const decodedDate = date ? decodeURIComponent(date) : ""

  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [show, setShow] = useState(null)
  const [occupiedSeats, setOccupiedSeats] = useState([])

  const navigate = useNavigate()
  const { axios, user } = useAppContext()

  // ✅ GET SHOW
  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`)
      console.log("SHOW API RESPONSE:", data)

      if (data.success) {
        setShow(data)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
    }
  }

  // ✅ HANDLE SEAT CLICK
  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      toast.error("Please select time first")
      return
    }

    if (occupiedSeats.includes(seatId)) {
      return toast.error("This seat is already booked")
    }

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      toast.error("You can only select 5 seats")
      return
    }

    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(seat => seat !== seatId)
        : [...prev, seatId]
    )
  }

  // ✅ RENDER SEATS (FIXED)
  const renderSeats = (row, count = 9) => (
    <div key={row} className='flex flex-wrap items-center justify-center gap-2'>
      {Array.from({ length: count }, (_, i) => {
        const seatId = `${row}${i+1}`
        const isOccupied = occupiedSeats.includes(seatId)

        return (
          <button
            key={seatId}
            disabled={isOccupied} // ✅ FIX: real disable
            onClick={() => handleSeatClick(seatId)}
            className={`h-8 w-8 rounded border border-primary/60
              ${selectedSeats.includes(seatId) ? "bg-primary text-white" : ""}
              ${isOccupied ? "bg-gray-500 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {seatId}
          </button>
        )
      })}
    </div>
  )

  // ✅ GET OCCUPIED SEATS (FIXED METHOD)
  const getOccupiedSeats = async () => {
    try {
      if (!selectedTime) return

      const showId = selectedTime.showId
      if (!showId) return

      // ✅ FIX: GET instead of POST
      const { data } = await axios.get(`/api/booking/seats/${showId}`)

      if (data.success) {
        setOccupiedSeats(data.occupiedSeats)
      }

    } catch (error) {
      console.log("SEAT ERROR:", error)
    }
  }

  // ✅ BOOK TICKETS
  const bookTickets = async () => {
    try {
      console.log("BOOKING DATA:", { selectedTime, selectedSeats })

      if (!user) {
        return toast.error("Please login first")
      }

      if (!selectedTime || !selectedSeats.length) {
        return toast.error("Please select time and seats")
      }

      const showId = selectedTime.showId

      if (!showId) {
        return toast.error("Show ID missing")
      }

      const { data } = await axios.post(
        '/api/booking/create',
        { showId, selectedSeats }
      )

      if (data.success) {
        window.location.href=data.url;

        // ✅ refresh occupied seats
        await getOccupiedSeats()

        navigate('/my-bookings')
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error("Something went wrong")
    }
  }

  useEffect(() => {
    getShow()
  }, [id])

  useEffect(() => {
    if (selectedTime) {
      getOccupiedSeats()
    }
  }, [selectedTime])

  if (!show) return <Loading />

  return (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50'>

      {/* Sidebar */}
      <div className='w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30'>
        <p className='text-lg font-semibold px-6'>Available Timing</p>

        <div className='mt-5 space-y-1'>
          {show.dateTime?.[decodedDate]?.map((item) => (
            <div
              key={item.time}
              onClick={() => setSelectedTime(item)}
              className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition
              ${selectedTime?.time === item.time ? "bg-primary text-white" : "hover:bg-primary/20"}`}
            >
              <ClockIcon className='w-4 h-4'/>
              <p className='text-sm'>{isoTimeFormat(item.time)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Seats */}
      <div className='relative flex-1 flex flex-col items-center max-md:mt-16'>

        <BlurCircle top='-100px' left='-100px'/>
        <BlurCircle bottom='0' right='0'/>

        <h1 className='text-2xl font-semibold mb-4'>Select your seat</h1>
        <img src={assets?.screenImage} alt="screen"/>
        <p className='text-gray-400 text-sm mb-6'>SCREEN SIDE</p>

        <div className='flex flex-col items-center mt-10 text-xs text-gray-300'>

          <div className='grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6'>
            {groupRows[0].map(row => renderSeats(row))}
          </div>

          <div className='grid grid-cols-2 gap-11'>
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx}>
                {group.map(row => renderSeats(row))}
              </div>
            ))}
          </div>

        </div>

        <button
          onClick={bookTickets}
          className='flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95'
        >
          Proceed to checkout
          <ArrowRightIcon strokeWidth={3} className='w-4 h-4'/>
        </button>

      </div>

    </div>
  )
}

export default SeatLayout