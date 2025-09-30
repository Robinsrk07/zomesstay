import Card from "./Card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { propertyService ,mediaService} from "../services";
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
      console.log('Search params in getProperties:', searchParams); // Debug log
      
      if (searchParams && (searchParams.checkIn || searchParams.checkOut)) {
        const response = await propertyService.searchProperties(searchParams);
        console.log('Search response:', response); // Debug log
        if (response?.data?.data) {
          setProperties(response.data.data);
        }
      } else {
        const response = await propertyService.getProperties();
        if (response?.data?.data) {
          setProperties(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProperties();
  }, [searchParams]); // Re-fetch when search params change

  const getPropertyDetails = (property) => {
    // Calculate total guests
    const totalGuests = property?.roomTypes?.reduce((sum, roomType) => {
      return sum + (roomType.rooms.length * (roomType.Occupancy + roomType.extraBedCapacity));
    }, 0);

    // Calculate total rooms
    const totalRooms = property?.roomTypes?.reduce((sum, roomType) => {
      return sum + roomType.rooms.length;
    }, 0);

    // Find minimum base price
    const minPrice = Math.min(...(property?.roomTypes?.map(rt => rt.basePrice) || [7899]));

    // Get featured image URL or first image URL
    const propertyImage = property?.media?.find(m => m.isFeatured)?.url || 
                         property?.media?.[0]?.url;
    const image_url = mediaService.getMedia(propertyImage) 
                       
    // Demo locations based on property name
    const locations = {
      "Taj resorts": "Wayanad, Kerala",
      "Wild Planet Resorts": "Munnar, Kerala",
      "Lavender Mist": "Vagamon, Kerala",
      "SUNRISE WALLEY": "Thekkady, Kerala"
    };

    return {
      image: image_url,
      title: property.title,
      location: locations[property.title] || "Kerala, India",
      rating: property.avgRating || "4.8",
      guests: totalGuests || 0,
      rooms: totalRooms || 0,
      price: minPrice,
      originalPrice: Math.floor(minPrice * 1.5)
    };
  };

  return (
    <div className="w-full">
      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 px-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:px-8">
          {properties.map((property) => {
            const propertyDetails = getPropertyDetails(property);
            return (
              <div key={property.id} onClick={() => navigate(`/app/properties/${property.id}`)}>
                <Card {...propertyDetails} bestRated={true} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}