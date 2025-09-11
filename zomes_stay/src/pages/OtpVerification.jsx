import { Link, useNavigate } from "react-router-dom";
import loginPic from "../assets/loginPage/b18c10d224f45a116197d5ad8fd717cc0bd9661a.png";
import Logo from "../assets/loginPage/logo.png";

const OtpVerification = () => {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-3">
      {/* Left side (same widths as LoginPage) */}
      <div className="lg:col-span-2 flex flex-col px-5 sm:px-8 md:px-12 lg:px-16 py-6">
        {/* Logo (same sizing) */}
        <img src={Logo} alt="Zomestays" className="w-36 h-[50px] md:w-44" />

        {/* Card (same max widths) */}
        <div className="flex-1 flex items-center">
          <div className="w-full mx-auto max-w-md sm:max-w-lg lg:max-w-[760px] bg-white border border-gray-100 shadow-lg rounded-2xl p-6 sm:p-8">
            <h1 className="text-center font-bold text-xl sm:text-2xl text-gray-800">
              OTP Verification
            </h1>
            <p className="mt-2 text-center text-sm sm:text-base text-gray-500">
              Enter the code sent to <span className="font-semibold text-gray-700">+91 9876 543 210</span>
            </p>

            {/* 4 circular inputs */}
            <div className="mt-6 flex justify-center gap-3 sm:gap-4">
              {[0,1,2,3].map((i) => (
                <input
                  key={i}
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-gray-300 text-center text-lg sm:text-2xl font-semibold outline-none focus:border-blue-500"
                  placeholder="•"
                />
              ))}
            </div>

            <button
              className="w-full h-12 mt-6 rounded-full bg-[#004ADD] text-white font-medium"
              onClick={() => navigate("/otp-verified")}
            >
              Verify OTP
            </button>

            <p className="mt-4 text-center text-xs sm:text-sm text-gray-500">
              Didn’t receive a code? <button className="text-[#004ADD] font-semibold">RESEND</button>
            </p>
          </div>
        </div>
      </div>

      {/* Right side image (same behavior) */}
      <div className="hidden lg:block h-full overflow-hidden">
        <img src={loginPic} alt="" className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

export default OtpVerification;
