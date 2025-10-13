import React, { useState, useMemo, useEffect, useRef } from "react";
import AmenitiesList from "../components/AmenitiesList";
import SafetyHygieneList from "../components/SafetyHygieneList";
import ReservationBookingWidget from "../components/ReservationWidget";
import RoomSection from "../components/RoomSection";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useParams, useLocation } from "react-router-dom";
import { propertyDetailsService, mediaService } from "../services";
import processCalendarData from "../utils/calendarDataProcessor";
import {
  Wifi,
  Waves,
  Snowflake,
  Utensils,
  Dumbbell,
  Car,
  Tv,
  Coffee,
  ShowerHead,
  Fan,
  BedDouble,
  Key,
} from "lucide-react";
import {
  ShieldCheck,
  SprayCan,
  Thermometer,
  AlertTriangle,
  HandPlatter,
  Hand,
  Shield,
  FireExtinguisher,
  Camera,
  Users,
  Droplets,
  Eye,
} from "lucide-react";

const DetailsPage = () => {
  const { id } = useParams();
  const { state } = useLocation();

  const [modal, setModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [range, setRange] = useState({ start: null, end: null });
  const [media, setMedia] = useState([]);
  const mainImage = media[0];
  const sideImages = media.slice(1, 5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
  const [showRoomSelection, setShowRoomSelection] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]); // Array of { roomId, roomTypeId, mealPlanId, extraBeds }
  const roomSectionRef = useRef(null);
  const [mobileImageIndex, setMobileImageIndex] = useState(0);

  // Add touch handling for swipe gestures
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Party and nights derived from Reservation widget on Book Now
  const [party, setParty] = useState({
    adults: 0,
    childrenBed: 0,
    childrenNoBed: 0,
    infantsBed: 0,
    infantsNoBed: 0,
  });
  const [bookingNights, setBookingNights] = useState(0);

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

  const goPrev = () => {
    setCurrentIndex((i) => (i - 1 + media.length) % media.length);
  };

  const goNext = () => {
    setCurrentIndex((i) => (i + 1) % media.length);
  };

  const handleFetchDetials = async (id) => {
    setLoading(true);
    setError("");
    try {
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0)
        .toISOString()
        .split("T")[0];
      const params = {
        startDate,
        endDate,
      };

      const response = await propertyDetailsService.getPropertyDetails(id, params);

      console.log(response);
      const raw = response?.data?.data || null;
      const normalizedRoomTypes = (raw?.roomTypes || []).map((rt) => ({
        ...rt,
        // Normalize name so RoomSection shows the correct type label
        name: rt?.name || rt?.roomType?.name || rt?.title || rt?.typeName || "Room type",
      }));
      setPropertyDetails(raw ? { ...raw, roomTypes: normalizedRoomTypes } : null);
      setMedia((raw?.media || []).map((item) => item.url) || []);
    } catch (error) {
      console.error("Error fetching property details:", error);
      setError("Failed to load property details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookNowClick = (payload) => {
    setShowRoomSelection(true);
    if (payload) {
      const { guests, nights } = payload;
      setParty({
        adults: guests?.adults ?? 0,
        childrenBed: 0,
        childrenNoBed: guests?.children ?? 0,
        infantsBed: 0,
        infantsNoBed: 0,
      });
      setBookingNights(nights ?? 0);
    }
    setTimeout(() => {
      roomSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Calculate number of nights
  const calculateNights = () => {
    if (!range.start || !range.end) return 0;
    const diffTime = Math.abs(range.end - range.start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Toggle room selection (legacy support for widget). RoomSection owns pricing now.
  const toggleRoomSelection = (room, roomType) => {
    const roomId = room.id;
    const existing = selectedRooms.find((r) => r.roomId === roomId);

    if (existing) {
      // Remove room
      setSelectedRooms(selectedRooms.filter((r) => r.roomId !== roomId));
    } else {
      // Add room with default values
      setSelectedRooms([
        ...selectedRooms,
        {
          roomId: roomId,
          roomTypeId: roomType.id,
          roomName: room.name,
          roomCode: room.code,
          basePrice: roomType.basePrice,
          maxOccupancy: roomType.Occupancy,
          extraBedCapacity: roomType.extraBedCapacity,
          extraBedPrice: roomType.extraBedPrice || 500, // Default if not in data
          mealPlanId: null,
          extraBeds: 0,
        },
      ]);
    }
  };

  // Update meal plan for a specific room
  const updateRoomMealPlan = (roomId, mealPlanId) => {
    setSelectedRooms(selectedRooms.map((r) => (r.roomId === roomId ? { ...r, mealPlanId } : r)));
  };

  // Update extra beds for a specific room
  const updateRoomExtraBeds = (roomId, extraBeds) => {
    setSelectedRooms(
      selectedRooms.map((r) => (r.roomId === roomId ? { ...r, extraBeds: Math.max(0, Math.min(r.extraBedCapacity, extraBeds)) } : r))
    );
  };

  // Calculate total price (legacy; RoomSection has robust pricing)
  const calculateTotalPrice = () => {
    const nights = calculateNights();
    if (nights === 0) return 0;

    let total = 0;

    selectedRooms.forEach((room) => {
      // Room base price
      total += room.basePrice * nights;

      // Extra bed price
      if (room.extraBeds > 0) {
        total += room.extraBedPrice * room.extraBeds * nights;
      }

      // Meal plan price
      if (room.mealPlanId) {
        const mealPlan = propertyDetails?.MealPlan?.find((m) => m.id === room.mealPlanId);
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

  // Amenities and safety (static placeholders)
  const amenities = [
    { title: "Free Wi-Fi", icon: <Wifi /> },
    { title: "Swimming Pool", icon: <Waves /> },
    { title: "Air Conditioning", icon: <Snowflake /> },
    { title: "Restaurant", icon: <Utensils /> },
    { title: "Gym / Fitness Center", icon: <Dumbbell /> },
    { title: "Parking Facility", icon: <Car /> },
    { title: "Television", icon: <Tv /> },
    { title: "Coffee Maker", icon: <Coffee /> },
    { title: "Hot Shower", icon: <ShowerHead /> },
    { title: "Ceiling Fan", icon: <Fan /> },
    { title: "King Bed", icon: <BedDouble /> },
    { title: "Room Key Access", icon: <Key /> },
  ];

  const safetyAndHygiene = [
    { title: "Sanitized Rooms", icon: <SprayCan /> },
    { title: "Temperature Checks", icon: <Thermometer /> },
    { title: "Emergency Exit", icon: <AlertTriangle /> },
    { title: "First Aid Kit", icon: <HandPlatter /> },
    { title: "Hand Sanitizers", icon: <Hand /> },
    { title: "24/7 Security", icon: <Shield /> },
    { title: "Fire Extinguishers", icon: <FireExtinguisher /> },
    { title: "CCTV Surveillance", icon: <Camera /> },
    { title: "Trained Staff", icon: <Users /> },
    { title: "Disinfection Protocol", icon: <Droplets /> },
    { title: "Safety Inspected", icon: <ShieldCheck /> },
    { title: "Smoke Detector", icon: <Eye /> },
  ];

  // Location display (handle nested address object and fallbacks)
  const locationDisplay = useMemo(() => {
    const loc = propertyDetails?.location;
    if (!loc) return "Location not available";
    if (typeof loc === "string") return loc;
    const addr = loc.address || loc;
    const parts = [addr.street, addr.city, addr.state, addr.country, addr.zipCode].filter(Boolean);
    return parts.length ? parts.join(", ") : "Location not available";
  }, [propertyDetails]);

  // Map query from coordinates or address
  const mapQuery = useMemo(() => {
    const coords = propertyDetails?.location?.coordinates;
    if (
      coords &&
      typeof coords.latitude === "number" &&
      typeof coords.longitude === "number"
    ) {
      return `${coords.latitude},${coords.longitude}`;
    }
    const loc = propertyDetails?.location;
    if (!loc) return locationDisplay;
    if (typeof loc === "string") return loc;
    const addr = loc.address || loc;
    const parts = [addr.street, addr.city, addr.state, addr.country].filter(Boolean);
    return parts.join(", ");
  }, [propertyDetails, locationDisplay]);

  useEffect(() => {
    if (id) {
      handleFetchDetials(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Loading state skeleton
  if (loading) {
    return (
      <div className="p-4 md:p-10">
        <div className="animate-pulse space-y-4">
          <div className="hidden md:block h-[500px] bg-gray-200 rounded-lg" />
          <div className="md:hidden h-[300px] bg-gray-200 rounded-lg" />
          <div className="h-7 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Touch handling for swipe gestures
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setMobileImageIndex((prev) => (prev + 1) % (media.length || 1));
    } else if (isRightSwipe) {
      setMobileImageIndex((prev) => (prev - 1 + (media.length || 1)) % (media.length || 1));
    }
  };

  const title = propertyDetails?.title || "Property";
  const description = propertyDetails?.description || "";

  return (
    <>
      {/* Desktop View - Keep existing layout with guards */}
      <div className="hidden md:flex md:flex-row px-4 py-4 md:px-10 pb-4 gap-2">
        {/* Left: main image */}
        <div className="w-full md:w-1/2 h-[260px] md:h-[500px]">
          {mainImage ? (
            <img
              src={mediaService.getMedia(mainImage)}
              alt="Main"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
              No image available
            </div>
          )}
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
                  <span className="text-white text-lg font-semibold">+{remaining} Photos</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View - Carousel */}
      <div className="md:hidden px-4 py-2 ">
        {media.length > 0 ? (
          <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
            {/* Main carousel image */}
            <img
              src={mediaService.getMedia(media[mobileImageIndex])}
              alt={`Property ${mobileImageIndex + 1}`}
              className="w-full h-full object-cover"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />

            {/* Navigation arrows */}
            {media.length > 1 && (
              <>
                <button
                  onClick={() => setMobileImageIndex((prev) => (prev - 1 + media.length) % media.length)}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setMobileImageIndex((prev) => (prev + 1) % media.length)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-sm">
              {mobileImageIndex + 1} / {media.length}
            </div>

            {/* View all photos button */}
            {media.length > 1 && (
              <button
                onClick={() => setModal(true)}
                className="absolute bottom-3 right-3 bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                View all photos
              </button>
            )}

            {/* Dots indicator */}
            {media.length > 1 && media.length <= 10 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {media.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setMobileImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${index === mobileImageIndex ? "bg-white" : "bg-white/50"}`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-[300px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
            No images available
          </div>
        )}

        {/* Mobile thumbnail strip */}
        {media.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {media.slice(0, 8).map((img, index) => (
              <button
                key={index}
                onClick={() => setMobileImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === mobileImageIndex ? "border-blue-500" : "border-gray-200"
                }`}
              >
                <img
                  src={mediaService.getMedia(img)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {media.length > 8 && (
              <button
                onClick={() => setModal(true)}
                className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium"
              >
                +{media.length - 8}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-1 gap-6 md:flex-row md:px-10 py-2 md:gap-0">
        <div className="w-full border rounded-lg shadow-lg px-4 py-4 border-gray-200 md:w-[60%] md:border-none md:shadow-none flex flex-col gap-2">
          <h1 className="text-[18px] lg:text-[36px] font-bold text-[#484848]">{title}</h1>
          {description && (
            <p className="text-gray-600 text-[12px] md:text-[16px] leading-relaxed">{description}</p>
          )}
          <h2 className="text-[18px] lg:text-[22px] font-bold text-[#484848] mt-2">Amenities</h2>
          <AmenitiesList items={amenities} />
          <h2 className="text-[18px] lg:text-[22px] font-bold text-[#484848] mt-2">Safety and Hygiene</h2>
          <SafetyHygieneList items={safetyAndHygiene} />
          {error && (
            <div className="mt-2 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="w-full md:w-[40%] flex justify-center">
          <ReservationBookingWidget
            calendarData={calendarData}
            range={range}
            onRangeChange={setRange}
            onBookNow={handleBookNowClick}
            selectedRooms={selectedRooms}
            toggleRoomSelection={toggleRoomSelection}
            updateRoomMealPlan={updateRoomMealPlan}
            updateRoomExtraBeds={updateRoomExtraBeds}
            calculateTotalPrice={calculateTotalPrice}
            propertyDetails={propertyDetails}
          />
        </div>
      </div>

      {/* Room Selection Section */}
      <div ref={roomSectionRef}>
        {showRoomSelection && (
          <RoomSection
            propertyDetails={propertyDetails}
            selectedRooms={selectedRooms}
            toggleRoomSelection={toggleRoomSelection}
            updateRoomMealPlan={updateRoomMealPlan}
            updateRoomExtraBeds={updateRoomExtraBeds}
            calculateTotalPrice={calculateTotalPrice}
            range={range}
            party={party}
            nights={bookingNights}
          />
        )}
      </div>

      {/* Location Section */}
      <div className="p-[20px] md:p-[40px]">
        <h2 className="text-lg font-bold mb-3">Location</h2>
        <p className="text-gray-600 mb-4">{locationDisplay}</p>
        <div className="w-full h-[300px] rounded-xl overflow-hidden shadow">
          <iframe
            title="Property Location"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="flex justify-end gap-2 px-8">
        <h1 className="text-sm md:text-lg font-bold">Write Your Review</h1>
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
            <div key={r.id} className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white flex gap-4">
              <img src={r.avatar} alt={r.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h3 className="font-semibold">{r.name}</h3>
                {renderStars(r.rating)}
                <p className="text-gray-600 mt-2">{r.review}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="relative bg-white rounded-xl w-full max-w-5xl h-[95vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-3 top-3 rounded-md bg-black/80 text-white px-3 py-1 text-sm z-10" onClick={() => setModal(false)}>
              Close
            </button>

            <div className="flex flex-row items-center justify-between gap-1 p-2">
              <button className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 p-2" onClick={goPrev} aria-label="Previous image">
                ◀
              </button>

              <div className="flex items-center justify-center flex-1">
                <TransformWrapper>
                  <TransformComponent>
                    {media[currentIndex] ? (
                      <img
                        src={mediaService.getMedia(media[currentIndex])}
                        alt={`Gallery ${currentIndex + 1}`}
                        className="object-cover w-full h-[500px] rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-[500px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        No image
                      </div>
                    )}
                  </TransformComponent>
                </TransformWrapper>
              </div>

              <button className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 p-2" onClick={goNext} aria-label="Next image">
                ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DetailsPage;
