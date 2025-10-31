import { fetchJSON } from "../lib/api";

/**
 * Lookup Service
 * Handles all API calls related to lookup data (cities, countries, states, etc.)
 */

const LOOKUP_ENDPOINT = "/api/v1/core/lookup/";

export const lookupService = {
  /**
   * Get all lookup data for a specific type
   * @param {string} type - Type of lookup data (cities, countries, states, degrees, programs)
   * @returns {Promise<Array>} Lookup data array
   */
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

  /**
   * Get cities
   * @returns {Promise<Array>} Cities array
   */
  getCities: async () => {
    return await lookupService.getLookupData("cities");
  },

  /**
   * Get countries
   * @returns {Promise<Array>} Countries array
   */
  getCountries: async () => {
    return await lookupService.getLookupData("countries");
  },

  /**
   * Get states
   * @returns {Promise<Array>} States array
   */
  getStates: async () => {
    return await lookupService.getLookupData("states");
  },

  /**
   * Get degrees
   * @returns {Promise<Array>} Degrees array
   */
  getDegrees: async () => {
    return await lookupService.getLookupData("degrees");
  },

  /**
   * Get programs
   * @returns {Promise<Array>} Programs array
   */
  getPrograms: async () => {
    return await lookupService.getLookupData("programs");
  },
};

export default lookupService;
