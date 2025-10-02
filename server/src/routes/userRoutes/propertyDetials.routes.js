const express = require('express');
const router = express.Router();
const PropertyDetailsController = require('../../controllers/userController/propertyDetials.controller');

router.get('/propertiesDetials/:id', PropertyDetailsController.getPropertyDetails);

module.exports = router;