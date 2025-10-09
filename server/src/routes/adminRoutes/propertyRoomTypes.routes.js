const express = require('express');
const PropertyRoomTypeRoute = express.Router();

const propertyRoomtypeController = require('../../controllers/adminController/propertyRoomtype.controller');

PropertyRoomTypeRoute.get('/propertyRoomType/:propertyId/room-types', propertyRoomtypeController.getPropertyRoomTypes);



module.exports = PropertyRoomTypeRoute;