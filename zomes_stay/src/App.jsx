import { BrowserRouter, Routes, Route } from "react-router-dom";
import Body from "./components/Body";
import HomePage from "./components/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUp from "./pages/signUp";
import OtpVerification from "./pages/OtpVerification";
import OtpVerified from "./pages/OtpVerified";
import Detials from "./pages/DetialsPage";
import ContactUs from "./pages/ContactUs";
import UserProfile from "./pages/UserProfile";
import LegalInfo from "./pages/LegalInfo";
import FindProperty from "./pages/FindProperty";
import HowToAgent from "./pages/HowToAgent";
import Faq from "./pages/Faq";
import SignAgent from "./pages/SignAgent";
import SignUpAgent from './pages/signUpAgent';
import SignInSuccess from './pages/SignInSucces';
import AboutUs from "./pages/AboutUs";
import AdminLogin from "./pages/Admin/AdminLogin";
import BaseLayout from "./pages/Admin/BaseLayout";
import Test from "./pages/Admin/Test";
import Dashboard from "./pages/Admin/DashBoard";
import Properties from "./pages/Admin/Properties";
import AddProperty from "./pages/Admin/AddProperty";
import WhishList from "./pages/WhishList";
import AllBookings from "./pages/Admin/AllBookings";
import RegisteredUsers  from "./pages/Admin/RegisteredUsers"
import PaymentsTransactions from "./pages/Admin/Payment";
import PromotionsDiscounts from "./pages/Admin/PromotionsDiscounts";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-center" autoClose={5000} />

      <Routes>
        {/* public */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/otp" element={<OtpVerification />} />
        <Route path="/otp-verified" element={<OtpVerified />} />
        
        {/* your main app */}
        <Route path="/app" element={<Body />}>
          <Route path="home" element={<HomePage />} />
          <Route path="properties/:id" element={<Detials />} />
          <Route path="user_profile" element={<UserProfile />} />
          <Route path="contact_us" element={<ContactUs />} />
          <Route path="legal_info" element={<LegalInfo />} />
          <Route path="find_a_property" element={<FindProperty />} />
          <Route path="how_to_agent" element={<HowToAgent />} />
          <Route path="faq" element={<Faq />} />
          <Route path="sign_agent" element={<SignAgent />} />
          <Route path="sign_up_agent" element={<SignUpAgent />} />
          <Route path="sign_in_succes" element={<SignInSuccess />} />
          <Route path="about_us" element={<AboutUs />} />
          <Route path="whishList" element={<WhishList/>} />

        </Route>

        {/* ADMIN LAYOUT + CHILD PAGES -> Outlet renders here */}
        <Route path="/admin/base" element={<BaseLayout />}>
          <Route index element={<Test />} />                 {/* /admin/base */}
          <Route path="dashboard" element={<Dashboard />} />      {/* Dashboard */}
          <Route path="properties" element={<Properties />} />     {/* All Properties */}
          <Route path="properties/add" element={<AddProperty />} /> {/* Add Property */}
          <Route path="properties/types" element={<Test />} /> 

          <Route path="all_bookings" element={<AllBookings />} /> 
          <Route path="registred_users" element={<RegisteredUsers />} /> 
          <Route path="transactions" element={<PaymentsTransactions />} /> 
          <Route path="promotion" element={<PromotionsDiscounts />} /> 
          <Route path="tenants/leases" element={<Test />} /> 

          <Route path="finance/rent" element={<Test />} /> 
          <Route path="finance/expenses" element={<Test />} /> 
          <Route path="finance/reports" element={<Test />} /> 

          <Route path="maintenance/requests" element={<Test />} /> 
          <Route path="maintenance/schedule" element={<Test />} /> 
          <Route path="maintenance/vendors" element={<Test />} /> 

          <Route path="communication/messages" element={<Test />} /> 
          <Route path="communication/announcements" element={<Test />} /> 

          <Route path="reports" element={<Test />} /> 
          <Route path="settings" element={<Test />} /> 
          <Route path="help" element={<Test />} /> 
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
