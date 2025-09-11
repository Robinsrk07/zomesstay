import Header from "./Header";
import Footer from "./Footer";
import { Outlet, useLocation } from "react-router-dom";
import Card from "./Card";
import DefaultHeader from "./DefaultHeader";

export default function Body() {

  const location = useLocation()
  const isHome = location.pathname ==='/app/home'
    if(isHome){
      console.log("true")
    }
  return (
    <div className="min-h-screen w-full flex flex-col">

     {isHome ? <Header/>:<DefaultHeader/>}
       
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
