import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus, XIcon, BellIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const Navbar = () => {

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const {user}=useUser();
  const {openSignIn}=useClerk();
  const navigate=useNavigate();

  const {favoriteMovies, isAdmin, fetchIsAdmin, axios, getToken, shows, image_base_url}=useAppContext();

  const filteredMovies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return shows
      .filter((movie) => movie.title?.toLowerCase().includes(query))
      .slice(0, 6);
  }, [searchQuery, shows]);

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

      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  const handleMovieSelect = (movieId) => {
    navigate(`/movies/${movieId}`);
    setShowSearch(false);
    setSearchQuery("");
    window.scrollTo(0, 0);
  };

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5">

      <Link to="/" className="flex-shrink-0">
        <img src={assets.logo} alt="logo" className="w-40 h-auto relative -left-4 md:-left-6" />
      </Link>

      <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium 
      max-md:text-lg z-50 flex flex-col md:flex-row items-center 
      max-md:justify-center gap-8 md:px-8 py-3 max-md:h-screen 
      md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border 
      border-gray-300/20 max-md:overflow-hidden md:overflow-visible transition-[width] duration-300 
      ${isOpen ? "max-md:w-full" : "max-md:w-0"}`}>

        <XIcon
          className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer"
          onClick={() => setIsOpen(false)}
        />

        <div className="relative group">
          <Link className="transition-transform duration-200 md:group-hover:scale-110" onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/">Home</Link>
          <span className="hidden md:block absolute -top-10 left-1/2 -translate-x-1/2 translate-y-1 scale-95 px-2 py-1 text-xs rounded-md bg-black/90 border border-white/20 text-white opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
            Go to Home
          </span>
        </div>

        <div className="relative group">
          <Link className="transition-transform duration-200 md:group-hover:scale-110" onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/movies">Movies</Link>
          <span className="hidden md:block absolute -top-10 left-1/2 -translate-x-1/2 translate-y-1 scale-95 px-2 py-1 text-xs rounded-md bg-black/90 border border-white/20 text-white opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
            Browse Movies
          </span>
        </div>

        <div className="relative group">
          <Link className="transition-transform duration-200 md:group-hover:scale-110" onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/">Theaters</Link>
          <span className="hidden md:block absolute -top-10 left-1/2 -translate-x-1/2 translate-y-1 scale-95 px-2 py-1 text-xs rounded-md bg-black/90 border border-white/20 text-white opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
            View Theaters
          </span>
        </div>

        <div className="relative group">
          <Link className="transition-transform duration-200 md:group-hover:scale-110" onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/">Releases</Link>
          <span className="hidden md:block absolute -top-10 left-1/2 -translate-x-1/2 translate-y-1 scale-95 px-2 py-1 text-xs rounded-md bg-black/90 border border-white/20 text-white opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
            Latest Releases
          </span>
        </div>

        {favoriteMovies.length>0 && (
          <div className="relative group">
            <Link className="transition-transform duration-200 md:group-hover:scale-110" onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/favorite">Favorites</Link>
            <span className="hidden md:block absolute -top-10 left-1/2 -translate-x-1/2 translate-y-1 scale-95 px-2 py-1 text-xs rounded-md bg-black/90 border border-white/20 text-white opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
              Your Favorites
            </span>
          </div>
        )}

        {isAdmin && (
          <div className="relative group">
            <Link onClick={() => {scrollTo(0,0); setIsOpen(false)}} to="/admin" className="text-primary font-semibold transition-transform duration-200 md:group-hover:scale-110">Admin</Link>
            <span className="hidden md:block absolute -top-10 left-1/2 -translate-x-1/2 translate-y-1 scale-95 px-2 py-1 text-xs rounded-md bg-black/90 border border-white/20 text-white opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
              Open Admin Panel
            </span>
          </div>
        )}

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
        <div className="relative max-md:hidden" ref={searchRef}>
          <button
            type="button"
            onClick={() => setShowSearch((prev) => !prev)}
            className="p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Search movies"
          >
            <SearchIcon className="w-6 h-6" />
          </button>

          {showSearch && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-[#0B1220] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies..."
                  className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="max-h-72 overflow-y-auto">
                {!searchQuery.trim() && (
                  <p className="px-4 py-3 text-sm text-gray-400">Type a movie name to search.</p>
                )}

                {searchQuery.trim() && filteredMovies.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">No movies found.</p>
                )}

                {filteredMovies.map((movie) => (
                  <button
                    key={movie._id}
                    type="button"
                    onClick={() => handleMovieSelect(movie._id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition text-left"
                  >
                    <img
                      src={image_base_url + movie.poster_path}
                      alt={movie.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">{movie.title}</p>
                      <p className="text-xs text-gray-400">{new Date(movie.release_date).getFullYear()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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