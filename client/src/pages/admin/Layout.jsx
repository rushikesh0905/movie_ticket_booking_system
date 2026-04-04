import React, { useEffect } from 'react'
import AdminNavbar from '../../components/admin/AdminNavbar'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { Outlet } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import Loading from '../../components/Loading'

const Layout = () => {

  const { isAdmin } = useAppContext();

  console.log("Layout isAdmin:", isAdmin);

  if (isAdmin === null) {
    return <Loading />;
  }

  if (!isAdmin) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <h1 className='text-2xl text-red-500'>⛔ You are not authorized to access admin dashboard</h1>
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className='flex'>
        <AdminSidebar />
        <div className='flex-1 px-10 pt-6 overflow-y-auto'>
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default Layout