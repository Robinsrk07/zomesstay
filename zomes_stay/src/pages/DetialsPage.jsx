import React, { useState ,useMemo,useEffect} from "react";
import FacilityCardRow from "../components/FacilityCardRow";
import AmenitiesList from "../components/AmenitiesList";
import SafetyHygieneList from "../components/SafetyHygieneList";
import ReservationCalendarPanel from "../components/ReservationCalendarPanel";
import RoomCard from "../components/RoomCard";
import RoomCardData from "../data/RoomCard.json";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Star } from "lucide-react";
import { useParams, useLocation } from "react-router-dom";
import { propertyDetailsService ,mediaService } from "../services";
import processCalendarData from "../utils/calendarDataProcessor";
import { useRef } from "react";

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



  




const DetailsPage = () => {
  
  const { id } = useParams();
  const { state } = useLocation();
  const [modal, setModal] = useState(false);
  const [deluxe,setDeluxe] = useState(true)
  const [premium,setPremium] = useState(false)
  const [suite,setSuite] = useState(false)
  const [currentIndex,setCurrentIndex] = useState(0)
  const [range, setRange] = useState({ start: null, end: null });
  const [media,setMedia] = useState([])
  const mainImage = media[0];
  const sideImages = media.slice(1, 5);
  const[loading,setLoading]=useState(false)
  const remaining = Math.max(0, media.length - 5);
  const [reviews] = useState([
    {
      id: 1,
      name: "John Doe",
      rating: 5,
      review: "Amazing place! Highly recommend.",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    {
      id: 2,
      name: "Jane Smith",
      rating: 4,
      review: "Very good, but room for improvement.",
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    {
      id: 3,
      name: "Alice Johnson",
      rating: 5,
      review: "Loved it! Will come again.",
      avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    {
      id: 4,
      name: "Bob Brown",
      rating: 3,
      review: "It's okay, not great.",
      avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    },
    {
      id: 5,
      name: "Charlie Green",
      rating: 4,
      review: "Nice place, friendly staff.",
      avatar: "https://randomuser.me/api/portraits/men/5.jpg",
    },
  ]);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState(null);
  const [extraBed, setExtraBed] = useState(0);
  const [showRoomSelection, setShowRoomSelection] = useState(false);
const [selectedRooms, setSelectedRooms] = useState([]); // Array of { roomId, roomTypeId, mealPlanId, extraBeds }
const roomSectionRef = useRef(null);

  console.log(propertyDetails)


  console.log(propertyDetails)
  console.log(mainImage)
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
  setCurrentIndex((i) => (i - 1 + media.length) % media.length);
  }

  const goNext=()=>{
  setCurrentIndex((i) => (i + 1) % media.length);

  }
 
const handleFetchDetials = async(id) => {

  console.log("Fetching details for property ID:", id);
  setLoading(true);
  try {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];    
    const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0)
      .toISOString().split('T')[0];
    const params = {
      startDate,
      endDate
    };

    console.log(params)

    const response = await propertyDetailsService.getPropertyDetails(id, params);
    setPropertyDetails(response?.data?.data);
    setMedia(response?.data?.data?.media.map((item) => item.url) || []);
  } catch (error) {
    console.error("Error fetching property details:", error);
  } finally {
    setLoading(false);
  }
}
const handleBookNowClick = () => {
  if (range.start && range.end) {
    setShowRoomSelection(true);
    // Scroll to room section after state update
    setTimeout(() => {
      roomSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
};

// Calculate number of nights
const calculateNights = () => {
  if (!range.start || !range.end) return 0;
  const diffTime = Math.abs(range.end - range.start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Toggle room selection
const toggleRoomSelection = (room, roomType) => {
  const roomId = room.id;
  const existing = selectedRooms.find(r => r.roomId === roomId);
  
  if (existing) {
    // Remove room
    setSelectedRooms(selectedRooms.filter(r => r.roomId !== roomId));
  } else {
    // Add room with default values
    setSelectedRooms([...selectedRooms, {
      roomId: roomId,
      roomTypeId: roomType.id,
      roomName: room.name,
      roomCode: room.code,
      basePrice: roomType.basePrice,
      maxOccupancy: roomType.Occupancy,
      extraBedCapacity: roomType.extraBedCapacity,
      extraBedPrice: roomType.extraBedPrice || 500, // Default if not in data
      mealPlanId: null,
      extraBeds: 0
    }]);
  }
};

// Update meal plan for a specific room
const updateRoomMealPlan = (roomId, mealPlanId) => {
  setSelectedRooms(selectedRooms.map(r => 
    r.roomId === roomId ? { ...r, mealPlanId } : r
  ));
};

// Update extra beds for a specific room
const updateRoomExtraBeds = (roomId, extraBeds) => {
  setSelectedRooms(selectedRooms.map(r => 
    r.roomId === roomId ? { ...r, extraBeds: Math.max(0, Math.min(r.extraBedCapacity, extraBeds)) } : r
  ));
};

// Calculate total price
const calculateTotalPrice = () => {
  const nights = calculateNights();
  if (nights === 0) return 0;
  
  let total = 0;
  
  selectedRooms.forEach(room => {
    // Room base price
    total += room.basePrice * nights;
    
    // Extra bed price
    if (room.extraBeds > 0) {
      total += room.extraBedPrice * room.extraBeds * nights;
    }
    
    // Meal plan price
    if (room.mealPlanId) {
      const mealPlan = propertyDetails?.MealPlan.find(m => m.id === room.mealPlanId);
      if (mealPlan) {
        // Assuming meal plan is per person per night
        const guests = room.maxOccupancy + room.extraBeds;
        total += mealPlan.adult_price * guests * nights;
      }
    }
  });
  
  return total;
};

const calendarData = processCalendarData(propertyDetails || { roomTypes: [], specialRates: [] });
const ListAmenities = propertyDetails?.amenities || [];
const amenities =  ListAmenities.map((item)=>{return {title:item.name , icon:mediaService.getMedia(item.icon)}})
const ListSafety = propertyDetails?.safeties || [];
const safetyAndHygiene =  ListSafety.map((item)=>{return {title:item.name , icon:mediaService.getMedia(item.icon)}})


 // const safetyAndHygiene = propertyDetails?.safeties || [];
// const safetyAndHygiene = propertyDetails?.safeties || [];
// const facilities = propertyDetails?.facilities || [];
// const location = propertyDetails?.location || "Unknown Location";
// const propertytype = propertyDetails?.propertyType || "Unknown Type";
// const reviewCount= propertyDetails?.reviews?.length || 0;
// const title = propertyDetails?.title || "Property Title";
// const specialrate = Detials?.specialRate || "0";
// const rulesandpolicy = Detials?.rulesAndPolicy || "No specific rules.";
// const specialRate = Detials?.specialRate || "0";
// const availbility = Detials?.roomtypes?.rooms?.availability || "No availability info";


useEffect(()=>{
  if(id){
    handleFetchDetials(id)
  }
},[id])

  // Show basic info while loading
  if (loading && state?.basicInfo) {
    return <BasicPropertyInfo {...state.basicInfo} />;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row px-4 py-4 md:px-10 pb-4 gap-2">
        {/* Left: main image */}
        <div className="w-full md:w-1/2 h-[260px] md:h-[500px] ">
          <img
            src={mediaService.getMedia(mainImage)}
            alt="Main"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Right: 2x2 grid */}
        <div className="w-full md:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-2">
          {sideImages.map((img, i) => (
            <div key={i} className="relative w-full h-[180px] md:h-[245px]">
              <img
                src={mediaService.getMedia(img)}
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
          <h1 className="text-[18px] lg:text-[36px] font-bold text-[#484848]">{propertyDetails?.title}</h1>
          <p className="text-gray-400">{propertyDetails?.location}</p>
          <div className=" rounded-md border border-gray-200 w-[90%] m-2 p-2">
          <FacilityCardRow facilities={facilities} />
          </div>

          <h1 className="text-[18px] lg:text-[36px] font-bold text-[#484848]">Resort Description</h1>
          <p className="text-gray-400">{propertyDetails?.description}</p>
          <h1 className="text-[18px] lg:text-[22px] font-bold text-[#484848]"> Offered Amenities</h1>
          <AmenitiesList items={amenities} />

          <h1 className="text-[18px] lg:text-[22px] font-bold text-[#484848]">Saftey and Hygiene</h1>
          <SafetyHygieneList items={safetyAndHygiene} />


       </div>
       <div className="w-full  md:w-[40%]  flex justify-center">
<ReservationCalendarPanel 
  calendarData={calendarData}
  onBookNow={(selectedRange) => {
    setRange(selectedRange);
    setShowRoomSelection(true);
    setTimeout(() => {
      roomSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }}
/>       </div>
      

      </div>

 {showRoomSelection && (
  <div ref={roomSectionRef} className="bg-gray-50 p-4 md:p-8 scroll-mt-20">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="bg-gradient-to-r from-[#004AAD] to-[#0066CC] px-6 py-5">
          <h1 className="text-2xl font-semibold text-white">Availability</h1>
          <p className="text-blue-100 text-sm mt-1">
            {range.start && range.end && (
              <>Check-in: {range.start.toLocaleDateString()} • Check-out: {range.end.toLocaleDateString()} • {calculateNights()} nights</>
            )}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#004AAD] text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">Room type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Number of guests</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Price for {calculateNights()} nights</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Your choices</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Select rooms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {propertyDetails?.roomTypes.map((roomType) => {
                const selectedForType = selectedRooms.filter(r => r.roomTypeId === roomType.id);
                
                return (
                  <tr key={roomType.id} className="hover:bg-gray-50">
                    {/* Room Type */}
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-[#004AAD] text-base mb-2">{roomType.roomType.name}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>1 queen bed</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span>17 m²</span>
                          <span>•</span>
                          <span>Air conditioning</span>
                          <span>•</span>
                          <span>Private bathroom</span>
                        </div>
                      </div>
                    </td>

                    {/* Number of Guests */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-1">
                        {[...Array(roomType.Occupancy)].map((_, i) => (
                          <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        ))}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-gray-900">₹{(roomType.basePrice * calculateNights()).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">+ ₹{Math.round((roomType.basePrice * calculateNights()) * 0.12).toLocaleString()} taxes and fees</div>
                      </div>
                    </td>

                    {/* Your Choices */}
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-700 font-medium">Free cancellation</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-700">No prepayment needed</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-700">No credit card needed</span>
                        </div>
                      </div>
                    </td>

                    {/* Select Rooms */}
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-3">
                        {roomType.rooms.map((room) => {
                          const isSelected = selectedRooms.some(r => r.roomId === room.id);
                          const selectedRoom = selectedRooms.find(r => r.roomId === room.id);

                          return (
                            <div key={room.id} className={`border rounded-lg p-3 ${isSelected ? 'border-[#004AAD] bg-blue-50' : 'border-gray-200'}`}>
                              {/* Room Checkbox */}
                              <label className="flex items-center gap-2 cursor-pointer mb-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleRoomSelection(room, roomType)}
                                  className="w-4 h-4 text-[#004AAD] rounded border-gray-300 focus:ring-[#004AAD]"
                                />
                                <span className="font-medium text-sm">{room.name}</span>
                              </label>

                              {/* Options when selected */}
                              {isSelected && (
                                <div className="space-y-3 pl-6 border-t border-gray-200 pt-3">
                                  {/* Extra Beds */}
                                  {roomType.extraBedCapacity > 0 && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Extra Beds (₹{roomType.extraBedPrice || 500}/night)
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => updateRoomExtraBeds(room.id, selectedRoom.extraBeds - 1)}
                                          disabled={selectedRoom.extraBeds === 0}
                                          className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded text-sm font-bold"
                                        >
                                          −
                                        </button>
                                        <span className="w-8 text-center text-sm font-semibold">{selectedRoom.extraBeds}</span>
                                        <button
                                          onClick={() => updateRoomExtraBeds(room.id, selectedRoom.extraBeds + 1)}
                                          disabled={selectedRoom.extraBeds >= roomType.extraBedCapacity}
                                          className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded text-sm font-bold"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Meal Plan */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Meal Plan</label>
                                    <select
                                      value={selectedRoom.mealPlanId || ''}
                                      onChange={(e) => updateRoomMealPlan(room.id, e.target.value ? parseInt(e.target.value) : null)}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#004AAD] focus:border-[#004AAD]"
                                    >
                                      <option value="">No meal plan</option>
                                      {propertyDetails?.MealPlan.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                          {plan.name} - ₹{plan.adult_price}/person
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reserve Button */}
      {selectedRooms.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total for {selectedRooms.length} room(s) • {calculateNights()} nights</div>
              <div className="text-3xl font-bold text-[#004AAD]">₹{calculateTotalPrice().toLocaleString()}</div>
            </div>
            <button
              className="bg-[#004AAD] hover:bg-[#003380] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              onClick={() => {
                console.log('Reservation data:', {
                  checkIn: range.start,
                  checkOut: range.end,
                  nights: calculateNights(),
                  rooms: selectedRooms,
                  total: calculateTotalPrice()
                });
              }}
            >
              I'll reserve
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

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
                    src={mediaService.getMedia(media[currentIndex])}
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

export default DetailsPage;

