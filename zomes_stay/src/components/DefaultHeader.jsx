


import React, { useState } from "react";
import Logo from "../assets/loginPage/e3b983f61b4444dcbddadacf89aaecac0378a185 (1).png";
import { useNavigate } from "react-router-dom";

const DefaultHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
 console.log("default Header")
 const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-50  bg-white ">
      <div  className="h-20 pl-4 pt-4 sm:h-24 lg:h-[115px] lg:pl-8 lg:pt-8 flex items-center justify-between border border-b border-gray-200">
        <img src={Logo} alt="" className="w-30 md:w-60" onClick={()=>('/app/home')} />
        {/* Hamburger Icon for mobile */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-[#004AAD] mb-1"></span>
          <span className="block w-6 h-0.5 bg-[#004AAD] mb-1"></span>
          <span className="block w-6 h-0.5 bg-[#004AAD]"></span>
        </button>
        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-4 items-center pr-16">
          <button className="bg-[#004AAD] text-white text-xs px-6 py-2 rounded-full font-semibold transition-colors hover:bg-[#003080]">List Properties</button>
          <button className="bg-[#004AAD] text-white text-xs px-6 py-2 rounded-full font-semibold transition-colors hover:bg-[#003080]">Become a Host</button>
          <button className="bg-white border border-gray-200 shadow-lg w-20 h-10 flex items-center justify-center rounded-full ml-2" onClick={()=>navigate('/app/user_profile')}>
         

          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
              <rect y="5" width="24" height="2" rx="1" fill="#004AAD"/>
              <rect y="11" width="24" height="2" rx="1" fill="#004AAD"/>
              <rect y="17" width="24" height="2" rx="1" fill="#004AAD"/>
            </svg>
            
            <svg xmlns="http://www.w3.org/2000/svg" fill="#004AAD" viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="8" r="4"/>
              <path d="M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z"/>
            </svg>
          </button>
        </div>
      </div> 
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg px-6 pb-4 py-6 flex flex-col gap-4">
          <div className="bg-[#004AAD] text-white text-xs w-full h-10 flex items-center justify-center rounded-4xl">List Properties</div>
          <div className="bg-[#004AAD] text-white text-xs w-full h-10 flex items-center justify-center rounded-4xl">Book a host</div>
          <div className="bg-white border border-gray-200 shadow text-xs w-full h-10 flex items-center justify-center rounded-4xl">Book a host</div>
        </div>
      )}
    </header>
  );
};
export default DefaultHeader;