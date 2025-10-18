import apiService from "../../api/apiService";
import { PROPERTY,HOST_PROPERTY } from "../../api/apiEndpoints";

const propertyService = {
    
getAmenities:()=>apiService.get(PROPERTY.AMENITIES),
getFacilities:()=>apiService.get(PROPERTY.FACILITIES),
getSafeties:()=>apiService.get(PROPERTY.SAFETIES),
getRoomTypes:()=>apiService.get(PROPERTY.ROOM_TYPES),
getRooms:()=>apiService.get(PROPERTY.ROOMS),
getCreationFormData:()=>apiService.get(PROPERTY.PROPERTY_UTILS),
getValidate:()=>apiService.get(PROPERTY.PROPERTY_VALIDATE),
validatePropertyData:(data)=>apiService.post(PROPERTY.PROPERTY_VALIDATE, data),
createProperty:(formdata)=>apiService.post(PROPERTY.PROPERTY_CREATE,formdata),


getPropertyTypes:()=>apiService.get(PROPERTY.PROPERTY_TYPE),    
getProperties:()=>apiService.get(PROPERTY.PROPERTY),
getHostProperties:(id)=>apiService.get(`${HOST_PROPERTY.PROPERTY}/${encodeURIComponent(id)}`),
getPropertyRoomTypes:(id)=>apiService.get(`${PROPERTY.PROPERTY_ROOM_TYPES}/${encodeURIComponent(id)}`),
getPropertyByQuery:(query)=>apiService.get(`${PROPERTY.PROPERTY_BY_QUERY}/${encodeURIComponent(query)}`),

searchProperties: (params) => {
    console.log('Search params:', params); // Debug log
    return apiService.get(PROPERTY.PROPERTY_BY_QUERY, { params });
},

createAmenity:(amenity)=>apiService.post(PROPERTY.AMENITIES,amenity),
createFacility:(facility)=>apiService.post(PROPERTY.FACILITIES,facility),
createSafety:(safety)=>apiService.post(PROPERTY.SAFETIES,safety),
createRoomType:(roomType)=>apiService.post(PROPERTY.ROOM_TYPES,roomType),
createRoom:(propertyId,formData)=>apiService.post(`${PROPERTY.ROOMS}/${encodeURIComponent(propertyId)}/rooms`,formData),
createPropertyType:(propertyType)=>apiService.post(PROPERTY.PROPERTY_TYPE,propertyType),
createProperty:(formdata)=>apiService.post(PROPERTY.PROPERTY_CREATE,formdata),

// New room configuration functions
getRoomConfigurations:(propertyId)=>apiService.get(`${PROPERTY.ROOM_CONFIGURATIONS}/${encodeURIComponent(propertyId)}/room-configurations`),
updateRooms:(propertyId,formData)=>apiService.put(`${PROPERTY.UPDATE_ROOMS}/${encodeURIComponent(propertyId)}/rooms`,formData),

updateAmenity:(amenityId,amenity)=>apiService.put(`${PROPERTY.AMENITIES}/${encodeURIComponent(amenityId)}`,amenity),
updateFacility:(facilityId,facility)=>apiService.put(`${PROPERTY.FACILITIES}/${encodeURIComponent(facilityId)}`,facility),
updateSafety:(safetyId,safety)=>apiService.put(`${PROPERTY.SAFETIES}/${encodeURIComponent(safetyId)}`,safety),
updateRoomType:(roomTypeId,roomType)=>apiService.put(`${PROPERTY.ROOM_TYPES}/${encodeURIComponent(roomTypeId)}`,roomType),
updateRoom:(propertyId,roomId,formData)=>apiService.put(`${PROPERTY.ROOMS}/${encodeURIComponent(propertyId)}/rooms/${encodeURIComponent(roomId)}`,formData),
updatePropertyType:(propertyTypeId,propertyType)=>apiService.put(`${PROPERTY.PROPERTY_TYPE}/${encodeURIComponent(propertyTypeId)}`,propertyType),
updateProperty:(propertyId,formdata)=>apiService.put(`${PROPERTY.PROPERTY}/${encodeURIComponent(propertyId)}`,formdata),

deleteAmenity:(amenityId)=>apiService.delete(`${PROPERTY.AMENITIES}/${encodeURIComponent(amenityId)}`),
deleteFacility:(facilityId)=>apiService.delete(`${PROPERTY.FACILITIES}/${encodeURIComponent(facilityId)}`),
deleteSafety:(safetyId)=>apiService.delete(`${PROPERTY.SAFETIES}/${encodeURIComponent(safetyId)}`),
deleteRoomType:(roomTypeId)=>apiService.delete(`${PROPERTY.ROOM_TYPES}/${encodeURIComponent(roomTypeId)}`),
deleteRoom:(propertyId,roomId)=>apiService.delete(`${PROPERTY.ROOMS}/${encodeURIComponent(propertyId)}/rooms/${encodeURIComponent(roomId)}`),
deletePropertyType:(propertyTypeId)=>apiService.delete(`${PROPERTY.PROPERTY_TYPE}/${encodeURIComponent(propertyTypeId)}`),
deleteProperty:(propertyId)=>apiService.delete(`${PROPERTY.PROPERTY}/${encodeURIComponent(propertyId)}`),

getPropertyDetails: (id) => apiService.get(`${PROPERTY.PROPERTY}/${id}`),
getPropertyAvailability: (id, dates) => apiService.get(`${PROPERTY.PROPERTY}/${id}/availability`, { params: dates }),
getPropertyRates: (id, dates) => apiService.get(`${PROPERTY.PROPERTY}/${id}/rates`, { params: dates }),
getPropertyReviews: (id) => apiService.get(`${PROPERTY.PROPERTY}/${id}/reviews`),

}
 


export default propertyService;
