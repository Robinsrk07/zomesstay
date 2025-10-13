import Banner from "./Banner";
import CardRow from "./CardRow";
import FeatureCardRow from "./FeatureCardRow";
import { useOutletContext } from "react-router-dom";
import banner from "../assets/banners/0935992b55432aba0a8696c56c5b0c3f00d9b8b5.png"
import img1 from "../assets/banners/1b6d1e7b93df1bfb92eedff58a32d2e265408692.png";
import img2 from "../assets/banners/685ec65edc35a4ee02667ecfe724f915d09f9fdd.png";

const HomePage = () => {
  const { searchParams } = useOutletContext();
  
  return (
    <div className="w-full flex flex-col justify-center items-center overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full px-4 md:px-16 py-8">
        

        <div className="flex flex-col items-start gap-2 w-full pt-8 md:w-auto">
          <label htmlFor="locationSelect" className="text-xs lg:text-xl text-gray-400 font-medium">
            Pick a Destination
          </label>
          
          {/* Scrollable Location List */}
          <div className="flex overflow-x-auto gap-4 pb-2 w-full md:w-auto">
            {[
              { name: "Lonavala", icon: "🏔️" },
              { name: "Karjat", icon: "🌄" },
              { name: "Kasauli", icon: "🏔️" },
              { name: "Ooty", icon: "🌿" },
              { name: "Mussoorie", icon: "⛰️" },
              { name: "Panchgani", icon: "🌺" },
              { name: "Udaipur", icon: "🏰" },
              { name: "Goa", icon: "🏖️" },
              { name: "Mumbai", icon: "🌊" },
              { name: "Pune", icon: "🌆" },
              { name: "Bangalore", icon: "🌳" },
              { name: "Hyderabad", icon: "🏛️" }
            ].map((location, index) => (
              <button
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors whitespace-nowrap shadow-sm"
              >
                <span className="text-lg">{location.icon}</span>
                <span className="text-sm font-medium text-gray-700">{location.name}</span>
              </button>
            ))}
          </div>
          
          <button className="text-xs lg:text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 flex items-center gap-1">
            <span>📍</span>
            Show nearby locations
          </button>
        </div>
      </div>

      {/* CardRow Section */}
      <div className="w-full">
        <CardRow searchParams={searchParams} />
      </div>

     

     
      
  


      
    </div>
  );
};

export default HomePage;
