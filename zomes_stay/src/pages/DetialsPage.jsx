import React, { useState ,useMemo} from "react";
import FacilityCardRow from "../components/FacilityCardRow";
import AmenitiesList from "../components/AmenitiesList";
import SafetyHygieneList from "../components/SafetyHygieneList";
import ReservationCalendarPanel from "../components/ReservationCalendarPanel";
import RoomCard from "../components/RoomCard";
import RoomCardData from "../data/RoomCard.json";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Star } from "lucide-react";


const facilities = [
  { title: "Restaurants",   
    image: "https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=800&q=80" },

  { title: "Swimming Pool", 
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80" },

  { title: "Parking",       
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80" },

  { title: "Free Wi-Fi",    
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80" },

  { title: "Gym",           
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80" },

  { title: "Spa",           
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80" },
];

export const safetyAndHygiene = [
    { title: "Daily Cleaning",              icon: "https://api.iconify.design/mdi:broom.svg" },
    { title: "Disinfection & Sterilization",icon: "https://api.iconify.design/mdi:spray-bottle.svg" },
    { title: "Fire Extinguishers",          icon: "https://api.iconify.design/mdi:fire-extinguisher.svg" },
    { title: "Smoke Detectors",             icon: "https://api.iconify.design/mdi:smoke-detector.svg" },
    { title: "First Aid Kit",               icon: "https://api.iconify.design/mdi:first-aid-kit.svg" },
    { title: "CCTV (Common Areas)",         icon: "https://api.iconify.design/mdi:cctv.svg" },
    { title: "Hand Sanitizer Stations",     icon: "https://api.iconify.design/mdi:hand-water.svg" },
    { title: "Contactless Check-in",        icon: "https://api.iconify.design/mdi:cellphone-nfc.svg" },
    { title: "Emergency Exits",             icon: "https://api.iconify.design/mdi:exit-run.svg" },
    { title: "Air Purifiers",               icon: "https://api.iconify.design/mdi:air-purifier.svg" },
  ];
  
export const amenities = [
    { title: "Kitchen",          icon: "https://api.iconify.design/lucide:utensils.svg" },
    { title: "Playgrounds",      icon: "https://api.iconify.design/lucide:bike.svg" },
    { title: "Laundry Facilities",icon: "https://api.iconify.design/lucide:shirt.svg" },
    { title: "Fitness",          icon: "https://api.iconify.design/lucide:dumbbell.svg" },
    { title: "Green Spaces",     icon: "https://api.iconify.design/lucide:trees.svg" },
    { title: "EV Charging",      icon: "https://api.iconify.design/lucide:plug-zap.svg" },
    { title: "Parking",          icon: "https://api.iconify.design/lucide:car.svg" },
    { title: "Free Wi-Fi",       icon: "https://api.iconify.design/lucide:wifi.svg" },
    { title: "Swimming Pool",    icon: "https://api.iconify.design/lucide:waves.svg" },
    { title: "Pet Friendly",     icon: "https://api.iconify.design/lucide:paw-print.svg" },
  ];
  

const dummyImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
];

export default function Detials() {
  const [modal, setModal] = useState(false);
  const [deluxe,setDeluxe] = useState(true)
  const [premium,setPremium] = useState(false)
  const [suite,setSuite] = useState(false)
  // const [img,setImg] =useState(dummyImages[0])
  const [currentIndex,setCurrentIndex] = useState(0)
  const mainImage = dummyImages[0];
  const sideImages = dummyImages.slice(1, 5);
  const remaining = Math.max(0, dummyImages.length - 5);
  // const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviews] = useState([
    {
      id: 1,
      name: "Arun Kumar",
      avatar: "https://i.pravatar.cc/50?img=1",
      rating: 4,
      review: "The property was clean and well maintained. Had a comfortable stay."
    },
    {
      id: 2,
      name: "Sneha R",
      avatar: "https://i.pravatar.cc/50?img=2",
      rating: 5,
      review: "Amazing experience! Great location, friendly host and superb amenities."
    },
    {
      id: 3,
      name: "Rahul M",
      avatar: "https://i.pravatar.cc/50?img=3",
      rating: 3,
      review: "Decent stay. Could improve the cleanliness and service speed."
    }
  ]);
    // Calculate average rating
  const avgRating = useMemo(() => {
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

   const renderStars = (count) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={18}
            className={i < count ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  const goPrev =()=>{
  setCurrentIndex((i) => (i - 1 + dummyImages.length) % dummyImages.length);
  }

  const goNext=()=>{
  setCurrentIndex((i) => (i + 1) % dummyImages.length);

  }


  return (
    <>
      <div className="flex flex-col md:flex-row px-4 py-4 md:px-10 pb-4 gap-2">
        {/* Left: main image */}
        <div className="w-full md:w-1/2 h-[260px] md:h-[500px] ">
          <img
            src={mainImage}
            alt="Main"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Right: 2x2 grid */}
        <div className="w-full md:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-2">
          {sideImages.map((img, i) => (
            <div key={i} className="relative w-full h-[180px] md:h-[245px]">
              <img
                src={img}
                alt={`Property ${i + 2}`}
                className="w-full h-full object-cover rounded-lg"
              />

             
              {i === sideImages.length - 1 && remaining > 0 && (
                <button
                  onClick={() => setModal(true)}
                  className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center cursor-pointer"
                  aria-label="Open photo gallery"
                >
                  <span className="text-white text-lg font-semibold">
                    +{remaining} Photos
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div> 

      <div className="flex flex-col  md:flex-row p-[40px]  gap-4 ">
     
       <div className=" w-full md:w-[60%]  flex flex-col gap-4">
          <h1 className="text-[18px] lg:text-[36px] font-bold text-[#484848]">Majestic Crest Resort </h1>
          <p className="text-gray-400">kalpetta,Wayanad</p>
          <div className=" rounded-md border border-gray-200 w-[90%] m-2 p-2">
          <FacilityCardRow facilities={facilities} />
          </div>

          <h1 className="text-[18px] lg:text-[36px] font-bold text-[#484848]">Resort Description</h1>
          <p className="text-gray-400">lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <h1 className="text-[18px] lg:text-[22px] font-bold text-[#484848]"> Offered Amenities</h1>
          <AmenitiesList items={amenities} />

          <h1 className="text-[18px] lg:text-[22px] font-bold text-[#484848]">Saftey and Hygiene</h1>
          <SafetyHygieneList items={safetyAndHygiene} />


       </div>
       <div className="w-full  md:w-[40%]  flex justify-center">
        <ReservationCalendarPanel/>
       </div>
      

      </div>

         <div className="flex flex-col p-[20px] md:p-[40px] gap-2 md:gap-4">
  <h1 className="text-[18px] lg:text-[25px] font-bold text-[#484848] text-center">
    Room Types
  </h1>
  <div className="flex flex-col md:flex-row items-center justify-center gap-4">
    
    <button
      onClick={() => { setDeluxe(true); setPremium(false); setSuite(false); }}
      className={`font-bold ${
        deluxe ? "bg-[#004AAD] text-white" : "bg-white text-[#484848]"
      } text-xs text-center h-[30px] w-full md:w-[120px] border rounded-full border-gray-200`}
    >
      Deluxe Rooms
    </button>

    <button
      onClick={() => { setDeluxe(false); setPremium(true); setSuite(false); }}
      className={`font-bold ${
        premium ? "bg-[#004AAD] text-white" : "bg-white text-[#484848]"
      } text-xs text-center h-[30px] w-full md:w-[120px] border rounded-full border-gray-200`}
    >
      Premium Rooms
    </button>

    <button
      onClick={() => { setDeluxe(false); setPremium(false); setSuite(true); }}
      className={`font-bold ${
        suite ? "bg-[#004AAD] text-white" : "bg-white text-[#484848]"
      } text-xs text-center h-[30px] w-full md:w-[120px] border rounded-full border-gray-200`}
    >
      Suite Rooms
    </button>
  </div>
</div>

<div className="p-[20px] md:p-[40px] flex flex-col gap-4" >

{RoomCardData.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
</div>

<div className="p-[20px] md:p-[40px]">
  <h2 className="text-lg font-bold mb-3">Location</h2>
  <div className="w-full h-[300px] rounded-xl overflow-hidden shadow">
    <iframe
      title="Property Location"
      width="100%"
      height="100%"
      frameBorder="0"
      style={{ border: 0 }}
      src="https://www.google.com/maps?q=Kalpetta,Wayanad&output=embed"
      allowFullScreen
    ></iframe>
  </div>
</div>

<div className="flex justify-end gap-2 px-8">
  <h1 className="text-sm md:text-lg font-bold">Write Your Review</h1>
  {/* <button onClick={() => setReviewModalOpen(true)} className="bg-blue-600 rounded text-xs text-white w-[100px]">click here</button> */}
</div>

<div className="p-[20px] md:p-[40px]">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Reviews & Ratings</h2>
        <div className="flex items-center gap-2">
          {renderStars(Math.round(avgRating))}
          <span className="text-sm font-medium text-gray-700">
            {avgRating} / 5 ({reviews.length} reviews)
          </span>
        </div>
 </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white flex gap-4"
          >
            <img
              src={r.avatar}
              alt={r.name}
              className="w-12 h-12 rounded-full object-cover"
            />

            <div>
              <h3 className="font-semibold">{r.name}</h3>
              {renderStars(r.rating)}
              <p className="text-gray-600 mt-2">{r.review}</p>
            </div>
          </div>
        ))}
      </div>
    </div>


      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setModal(false)} 
        >
          <div
            className="relative bg-white rounded-xl w-full max-w-5xl  h-[95vh] overflow-auto "
            onClick={(e) => e.stopPropagation()} 
          >
            <button
              className="absolute right-3 top-3 rounded-md bg-black/80 text-white px-3 py-1 text-sm"
              onClick={() => setModal(false)}
            >
              Close
            </button>

            <div className="flex flex-row items-center justify-between gap-1   p-2">
             <button
                  className=" rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800"
                  onClick={goPrev}
                  aria-label="Previous image"
                >
                  ◀
                </button>

            <div className="grid grid-rows-1 gap-4 mt-8  flex items-center justify-center">
            <TransformWrapper>

                    <TransformComponent>

                  <img
              
                  src={dummyImages[currentIndex]}
                  alt={`Gallery `}
                  className=" object-cover w-full h-[500px] rounded-lg"
                />

                    </TransformComponent>

            </TransformWrapper>
               
              
            </div>
             <button
                  className=" rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800"
                  onClick={goNext}
                  aria-label="Next image"
                >
                  ▶
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
