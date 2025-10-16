import apiService from '../../api/apiService';

const ROOMTYPE_MEALPLAN = {
  SAVE: '/roomtype-mealplan/save',
  GET_BY_PROPERTY: '/roomtype-mealplan/property',
  DELETE: '/roomtype-mealplan'
};

const roomtypeMealPlanService = {
  // Save PropertyRoomTypeMealPlans
  savePropertyRoomTypeMealPlans: (data) => apiService.post(ROOMTYPE_MEALPLAN.SAVE, data),
  
  // Get PropertyRoomTypeMealPlans for a property
  getPropertyRoomTypeMealPlans: (propertyId) => apiService.get(`${ROOMTYPE_MEALPLAN.GET_BY_PROPERTY}/${propertyId}`),
  
  // Delete PropertyRoomTypeMealPlan
  deletePropertyRoomTypeMealPlan: (id) => apiService.delete(`${ROOMTYPE_MEALPLAN.DELETE}/${id}`)
};

export default roomtypeMealPlanService;
