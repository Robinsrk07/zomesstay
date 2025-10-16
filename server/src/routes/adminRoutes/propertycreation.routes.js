// routes/property.js
const express = require('express');
const PropertycreateRoute = express.Router();

const { uploadImage, uploadVideo, uploadMedia } = require('../../config/multer');
const propertyCreation = require('../../controllers/adminController/propertycreation.controller');

PropertycreateRoute.post('/properties', uploadMedia.any('media',12 ), propertyCreation.createProperty);
PropertycreateRoute.get('/properties_utils', propertyCreation.getCreationFormData);
PropertycreateRoute.post('/properties_validate', propertyCreation.validatePropertyData);

module.exports = PropertycreateRoute;