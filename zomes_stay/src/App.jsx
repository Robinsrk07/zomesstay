import { BrowserRouter, Routes, Route } from "react-router-dom";
import Body from "./components/Body";
import HomePage from "./components/HomePage";
import LoginPage from "./pages/LoginPage";
//import SignUp from "./pages/signUp";
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
import HostLogin from "./pages/Host/HostLogin";
import HostDashboard from "./pages/Host/HostDashBoard";
import HostAllBookings from "./pages/Host/HostAllBookings";
import HostRegisteredUsers from "./pages/Host/HostRegisteredUsers";
import HostProperties from "./pages/Host/HostProperties";
import HostPaymentsTransactions from "./pages/Host/HostPayment";
import HostPromotionsDiscounts from "./pages/Host/HostPromotionsDiscounts";
import Inventory from "./pages/Host/inventory";
import MealPlan from "./pages/Host/MealPlan";
import { SearchProvider } from "./context/SearchContext";
import 'react-datepicker/dist/react-datepicker.css';

export default function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
      <ToastContainer position="top-center" autoClose={5000} />

      <Routes>
        {/* public */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/host"  element={<HostLogin />} />
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
          <Route path="dashboard" element={<Dashboard />} />      {/* Dashboard */}
          <Route path="properties" element={<Properties />} />     {/* All Properties */}
          <Route path="properties/add" element={<AddProperty />} /> {/* Add Property */}

          <Route path="all_bookings" element={<AllBookings />} /> 
          <Route path="registred_users" element={<RegisteredUsers />} /> 
          <Route path="transactions" element={<PaymentsTransactions />} /> 
          <Route path="promotion" element={<PromotionsDiscounts />} /> 
        

          
        </Route>


        <Route path="/host/base" element={<BaseLayout />}>
          <Route path="dashboard" element={<HostDashboard />} />      {/* Dashboard */}
          <Route path="host-properties" element={<HostProperties />} />     {/* All Properties */}
          <Route path="properties/add" element={<AddProperty />} /> {/* Add Property */}
          <Route path="inventory_management" element={<Inventory/>} />
          <Route path="meal_plans" element={<MealPlan/>} />

          <Route path="host-all_bookings" element={<HostAllBookings />} /> 
          <Route path="host-registred_users" element={<HostRegisteredUsers />} /> 
          <Route path="host-transactions" element={<HostPaymentsTransactions />} /> 
          <Route path="host-promotion" element={<HostPromotionsDiscounts />} /> 

         



        
        </Route>
      </Routes>
      </SearchProvider>
    </BrowserRouter>
  );
}
