import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Footer from "../footer/Footer";
import Navbar from "../navbar/Navbar";
import RouteTour from "../../router/RouteTour";
import { AuthContext } from "../../context/authContext";
import AdminNavbar from "../navbar/AdminNavbar";
import TravelAdvisor from "../chat/TravelAdvisor";

const Layout = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [showNav, setShowNav] = useState(true);
  
  const adminPaths = [
    '/admin',
    '/admin-dashboard',
    '/service-provider-dashboard',
    '/service-provider-request',
    '/users',
    '/hotels',
    '/tours',
    '/vehicle',
    '/train',
    '/adduser',
    '/userpage',
    '/update',
    '/addrestaurants',
    '/admin/restaurants',
    '/restaurant-reservations',
    '/reservations',
    '/event-management',
    '/airplane-travel',
    '/tourreservation/all',
    '/vehiclereservation',
    '/adminTrain/reviewPanel',
    '/finance',
    '/finance/salary',
    '/finance/employee',
    '/finance/salarySheet',
    '/finance/FinanceHealth',
    '/finance/refund',
    '/finance/addRefund',
    '/pending-reservations',
    '/flight-reservations'
  ];

  // Function to check if path is in admin paths
  const isAdminPath = (path) => {
    // Exclude specific user paths that should not show admin navbar
    if (path === '/tours/home' || path.startsWith('/tours/home/')) {
      console.log("Tours home path detected, using regular navbar");
      return false;
    }
    
    // Exclude user tour detail pages (e.g., /tours/123456)
    // These should show user navbar, not admin navbar
    if (path.startsWith('/tours/') && path !== '/tours') {
      // Check if it's a tour detail page (path has an ID after /tours/)
      const tourIdPart = path.split('/tours/')[1];
      if (tourIdPart && !tourIdPart.includes('/')) {
        // It's likely a tour detail page with an ID, show user navbar
        console.log("Tour detail page detected, using regular navbar");
        return false;
      }
    }
    
    return adminPaths.some(adminPath => 
      path === adminPath || (path.startsWith(adminPath + '/') && adminPath !== '/tours')
    );
  };

  // to render the alternative Navbar or the default Navbar
  const showAdminNavbar = isAdminPath(location.pathname);

  useEffect(() => {
    // Just to ensure we don't have any duplication
    setShowNav(true);
  }, [location.pathname]);

  return (
    <div>
      {showNav && (
        showAdminNavbar ? <AdminNavbar /> : <Navbar />
      )}
      <RouteTour />
      {!showAdminNavbar && <Footer />}
      {!showAdminNavbar && <TravelAdvisor />}
    </div>
  );
};

export default Layout;
