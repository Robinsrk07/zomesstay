import axios from 'axios';
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, 
});

  const ROLES  ={
      ADMIN: 'admin',
      HOST: 'host',
      GUEST: 'guest'
  }

  const getAuthToken =(role)=>{
      return localStorage.getItem(`${role}_token`);
  }

  const getCurrentActiveRole =()=>{
      if(getAuthToken(ROLES.ADMIN)) return ROLES.ADMIN;
      if(getAuthToken(ROLES.HOST)) return ROLES.HOST;
      if(getAuthToken(ROLES.GUEST)) return ROLES.GUEST;
      return null
  }

  axiosInstance.interceptors.request.use((config)=>{
      const role = getCurrentActiveRole();
      if(role){
          const token = getAuthToken(role);
          config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
  })
  
  axiosInstance.interceptors.response.use((response)=>{
      return response;
  }
  )


export default axiosInstance;
