import { fetchJSON } from "../lib/api";

const LOOKUP_ENDPOINT = "/api/v1/core/lookup/";
export const lookupService = {

  getLookupData: async (type) => {
    try {
      const queryString = type ? `?type=${type}` : "";
      const path = `${LOOKUP_ENDPOINT}${queryString}`;

      const { ok, data, status } = await fetchJSON(path, {
        method: "GET",
        credentials: "include",
      });

      if (!ok) {
        throw new Error(
          data?.message || `Failed to fetch ${type} lookup data (${status})`
        );
      }

      console.log(`✅ ${type} lookup data fetched:`, data);

      // Return the data array from the response
      return data.success && data.data ? data.data : data;
    } catch (error) {
      console.error(`❌ Error fetching ${type} lookup data:`, error);
      throw error;
    }
  },


  getCities: async () => {
    return await lookupService.getLookupData("cities");
  },

  getCountries: async () => {
    return await lookupService.getLookupData("countries");
  },

 
  getStates: async () => {
    return await lookupService.getLookupData("states");
  },

  
  getDegrees: async () => {
    return await lookupService.getLookupData("degrees");
  },

 
  getPrograms: async () => {
    return await lookupService.getLookupData("programs");
  },
};

export default lookupService;
