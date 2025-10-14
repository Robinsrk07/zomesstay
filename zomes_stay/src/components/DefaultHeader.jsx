


import React, { useState } from "react";
import Logo from "../assets/loginPage/e3b983f61b4444dcbddadacf89aaecac0378a185 (1).png";
import { useNavigate } from "react-router-dom";
import { Phone } from 'lucide-react';
import AgentLoginModal from "./AgentLoginModal";
import AgentSignupModal from "./AgentSignupModal";

const DefaultHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAgentLogin, setShowAgentLogin] = useState(false);
  const [showAgentSignup, setShowAgentSignup] = useState(false);
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
          <button 
            onClick={() => setShowAgentLogin(true)}
            className="bg-[#004AAD] text-white text-xs px-6 py-2 rounded-full font-semibold transition-colors hover:bg-[#003080]"
          >
            Agent Login
          </button>
          <button 
            onClick={() => setShowAgentSignup(true)}
            className="bg-[#004AAD] text-white text-xs px-6 py-2 rounded-full font-semibold transition-colors hover:bg-[#003080]"
          >
            Agent Sign Up
          </button>
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
    </header>
  );
};
export default DefaultHeader;