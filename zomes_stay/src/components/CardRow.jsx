import Card from "./Card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { propertyService, mediaService } from "../services";
import { useSearch } from "../context/SearchContext";
import Loader from "./Loader";

export default function CardRow() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const { searchParams } = useSearch();

  const getProperties = async () => {
    setLoading(true);
    try {
      if (searchParams && (searchParams.checkIn || searchParams.checkOut)) {
        const response = await propertyService.searchProperties(searchParams);
        if (response?.data?.data) {
          const searchResults = response.data.data.map((result) => ({
            ...result.property,
            totalCapacity: result.totalCapacity,
            availableRooms: result.availableRooms,
          }));
          setProperties(searchResults);
        }
      } else {
        const response = await propertyService.getProperties();
        if (response?.data?.data) {
          setProperties(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProperties();
  }, [searchParams]);

  const getPropertyDetails = (property) => {
    const totalGuests =
      property?.roomTypes?.reduce((sum, roomType) => {
        return (
          sum + roomType.rooms.length * (roomType.Occupancy + roomType.extraBedCapacity)
        );
      }, 0) || 0;

    const totalRooms =
      property?.roomTypes?.reduce((sum, roomType) => sum + roomType.rooms.length, 0) || 0;

    const minPrice = Math.min(...(property?.roomTypes?.map((rt) => rt.basePrice) || [7899]));

    const propertyImage =
      property?.media?.find((m) => m.isFeatured)?.url || property?.media?.[0]?.url;
    const image_url = mediaService.getMedia(propertyImage);

    const locations = {
      "Taj resorts": "Wayanad, Kerala",
      "Wild Planet Resorts": "Munnar, Kerala",
      "Lavender Mist": "Vagamon, Kerala",
      "SUNRISE WALLEY": "Thekkady, Kerala",
    };

    return {
      image: image_url,
      title: property.title,
      location: locations[property.title] || "Kerala, India",
      rating: property.avgRating || "4.8",
      guests: totalGuests,
      rooms: totalRooms,
      price: minPrice,
      originalPrice: Math.floor(minPrice * 1.5),
    };
  };

  return (
    <div className="w-full" id="search-results">
      {loading ? (
        <Loader />
      ) : (
        <div
          className="
            flex flex-nowrap overflow-x-auto gap-4 px-4 pb-4
            sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6 sm:px-8 sm:overflow-visible
          "
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {properties.map((property, idx) => {
            const propertyDetails = getPropertyDetails(property);
            return (
              <div
                key={property.id || idx}
                onClick={() => navigate(`/app/properties/${property.id}`)}
                className="
                  flex-none w-[280px] sm:w-full cursor-pointer  
                  sm:flex-initial transition-transform hover:scale-105 
                "
              >
                <Card {...propertyDetails} bestRated={true} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
