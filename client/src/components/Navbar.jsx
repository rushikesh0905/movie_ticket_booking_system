import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus, XIcon, BellIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const Navbar = () => {

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const {user}=useUser();
  const {openSignIn}=useClerk();
  const navigate=useNavigate();

  const {favoriteMovies, isAdmin, fetchIsAdmin, axios, getToken}=useAppContext();

  // ✅ Refetch admin status when component mounts or user changes
  useEffect(() => {
    if (user && fetchIsAdmin) {
      fetchIsAdmin();
    }
  }, [user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !isAdmin) return;

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
        console.error('Failed to load admin notifications:', error);
      }
    };

    fetchNotifications();
  }, [user, isAdmin, axios, getToken]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5">

      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="logo" className="w-36 h-auto" />
      </Link>

      <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium 
      max-md:text-lg z-50 flex flex-col md:flex-row items-center 
      max-md:justify-center gap-8 md:px-8 py-3 max-md:h-screen 
      md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border 
      border-gray-300/20 overflow-hidden transition-[width] duration-300 
      ${isOpen ? "max-md:w-full" : "max-md:w-0"}`}>

        <XIcon
          className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer"
          onClick={() => setIsOpen(false)}
        />

        <Link onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/">Home</Link>
        <Link onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/movies">Movies</Link>
        <Link onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/">Theaters</Link>
        <Link onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/">Releases</Link>
        {favoriteMovies.length>0 && <Link onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/favorite">Favorites</Link>}
        {isAdmin && <Link onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/admin" className="text-primary font-semibold">Admin</Link>}

      </div>

      <div className="flex items-center gap-4">
        {isAdmin && (
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
              <BellIcon className="w-6 h-6 text-gray-700" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-[11px]">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 min-w-80 w-96 max-w-full bg-white border border-gray-200 rounded-xl shadow-2xl z-50">
                <div className="px-5 py-4 border-b border-gray-200 font-semibold text-sm tracking-wide">Booking Notifications</div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-5 text-sm text-gray-500">No new booking notifications.</div>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="px-5 py-4 hover:bg-gray-50 border-b last:border-b-0 whitespace-normal">
                        <p className="text-sm font-semibold text-gray-900">New booking for {notification.showTitle}</p>
                        <p className="text-xs text-gray-500 mt-1">By {notification.userName}</p>
                        <p className="text-xs text-gray-500 mt-1">Seats: {notification.seats}</p>
                        <p className="text-xs text-gray-500">Amount: ₹{notification.amount}</p>
                        <p className="text-[11px] text-gray-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <SearchIcon className="max-md:hidden w-6 h-6 cursor-pointer" />
        {
          !user ? (
            <button onClick={openSignIn} className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer">
          Login
        </button>
          ) : (
            <UserButton> 
              <UserButton.MenuItems>
                <UserButton.Action label="My Bookings" labelIcon={<TicketPlus width={15}/>} onClick={()=>navigate('/my-bookings')}/>
                {isAdmin && (
                  <UserButton.Action label="Admin Dashboard" onClick={()=>navigate('/admin')}/>
                )}
              </UserButton.MenuItems>
            </UserButton>
          )
        }
      </div>

      <MenuIcon
        className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer"
        onClick={() => setIsOpen(true)}
      />

    </div>
  );
};

export default Navbar;