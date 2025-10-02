import apiService from "../../api/apiService";
import { PROPERTY } from "../../api/apiEndpoints";

const propertyDetailsService = {
    getPropertyDetails: (id, params) => 
        apiService.get(`${PROPERTY.PROPERTY_DETAILS}/${id}`, { 
           params: {
                        startDate: params?.startDate,
                        endDate: params?.endDate
                    }
        }),
};

export default propertyDetailsService;


