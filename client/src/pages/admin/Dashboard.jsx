import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, UsersIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import BlurCircle from '../../components/BlurCircle';
import { StarIcon } from 'lucide-react'
import { dateFormat } from '../../lib/dateFormat'
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast'; 

const Dashboard = () => {

  const { axios, getToken, user } = useAppContext()

  const image_base_url = "https://image.tmdb.org/t/p/w500"
  const currency = import.meta.env.VITE_CURRENCY

  const [dashboardData, setDashboardData] = useState({
    totalBooking: 0,    
    totalRevenue: 0,
    activeShows: [],
    totalUsers: 0       
  })

  const [loading, setLoading] = useState(true);

  const dashboardCards = [
    { title: "Total Bookings", value: dashboardData.totalBooking || "0", icon: ChartLineIcon },        
    { title: "Total Revenue", value: `${currency}${dashboardData.totalRevenue || 0}`, icon: CircleDollarSignIcon },
    { title: "Active Shows", value: dashboardData.activeShows.length || "0", icon: PlayCircleIcon },
    { title: "Total Users", value: dashboardData.totalUsers || "0", icon: UsersIcon },                
  ]

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      })
      console.log("Dashboard response:", data) 
      if (data.success) {
        setDashboardData(data.dashboardData)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error fetching dashboard data") 
    } finally {
      setLoading(false) 
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user])

  return !loading ? (
    <>
      <Title text1="Admin" text2="Dashboard" />

      <div className='relative flex flex-wrap gap-4 w-full mt-6'>
        <BlurCircle top='-100px' left='0' />

        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className='flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-md max-w-[250px] w-full'
            >
              <div>
                <h1 className='text-sm'>{card.title}</h1>
                <p className='text-xl font-medium mt-1'>{card.value}</p>
              </div>
              <Icon className='w-6 h-6' />
            </div>
          )
        })}
      </div>

      <p className="mt-10 text-lg font-medium">Active Shows</p>

      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="100px" left="-10%" />

        {dashboardData.activeShows.length === 0 ? (
          <p className="text-gray-400">No active shows yet.</p>
        ) : (
          dashboardData.activeShows.map((show) => (
            <div
              key={show._id}
              className="w-55 rounded-lg overflow-hidden h-full pb-3 bg-primary/10 border border-primary/20 hover:-translate-y-1 transition duration-300"
            >
              {/* ✅ Fix 8: added image_base_url prefix */}
              <img
                src={image_base_url + show.movie.poster_path}
                alt={show.movie.title}
                className="h-60 w-full object-cover"
              />

              <p className="font-medium p-2 truncate">
                {show.movie.title}
              </p>

              <div className="flex items-center justify-between px-2">
                <p className="text-lg font-medium">
                  {currency} {show.showPrice}
                </p>

                <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                  <StarIcon className="w-4 h-4 text-primary fill-primary" />
                  {show.movie.vote_average.toFixed(1)}
                </p>
              </div>

              <p className="px-2 pt-2 text-sm text-gray-500">
                {dateFormat(show.showDateTime)}
              </p>
            </div>
          ))
        )}
      </div>
    </>
  ) : <Loading />
}

export default Dashboard