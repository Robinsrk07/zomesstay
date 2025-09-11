import apiService from "../api/apiService";
import { PROPERTY } from "../api/apiEndpoints";

const propertyService = {
    
getAmenities:()=>apiService.get(PROPERTY.AMENITIES),
getFacilities:()=>apiService.get(PROPERTY.FACILITIES),
getSafeties:()=>apiService.get(PROPERTY.SAFETIES),
getRoomTypes:()=>apiService.get(PROPERTY.ROOM_TYPES),
getRooms:()=>apiService.get(PROPERTY.ROOMS),
getPropertyTypes:()=>apiService.get(PROPERTY.PROPERTY_TYPE),    
getProperties:()=>apiService.get(PROPERTY.PROPERTY),

createAmenity:(amenity)=>apiService.post(PROPERTY.AMENITIES,amenity),
createFacility:(facility)=>apiService.post(PROPERTY.FACILITIES,facility),
createSafety:(safety)=>apiService.post(PROPERTY.SAFETIES,safety),
createRoomType:(roomType)=>apiService.post(PROPERTY.ROOM_TYPES,roomType),
createRoom:(propertyId,formData)=>apiService.post(`${PROPERTY.ROOMS}/${encodeURIComponent(propertyId)}/rooms`,formData),
createPropertyType:(propertyType)=>apiService.post(PROPERTY.PROPERTY_TYPE,propertyType),
createProperty:(formdata)=>apiService.post(PROPERTY.PROPERTY,formdata),

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
}



export default propertyService;
