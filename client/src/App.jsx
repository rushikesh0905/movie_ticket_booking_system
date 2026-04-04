import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favorite from './pages/Favorite'
import { Toaster } from "react-hot-toast"
import Footer from "./components/Footer"
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddShows from './pages/admin/AddShows'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
import { useAppContext } from './context/AppContext'
import { SignIn, useUser } from '@clerk/clerk-react'
import Loading from './components/Loading'

const App = () => {

  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith("/admin")

  const { user, isAdmin, loading } = useAppContext()
  const { isLoaded } = useUser()

  // ✅ Wait for Clerk + admin check to complete
  if (loading || !isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar />}

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/movies' element={<Movies />} />
        <Route path='/movies/:id' element={<MovieDetails />} />
        <Route path='/movies/:id/seats/:date' element={<SeatLayout />} />
        <Route path='/my-bookings' element={<MyBookings />} />
        <Route path='/loading/:nextUrl' element={<Loading />} />
        <Route path='/favorite' element={<Favorite />} />
        <Route path='*' element={<h1>Page Not Found</h1>} />

        <Route
          path='/admin/*'
          element={
            !user ? (
              // ✅ Not logged in - show SignIn
              <div className="flex justify-center items-center h-screen">
                <SignIn fallbackRedirectUrl={'/admin'} />
              </div>
            ) : isAdmin ? (
              // ✅ Logged in AND is admin - show dashboard
              <Layout />
            ) : (
              // ✅ Logged in but NOT admin
              <div className="flex justify-center items-center h-screen">
                <h1 className="text-2xl text-red-500">
                  ⛔ You are not authorized to access admin dashboard
                </h1>
              </div>
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path='add-shows' element={<AddShows />} />
          <Route path='list-shows' element={<ListShows />} />
          <Route path='list-bookings' element={<ListBookings />} />
        </Route>
      </Routes>

      {!isAdminRoute && <Footer />}
    </>
  )
}

export default App
