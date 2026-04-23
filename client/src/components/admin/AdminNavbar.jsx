import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { BellIcon } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

const AdminNavbar = () => {
  const { axios, getToken } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('/api/admin/notifications', {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className='flex items-center justify-between px-6 md:px-10 h-16 border-b border-gray-300/30 relative'>
      <Link to={'/'} className='flex-shrink-0'>
        <img src={assets.logo} alt='logo' className='w-40 h-auto relative -left-4 md:-left-6' />
      </Link>

      <div className='flex items-center gap-4'>
        <div className='relative' ref={dropdownRef}>
          <button
            type='button'
            onClick={() => setIsOpen((prev) => !prev)}
            className='relative p-2 rounded-full hover:bg-gray-100 transition'
          >
            <BellIcon className='w-6 h-6 text-gray-700' />
            {notifications.length > 0 && (
              <span className='absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-[11px]'>
                {notifications.length}
              </span>
            )}
          </button>

          {isOpen && (
            <div className='absolute right-0 mt-2 w-80 max-w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
              <div className='px-4 py-3 border-b border-gray-200 font-semibold'>Booking Notifications</div>
              <div className='max-h-72 overflow-y-auto'>
                {notifications.length === 0 ? (
                  <div className='p-4 text-sm text-gray-500'>No new booking notifications.</div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className='px-4 py-3 hover:bg-gray-50 border-b last:border-b-0'>
                      <p className='text-sm font-medium text-gray-800'>New booking for {notification.showTitle}</p>
                      <p className='text-xs text-gray-500 mt-1'>By {notification.userName}</p>
                      <p className='text-xs text-gray-500'>Seats: {notification.seats}</p>
                      <p className='text-xs text-gray-500'>Amount: ₹{notification.amount}</p>
                      <p className='text-[11px] text-gray-400 mt-2'>{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminNavbar