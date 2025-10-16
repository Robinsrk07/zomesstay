const express = require('express');
const roomtypeMealplanRouter = express.Router();
const { savePropertyRoomTypeMealPlans, getPropertyRoomTypeMealPlans, deletePropertyRoomTypeMealPlan } = require('../../controllers/HostController/Roomtype_mealplan.controller');

// Save PropertyRoomTypeMealPlans
roomtypeMealplanRouter.post('/roomtype-mealplan/save', savePropertyRoomTypeMealPlans);

// Get PropertyRoomTypeMealPlans for a property
roomtypeMealplanRouter.get('/roomtype-mealplan/property/:propertyId', getPropertyRoomTypeMealPlans);

// Delete PropertyRoomTypeMealPlan
roomtypeMealplanRouter.delete('/roomtype-mealplan/:id', deletePropertyRoomTypeMealPlan);

module.exports = roomtypeMealplanRouter;
