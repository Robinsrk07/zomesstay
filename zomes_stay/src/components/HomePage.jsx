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
        <div className="flex flex-col gap-4">
          <h2 className="text-[18px] lg:text-[36px] font-bold text-[#484848]">
            Latest on the <br /> Property Listing
          </h2>
          <hr className="h-2 w-40 bg-blue-800 border-0 rounded" />
        </div>

        <div className="flex flex-col items-start gap-2">
          <label htmlFor="locationSelect" className="text-xs lg:text-xl text-gray-400 font-medium">
            Select location
          </label>
          <select
            className="border border-gray-300 text-gray-600 w-[250px] lg:w-[400px] h-[40px] rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 px-2"
          >
            <option className="text-sm text-gray-400" value="">
              -- Choose a location --
            </option>
            <option className="text-sm text-gray-600" value="nyc">
              New York City
            </option>
            <option className="text-sm text-gray-600" value="la">
              Los Angeles
            </option>
          </select>
        </div>
      </div>

      {/* CardRow Section */}
      <div className="w-full">
        <CardRow searchParams={searchParams} />
      </div>

      {/* Banner Image */}
      <div className="px-4 md:px-16 py-8 w-full">
        <img src={img2} alt="" className="w-full h-[200px] md:h-[400px] rounded-lg object-cover" />
      </div>

      {/* Featured Properties Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full px-4 md:px-16 py-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-[18px] lg:text-[36px] font-bold text-[#484848]">
            Featured Properties <br /> on our Listing
          </h2>
          <hr className="h-2 w-40 bg-blue-800 border-0 rounded" />
        </div>
        <button className="bg-[#004AAD] text-white h-[40px] w-[140px] text-sm rounded-2xl hover:bg-[#003A8C] transition-colors">
          Discover More
        </button>
      </div>
      
      {/* FeatureCardRow */}
      <div className="w-full">
        <FeatureCardRow />
      </div>

      {/* Another Banner */}
      <div className="px-4 md:px-16 py-8 w-full">
        <img src={banner} alt="" className="w-full h-auto object-cover rounded-lg" />
      </div>

      {/* About Section */}
      <div className="w-full flex flex-col md:flex-row justify-between gap-8 px-4 md:px-16 py-8">
        <div className="w-full md:w-[60%] flex flex-col gap-6">
          <h1 className="font-bold text-[24px] lg:text-[36px] text-[#484848]">
            Discover More About <br />Zomestay
          </h1>  
          <hr className="h-2 w-40 bg-blue-800 border-0 rounded" />
          <p className="text-[#484848] text-[14px] lg:text-[16px] leading-relaxed">
            Zomestay isn't a widely recognized brand or term, so I couldn't find any reliable information about a company or concept by that name. If you're referring to something specific—like a travel service, startup, or homestay platform—could you share a bit more context or clarify what "Zomestay" is? That would help me find the right information or craft a tailored description for you.
          </p>  
          <div className="flex flex-row gap-6 mt-4">
            <button className="text-[#004AAD] text-[15px] font-bold hover:underline">
              Ask A Question
            </button>
            <button className="text-[#004AAD] text-[15px] font-bold hover:underline">
              Find A Property
            </button>
          </div>
          <button className="bg-[#004AAD] text-white h-[40px] w-[140px] text-sm rounded-2xl mt-4 hover:bg-[#003A8C] transition-colors">
            Discover More
          </button>
        </div>    
        <div className="w-full md:w-[40%] flex justify-center md:justify-end">
          <img src={img1} alt="" className="w-full max-w-[400px] h-[300px] md:h-[400px] object-cover rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
