// src/routes/adminRoutes/property.routes.js
const express = require('express');
const PropertyRoute = express.Router();

const { uploadImage, uploadVideo, uploadMedia } = require('../../config/multer');
const PropertyController = require('../../controllers/adminController/property.controller');

/* --------------------------- AMENITIES --------------------------- */
// create / list / update / delete
PropertyRoute.post('/amenities', uploadImage.single('icon'), PropertyController.createAmenity);
PropertyRoute.get('/amenities', PropertyController.getAmenities);
PropertyRoute.patch('/amenities/:id', uploadImage.single('icon'), PropertyController.updateAmenity);
PropertyRoute.delete('/amenities/:id', PropertyController.deleteAmenity);

/* --------------------------- FACILITIES -------------------------- */
PropertyRoute.post('/facilities', uploadImage.single('icon'), PropertyController.createFacility);
PropertyRoute.get('/facilities', PropertyController.getFacilities);
PropertyRoute.put('/facilities/:id', uploadImage.single('icon'), PropertyController.updateFacility);
PropertyRoute.delete('/facilities/:id', PropertyController.deleteFacility);

/* ----------------------- SAFETY & HYGIENE ------------------------ */
PropertyRoute.post('/safety-hygiene', uploadImage.single('icon'), PropertyController.createSafetyHygiene);
PropertyRoute.get('/safety-hygiene', PropertyController.getSafetyHygienes);
PropertyRoute.put('/safety-hygiene/:id', uploadImage.single('icon'), PropertyController.updateSafetyHygiene);
PropertyRoute.delete('/safety-hygiene/:id', PropertyController.deleteSafetyHygiene);

/* ------------------------- PROPERTY TYPES ------------------------ */
PropertyRoute.post('/property-types', PropertyController.createPropertyType);
PropertyRoute.get('/property-types', PropertyController.getPropertyTypes);
PropertyRoute.put('/property-types/:id', PropertyController.updatePropertyType);
PropertyRoute.delete('/property-types/:id', PropertyController.deletePropertyType);

/* --------------------------- ROOM TYPES -------------------------- */
PropertyRoute.post('/room-types', PropertyController.createRoomType);
PropertyRoute.get('/room-types', PropertyController.getRoomTypes);
PropertyRoute.put('/room-types/:id', PropertyController.updateRoomType);
PropertyRoute.delete('/room-types/:id', PropertyController.deleteRoomType);

/* ---------------------------- PROPERTIES ------------------------- */
// PropertyRoute.post(
//   '/properties',
//   uploadMedia.any(),
//   PropertyController.createProperty
// );

PropertyRoute.get('/properties', PropertyController.getProperties);
PropertyRoute.get('/properties/search', PropertyController.searchProperties);
PropertyRoute.get('/properties/:id', PropertyController.getProperty);
PropertyRoute.put(
  '/properties/:id',
  uploadMedia.any(),
  PropertyController.updateProperty
);
PropertyRoute.delete('/properties/:id', PropertyController.deleteProperty);

/* ----------------------------- ROOMS ----------------------------- */
// Add ONE room (your controller adds a single room per call)
PropertyRoute.post(
  '/properties/:propertyId/rooms',
  uploadMedia.any(),  
  PropertyController.addRooms       // <- note: method name is addRooms (capital R)
);

PropertyRoute.get('/properties/:propertyId/rooms', PropertyController.getRooms);
PropertyRoute.get('/propertiesbyhost/:ownerHostId', PropertyController.getPropertyByOwener);
PropertyRoute.put('/rooms/:id', PropertyController.updateRoom);
PropertyRoute.delete('/rooms/:id', PropertyController.deleteRoom);
PropertyRoute.get('/propertyroomtype/:propertyId', PropertyController.getPropertyRoomtype)


module.exports = PropertyRoute;
