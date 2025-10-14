import React, { useEffect, useState } from "react";
import GuestSelectorPopup from "./GuestSelectorPopup";
import RequestCallbackModal from "./RequestCallbackModal";
import DateRangePicker from "./DateRangePicker";
import AgentLoginModal from "./AgentLoginModal";
import AgentSignupModal from "./AgentSignupModal";
import MobileSearchModal from "./MobileSearchModal";
import Logo from "../assets/loginPage/logo.png";
import { useNavigate } from "react-router-dom";
import ErrorDialog from './ErrorDialog';
import { useSearch } from '../context/SearchContext';
import { Phone, Calendar } from 'lucide-react';

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
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAgentLogin, setShowAgentLogin] = useState(false);
  const [showAgentSignup, setShowAgentSignup] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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

  // Add ref for scroll
  const handleSearchClick = () => {
    if (!searchParams.checkIn || !searchParams.checkOut) {
      setError("Please select both check-in and check-out dates");
      return;
    }
    // Pass search params to context
    contextHandleSearch(searchParams);
    // Scroll to results
    const resultsSection = document.getElementById('search-results');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
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

  // Update search params for mobile modal
  const updateSearchParams = (updates) => {
    setSearchParams(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Handle date range selection
  const handleDateRangeSelect = ({ checkIn, checkOut }) => {
    setSearchParams(prev => ({
      ...prev,
      checkIn: checkIn ? checkIn.toISOString().split('T')[0] : "",
      checkOut: checkOut ? checkOut.toISOString().split('T')[0] : ""
    }));
    setDateRange([checkIn, checkOut]);
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
    <header className=" relative text-white">
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
          {/* Left side - Logo and Phone */}
          <div className="flex items-center gap-6">
            <img src={Logo} alt="" className="h-8 sm:h-9 lg:h-20 w-auto" />
            {/* Phone Number */}
            <div className="flex items-center gap-2 text-white">
              <Phone size={16} />
              <span className="text-sm font-medium">+91 9167 928 471</span>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex gap-4 items-center pr-4 lg:pr-16">
            <button 
              onClick={() => setShowAgentLogin(true)}
              className="bg-[#004AAD] text-white text-xs px-6 py-2 rounded-full font-semibold hover:bg-[#003080] transition-colors"
            >
              Agent Login
            </button>
            <button 
              onClick={() => setShowAgentSignup(true)}
              className="bg-[#004AAD] text-white text-xs px-6 py-2 rounded-full font-semibold hover:bg-[#003080] transition-colors"
            >
              Agent Sign Up
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
        <div className="absolute -bottom-16 left-4 right-4 z-30 flex justify-center pointer-events-auto">
          {/* Desktop/Tablet Search Bar */}
          <div className="hidden sm:flex bg-white w-full max-w-4xl mx-auto flex-col rounded-lg shadow-lg">
            {/* Main search row */}
            <div className="flex flex-row items-center gap-3 p-3">
            {/* Date Range Selector */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">Check In & Out</label>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="w-full h-11 px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-sm md:text-base bg-gray-50 text-left flex items-center justify-between"
                >
                  <span>
                    {searchParams.checkIn && searchParams.checkOut 
                      ? `${new Date(searchParams.checkIn).toLocaleDateString()} - ${new Date(searchParams.checkOut).toLocaleDateString()}`
                      : "Select dates"
                    }
                  </span>
                  <Calendar size={16} className="text-gray-400" />
                </button>
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
              className="h-11 bg-[#004AAD] text-white px-8 mt-4 rounded-md font-semibold hover:bg-[#003080] transition text-sm md:text-base whitespace-nowrap flex items-center justify-center"
              style={{minWidth:'120px'}}
            >
              SEARCH
            </button>
            </div>

            {/* Request Callback Section */}
            <div className="bg-rose-50 border-t border-rose-100 px-4 py-3 rounded-b-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Finding your ideal vacation spot should be easy, we're here to help!
                </p>
                <button
                  onClick={() => setShowCallbackModal(true)}
                  className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium text-sm transition-colors"
                >
                  <Phone size={16} />
                  Request Callback
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="flex sm:hidden bg-white w-full max-w-xs mx-auto p-2 rounded-full shadow-md">
            <button
              onClick={() => setShowMobileSearch(true)}
              className="flex-1 px-4 py-2 rounded-full border-none focus:outline-none text-gray-500 text-base bg-transparent text-left flex items-center justify-between"
            >
              <span>Search for a property</span>
              <Calendar size={16} className="text-gray-400" />
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

      {/* Mobile Navigation Drawer */}
      <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
        
        {/* Side Menu */}
        <div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <img src={Logo} alt="" className="h-8 w-auto" />
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Navigation Items */}
          <div className="p-6 space-y-4">
            <button 
              onClick={() => {
                setShowAgentLogin(true);
                setMenuOpen(false);
              }}
              className="w-full bg-[#004AAD] text-white text-sm h-12 rounded-lg hover:bg-[#003080] transition-colors font-semibold flex items-center justify-center"
            >
              Agent Login
            </button>
            
            <button 
              onClick={() => {
                setShowAgentSignup(true);
                setMenuOpen(false);
              }}
              className="w-full bg-[#004AAD] text-white text-sm h-12 rounded-lg hover:bg-[#003080] transition-colors font-semibold flex items-center justify-center"
            >
              Agent Sign Up
            </button>
            
            <button 
              onClick={() => {
                navigate('/app/user_profile');
                setMenuOpen(false);
              }}
              className="w-full border border-gray-300 text-gray-700 text-sm h-12 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center"
            >
              Profile
            </button>
          </div>
          
          {/* Contact Info */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Phone size={20} className="text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Need Help?</p>
                <p className="text-sm text-gray-600">+91 9167 928 471</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={!!error}
        message={error}
        onClose={() => setError(null)}
      />

      {/* Request Callback Modal */}
      <RequestCallbackModal
        isOpen={showCallbackModal}
        onClose={() => setShowCallbackModal(false)}
      />

      {/* Agent Login Modal */}
      <AgentLoginModal
        isOpen={showAgentLogin}
        onClose={() => setShowAgentLogin(false)}
        onSwitchToSignup={() => {
          setShowAgentLogin(false);
          setShowAgentSignup(true);
        }}
      />

      {/* Agent Signup Modal */}
      <AgentSignupModal
        isOpen={showAgentSignup}
        onClose={() => setShowAgentSignup(false)}
        onSwitchToLogin={() => {
          setShowAgentSignup(false);
          setShowAgentLogin(true);
        }}
      />

      {/* Date Range Picker Modal */}
      <DateRangePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateRangeSelect}
        selectedDates={{
          checkIn: searchParams.checkIn ? new Date(searchParams.checkIn) : null,
          checkOut: searchParams.checkOut ? new Date(searchParams.checkOut) : null
        }}
      />

      {/* Mobile Search Modal */}
      <MobileSearchModal
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        searchParams={searchParams}
        onUpdateSearchParams={updateSearchParams}
      />
    </header>
  );
};

export default Header;