// Base API URL
// export const API_BASE_URL = 'http://54.172.53.96:5000';
export const API_BASE_URL = 'http://localhost:5000';

// Base API paths
export const API_BASE = '/api';

export const AUTH = {
  LOGIN: '/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
};


export const HOST_AUTH = {
    LOGIN: '/host-login',
    REGISTER: '/host/register',
    LOGOUT: '/host/logout',
    REFRESH: '/host/refresh',
    ME: '/host/me',
}


export const PROPERTY = {
  PROPERTY: '/properties',
  PROPERTY_BY_QUERY: '/properties/search',
  AMENITIES: '/amenities',
  FACILITIES: '/facilities',
  SAFETIES: '/safety-hygiene',
  ROOM_TYPES: '/room-types',
  ROOMS: '/properties',
  PROPERTY_TYPE: '/property-types',
  PROPERTY_ROOM_TYPES:'/propertyroomtype',
  PROPERTY_DETAILS:'/propertiesDetials',
  PROPERTY_UTILS:'/properties_utils',
  PROPERTY_VALIDATE:'/properties_validate',
  PROPERTY_CREATE:'/properties',
  ROOM_CONFIGURATIONS: '/properties',
  UPDATE_ROOMS: '/properties',

};

export const HOST_PROPERTY = {
  PROPERTY:'/host-properties',
  PROPERTY_BY_OWNERID:'/propertiesbyhost'
}

export const HOST_INVENTORY = {
  AVAILABILITY: '/properties',
  SPECIAL_RATES: '/special-rates'

}

  
export const MEDIA ={
  MEDIA:''
}
export const USER = {
  BASE: '/users',
  PROFILE: '/users/profile',
  // Add more user-related endpoints as needed
};

export const MEAL_PLAN = {
  MEAL_PLAN: '/meal-plan'
}

export const SPECIAL_RATE = {
  SPECIAL_RATE_APPLY: '/special-rate-applications'
}

export const PROPERTY_ROOM_TYPES={
  PROPERTY_ROOM_TYPES:'/propertyRoomType'
}

export const RATE_PLAN = {
  SAVE_BULK: '/roomtype-mealplan/save-bulk',
  UPDATE_BULK: '/roomtype-mealplan/update-bulk',
  UPDATE: '/rate-plan'
}


// Add more endpoint categories as needed
