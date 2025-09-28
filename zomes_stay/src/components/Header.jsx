import React, { useEffect, useState } from "react";
import Logo from "../assets/loginPage/logo.png"
import img from "../assets/banners/4591f90b15ec2f4d76bc1e953c01759bd99c23c9 copy 2.png";
import img1 from "../assets/banners/4591f90b15ec2f4d76bc1e953c01759bd99c23c9 copy 2.png";
import img2 from "../assets/banners/4591f90b15ec2f4d76bc1e953c01759bd99c23c9 copy 2.png";
import { useNavigate } from "react-router-dom";
const Header = () => {
  const slides = [img, img1, img2];            // <- put your 4 images here
  const [menuOpen, setMenuOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate()
  // autoplay
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000); // 5s
    return () => clearInterval(id);
  }, [slides.length]);

  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="relative text-white">
      {/* Slider area */}
      <div className="relative h-[260px] sm:h-[360px] md:h-[460px] lg:h-[560px]">
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

        {/* Dark overlay for readability */}
        <div className=" inset-0 bg-black/40" />

        {/* Top row (logo + actions) */}
<div className={`sticky top-0 z-40 h-14 sm:h-16 lg:h-[115px] px-4 lg:px-8 p-4
                       flex items-center justify-between transition-all duration-300
                       ${scrolled ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-white"}`}>          <img src={Logo} alt="" className="h-8 sm:h-9 lg:h-20 w-auto" />

          {/* Desktop buttons */}
          <div className="hidden md:flex gap-4 items-center pr-4 lg:pr-16">
            <button className="bg-[#004AAD] text-white text-xs px-6 py-2 rounded-full font-semibold hover:bg-[#003080]">
              List Properties
            </button>
            <button className="bg-[#004AAD] text-white text-xs px-6 py-2 rounded-full font-semibold hover:bg-[#003080]">
              Become a Host
            </button>
            <button className="bg-white border border-gray-200 shadow-lg w-20 h-10 flex items-center justify-center rounded-full " onClick={()=>navigate('/app/user_profile')}>
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

          {/* Mobile hamburger */}
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

        {/* Hero text, centered over image but NOT inside nav/header row */}
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4 pointer-events-none">
          <div className="text-center">
            <h1 className="font-extrabold tracking-tight leading-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)] text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
              Explore! Discover! Live!
            </h1>
            <p className="mt-3 text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-sm sm:text-lg md:text-xl lg:text-2xl">
              Best Resort For Your Vacation
            </p>

            {/* Desktop/Tablet Search Bar */}

            <div className="hidden sm:flex bg-white w-full max-w-3xl mx-auto flex-col md:flex-row   gap-2 md:gap-4 p-2 md:p-4 rounded-lg  shadow-lg mt-1">
              {/* Location Input */}
              
              {/* Check-in Date */}
              <input
                type="date"
                placeholder="Check-in"
                className="px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-sm md:text-base"
              />
              {/* Check-out Date */}
              <input
                type="date"
                placeholder="Check-out"
                className="px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-sm md:text-base"
              />
              {/* Guests */}
              <select
                className="px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-sm md:text-base min-w-[120px]"
                defaultValue="2 Guests, 1+ Rooms"
              >
                <option>1 Guest, 1 Room</option>
                <option>2 Guests, 1+ Rooms</option>
                <option>4 Guests, 2+ Rooms</option>
                <option>6 Guests, 3+ Rooms</option>
              </select>
              {/* Search Button */}
              <button className="bg-[#004AAD] text-white px-6 py-2 rounded-md font-semibold hover:bg-[#003080] transition text-sm md:text-base">
                SEARCH
              </button>
            </div>
{/* Mobile Search Input */}
            <div className="flex sm:hidden bg-white w-full max-w-xs mx-auto p-2 rounded-full shadow-md mt-2">
              <input
                type="text"
                placeholder="Search for a property in  Go"
                className="flex-1 px-4 py-2 rounded-full border-none focus:outline-none text-gray-700 text-base bg-transparent"
                style={{ boxShadow: "none" }}
              />
              <button className="ml-2 bg-[#004AAD] text-white px-4 py-2 rounded-full font-semibold text-base">Go</button>
            </div>
          </div>
        </div>
      

      

        {/* Slider controls */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60"
            >
              ›
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
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

      {/* Mobile dropdown (sits just below the slider) */}
      {menuOpen && (
        <div className="md:hidden bg-white text-gray-900 shadow-lg px-6 py-6 pb-4 flex flex-col gap-4 ">
          <button className="bg-[#004AAD] text-white text-xs h-10 rounded-full">List Properties</button>
          <button className="bg-[#004AAD] text-white text-xs h-10 rounded-full">Become a Host</button>
          <button className="border border-gray-200 text-xs h-10 rounded-full">Profile</button>
        </div>
      )}
    </header>
  );
};

export default Header;
