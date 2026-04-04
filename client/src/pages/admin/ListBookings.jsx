import React, { useEffect, useState } from 'react'
import { dummyBookingData } from '../../assets/assets';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import  {Currency } from '../../assets/assets';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';




const ListBookings = () => {

  const {axios ,getToken ,user}=useAppContext();

  const [bookings,setBookings]=useState([]);
  const [isLoading,setIsLoading]=useState(true);
  const [page,setPage]=useState(1);
  const [limit]=useState(20);
  const [totalBookings,setTotalBookings]=useState(0);

const getAllBookings=async()=>{
  try{
    const {data}=await axios.get(`/api/admin/all-bookings?page=${page}&limit=${limit}`,{
        headers :{ Authorization:`Bearer ${await getToken()}`}
       })
       console.log("Bookings data:", data.bookings)
       setBookings(data.bookings || [])
       setTotalBookings(data.totalBookings || 0)
  }catch(error){
    console.error("Error fetching bookings:", error);
  
  }
  setIsLoading(false);
}

useEffect(()=>{
  if(user){
    getAllBookings();
  }
  
},[user, page]);



  return !isLoading ? (
    <>
      <Title text1="List" text2="Bookings" />
      <div className='w-full overflow-x-auto'>
  <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
  <thead>
    <tr className='bg-primary/20 text-left text-white'>
      <th className='p-2 font-medium pl-5'>User Name</th>
      <th className='p-2 font-medium'>Movie Name</th>
      <th className='p-2 font-medium'>Show Time</th>
      <th className='p-2 font-medium'>Seats</th>
      <th className='p-2 font-medium'>Amount</th>
      <th className='p-2 font-medium'>Status</th>
    </tr>
  </thead>

  <tbody className='text-sm font-light'>
    {bookings.length > 0 ? bookings.map((item,index)=>(
      <tr key={index} className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'>
        <td className='p-2 min-w-45 pl-5'>{item.user?.name || item.user || 'N/A'}</td>
        <td className='p-2 '>{item.show?.movie?.title || 'N/A'}</td>
        <td className='p-2 '>{item.show?.showDateTime ? dateFormat(item.show.showDateTime) : 'N/A'}</td>
        <td className='p-2 '>{Array.isArray(item.seats) ? item.seats.join(", ") : 'N/A'}</td>
        <td className='p-2 '>{Currency} {item.amount || 0}</td>
        <td className='p-2 '><span className={`px-2 py-1 rounded text-xs font-semibold ${item.isPaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{item.isPaid ? 'Paid' : 'Unpaid'}</span></td>
      </tr>
    )) : (
      <tr>
        <td colSpan="6" className='p-4 text-center text-gray-400'>No bookings found</td>
      </tr>
    )}

  </tbody>
  
  </table>
</div>
  <div className='mt-4 flex items-center justify-between'>
    <p className='text-sm text-gray-400'>Page {page} of {Math.ceil(totalBookings/limit) || 1}</p>

    <div className='flex gap-2'>
      <button
        disabled={page <= 1}
        onClick={() => setPage((prev)=>Math.max(prev-1,1))}
        className='px-3 py-1 rounded bg-primary/80 text-white disabled:opacity-50'
      >Prev</button>

      <button
        disabled={page >= Math.ceil(totalBookings/limit)}
        onClick={() => setPage((prev)=>prev + 1)}
        className='px-3 py-1 rounded bg-primary/80 text-white disabled:opacity-50'
      >Next</button>
    </div>
  </div>    </>
  ):<Loading/>
}

export default ListBookings