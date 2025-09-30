import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import GuestSelectorPopup from "./GuestSelectorPopup";
import Logo from "../assets/loginPage/logo.png";
import { useNavigate } from "react-router-dom";
import ErrorDialog from './ErrorDialog';
import { useSearch } from '../context/SearchContext';

const img = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&h=400&q=80";
const img1 = "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&h=400&q=80";
const img2 = "https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1200&h=400&q=80";

const customStyles = {
  '.react-datepicker': {
    fontSize: '0.9rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontFamily: 'inherit'
  },
  '.react-datepicker__month-container': {
    float: 'left',
    minWidth: '280px'
  },
  '.react-datepicker__header': {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb'
  },
  '.react-datepicker__day--in-range': {
    backgroundColor: '#004AAD',
    color: 'white'
  },
  '.react-datepicker__day--in-selecting-range': {
    backgroundColor: 'rgba(0, 74, 173, 0.5)',
    color: 'white'
  },
  '.react-datepicker__day--selected': {
    backgroundColor: '#004AAD',
    color: 'white'
  }
};

const Header = () => {
  const navigate = useNavigate();
  const { handleSearch: contextHandleSearch } = useSearch();
  const [error, setError] = useState(null);
  
  // Search Parameters State
  const [searchParams, setSearchParams] = useState({
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    infants: 0,
    rooms: 1,
    infantsUseBed: 0
  });

  console.log(searchParams);

  // UI State
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Slider State
  const slides = [img, img1, img2];
  const [idx, setIdx] = useState(0);

  // Replace single date state with date range
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // Handle date changes (supports both DatePicker and input type="date")
  const handleDateChange = (arg1, arg2) => {
    // DatePicker: handleDateChange([startDate, endDate])
    // Input: handleDateChange('checkIn', value)
    if (Array.isArray(arg1)) {
      setDateRange(arg1);
      const [start, end] = arg1 || [null, null];
      setSearchParams(prev => ({
        ...prev,
        checkIn: start instanceof Date ? start.toISOString().split('T')[0] : "",
        checkOut: end instanceof Date ? end.toISOString().split('T')[0] : ""
      }));
    } else if (typeof arg1 === 'string' && typeof arg2 === 'string') {
      // arg1 is 'checkIn' or 'checkOut', arg2 is value (yyyy-mm-dd)
      setSearchParams(prev => ({
        ...prev,
        [arg1]: arg2
      }));
      // Also update dateRange for consistency
      if (arg1 === 'checkIn') {
        setDateRange([arg2 ? new Date(arg2) : null, dateRange[1]]);
      } else if (arg1 === 'checkOut') {
        setDateRange([dateRange[0], arg2 ? new Date(arg2) : null]);
      }
    }
  };

  // Handle search click
  const handleSearchClick = () => {
    if (!searchParams.checkIn || !searchParams.checkOut) {
      setError("Please select both check-in and check-out dates");
      return;
    }

    // Clear error and proceed with search
    setError(null);
    contextHandleSearch(searchParams);
  };

  // Update guest counts
  const updateGuestCounts = (adults, children, infants, rooms) => {
    setSearchParams(prev => ({
      ...prev,
      adults,
      children,
      infants,
      rooms
    }));
  };

  // Slider controls
  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);

  // Auto-slide effect
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % slides.length), 2000);
    return () => clearInterval(id);
  }, [slides.length]);

  // Scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="relative text-white">
      {/* Slider area */}
      <div className="relative h-[260px] sm:h-[260px] md:h-[360px] lg:h-[460px]">
        {/* Slides */}
        {slides.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Top navigation */}
        <div className={`sticky top-0 z-40 h-14 sm:h-16 lg:h-[115px] px-4 lg:px-8 p-4
                        flex items-center justify-between transition-all duration-300
                        ${scrolled ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-white"}`}>
          <img src={Logo} alt="" className="h-8 sm:h-9 lg:h-20 w-auto" />

          {/* Desktop navigation */}
          <div className="hidden md:flex gap-4 items-center pr-4 lg:pr-16">
            <button className="bg-[#004AAD] text-white text-xs px-6 py-2 rounded-full font-semibold hover:bg-[#003080]">
              List Properties
            </button>
            <button className="bg-[#004AAD] text-white text-xs px-6 py-2 rounded-full font-semibold hover:bg-[#003080]">
              Become a Host
            </button>
            <button 
              className="bg-white border border-gray-200 shadow-lg w-20 h-10 flex items-center justify-center rounded-full"
              onClick={() => navigate('/app/user_profile')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                <rect y="5" width="24" height="2" rx="1" fill="#004AAD" />
                <rect y="11" width="24" height="2" rx="1" fill="#004AAD" />
                <rect y="17" width="24" height="2" rx="1" fill="#004AAD" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" fill="#004AAD" viewBox="0 0 24 24" width="22" height="22">
                <circle cx="12" cy="8" r="4" />
                <path d="M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z" />
              </svg>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/40"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <div className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 bg-white rounded" />
              <span className="block h-0.5 w-5 bg-white rounded" />
              <span className="block h-0.5 w-5 bg-white rounded" />
            </div>
          </button>
        </div>

        {/* Hero content */}
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4 pointer-events-none">
          <div className="text-center">
            <h1 className="font-extrabold tracking-tight leading-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)] text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
              Explore! Discover! Live!
            </h1>
            <p className="mt-3 text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-sm sm:text-lg md:text-xl lg:text-2xl">
              Best Resort For Your Vacation
            </p>
          </div>
        </div>

        {/* Search section */}
        <div className="absolute bottom-8 left-4 right-4 z-30 flex justify-center pointer-events-auto">
          {/* Desktop/Tablet Search Bar */}
          <div className="hidden sm:flex bg-white w-full max-w-4xl mx-auto flex-row items-center gap-3 p-3 rounded-lg shadow-lg">
            {/* Check-in Date */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col flex-1 min-w-[180px]">
                <label className="block text-xs text-gray-500 mb-1">Check-in</label>
                <input
                  type="date"
                  value={searchParams.checkIn}
                  onChange={(e) => handleDateChange('checkIn', e.target.value)}
                  className="w-full h-11 px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-sm md:text-base bg-gray-50"
                />
              </div>
            </div>

            {/* Check-out Date */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col flex-1 min-w-[180px]">
                <label className="block text-xs text-gray-500 mb-1">Check-out</label>
                <input
                  type="date"
                  value={searchParams.checkOut}
                  onChange={(e) => handleDateChange('checkOut', e.target.value)}
                  className="w-full h-11 px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-sm md:text-base bg-gray-50"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="flex flex-col flex-1 min-w-[220px] relative">
              <label className="block text-xs text-gray-500 mb-1">Guests</label>
              <button
                type="button"
                className="w-full h-11 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-sm md:text-base text-left bg-gray-50"
                onClick={() => setShowGuestSelector(true)}
              >
                {`${searchParams.adults + searchParams.children} Guests${
                  searchParams.infants > 0 ? `, ${searchParams.infants} Infant` : ''
                }, ${searchParams.rooms}+ Rooms`}
              </button>
              {showGuestSelector && (
                <GuestSelectorPopup
                  adults={searchParams.adults}
                  children={searchParams.children}
                  infants={searchParams.infants}
                  rooms={searchParams.rooms}
                  setAdults={(val) => updateGuestCounts(val, searchParams.children, searchParams.infants, searchParams.rooms)}
                  setChildren={(val) => updateGuestCounts(searchParams.adults, val, searchParams.infants, searchParams.rooms)}
                  setInfants={(val) => updateGuestCounts(searchParams.adults, searchParams.children, val, searchParams.rooms)}
                  setRooms={(val) => updateGuestCounts(searchParams.adults, searchParams.children, searchParams.infants, val)}
                  onClose={() => setShowGuestSelector(false)}
                  onClear={() => updateGuestCounts(2, 0, 0, 1)}
                />
              )}
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearchClick}
              className="h-11 bg-[#004AAD] text-white px-8 rounded-md font-semibold hover:bg-[#003080] transition text-sm md:text-base whitespace-nowrap flex items-center justify-center"
              style={{minWidth:'120px'}}
            >
              SEARCH
            </button>
          </div>

          {/* Mobile Search */}
          <div className="flex sm:hidden bg-white w-full max-w-xs mx-auto p-2 rounded-full shadow-md">
            <input
              type="text"
              placeholder="Search for a property"
              className="flex-1 px-4 py-2 rounded-full border-none focus:outline-none text-gray-700 text-base bg-transparent"
              style={{ boxShadow: "none" }}
            />
            <button 
              onClick={handleSearchClick}
              className="ml-2 bg-[#004AAD] text-white px-4 py-2 rounded-full font-semibold text-base"
            >
              Go
            </button>
          </div>
        </div>

        {/* Slider controls */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 z-25"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 z-25"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-25">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2.5 w-2.5 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white text-gray-900 shadow-lg px-6 py-6 pb-4 flex flex-col gap-4">
          <button className="bg-[#004AAD] text-white text-xs h-10 rounded-full">
            List Properties
          </button>
          <button className="bg-[#004AAD] text-white text-xs h-10 rounded-full">
            Become a Host
          </button>
          <button className="border border-gray-200 text-xs h-10 rounded-full">
            Profile
          </button>
        </div>
      )}

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={!!error}
        message={error}
        onClose={() => setError(null)}
      />
    </header>
  );
};

export default Header;