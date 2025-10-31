import { fetchJSON, buildUrl } from "../lib/api";

/**
 * Company Service
 * Handles all API calls related to companies CRUD operations
 */

const COMPANIES_ENDPOINT = "/api/v1/companies/";

export const companyService = {
  /**
   * Get all companies with optional filters
   * @param {Object} params - Query parameters (search, industry, city, etc.)
   * @returns {Promise<Object>} List of companies
   */
  getAllCompanies: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const path = queryString
        ? `${COMPANIES_ENDPOINT}?${queryString}`
        : COMPANIES_ENDPOINT;

      const { ok, data, status } = await fetchJSON(path, {
        method: "GET",
        credentials: "include",
      });

      if (!ok) {
        throw new Error(
          data?.message || `Failed to fetch companies (${status})`
        );
      }

      console.log("✅ Companies fetched:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching companies:", error);
      throw error;
    }
  },

  /**
   * Get single company by ID
   * @param {number|string} id - Company ID
   * @returns {Promise<Object>} Company details
   */
  getCompanyById: async (id) => {
    try {
      const { ok, data, status } = await fetchJSON(
        `${COMPANIES_ENDPOINT}${id}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(
          data?.message || `Failed to fetch company ${id} (${status})`
        );
      }

      console.log("✅ Company details fetched:", data);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching company ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new company
   * @param {Object|FormData} companyData - Company data (Object or FormData for file uploads)
   * @returns {Promise<Object>} Created company
   */
  createCompany: async (companyData) => {
    try {
      const isFormData = companyData instanceof FormData;

      const options = {
        method: "POST",
        credentials: "include",
        body: isFormData ? companyData : JSON.stringify(companyData),
      };

      // Only set Content-Type for JSON; browser sets it automatically for FormData
      if (!isFormData) {
        options.headers = {
          "Content-Type": "application/json",
        };
      }

      const { ok, data, status } = await fetchJSON(COMPANIES_ENDPOINT, options);

      if (!ok) {
        // Extract detailed error message from backend
        const errorMessage =
          data?.message ||
          data?.error ||
          data?.detail ||
          (data?.errors ? JSON.stringify(data.errors) : null) ||
          `Failed to create company (${status})`;

        const error = new Error(errorMessage);
        error.response = { data, status };
        throw error;
      }

      console.log("✅ Company created:", data);
      return data;
    } catch (error) {
      console.error("❌ Error creating company:", error);
      console.error("❌ Error data:", error.response?.data);
      throw error;
    }
  },

  /**
   * Update existing company (uses PATCH)
   * @param {number|string} id - Company ID
   * @param {Object|FormData} companyData - Updated company data (Object or FormData for file uploads)
   * @returns {Promise<Object>} Updated company
   */
  updateCompany: async (id, companyData) => {
    try {
      const isFormData = companyData instanceof FormData;

      const options = {
        method: "PATCH",
        credentials: "include",
        body: isFormData ? companyData : JSON.stringify(companyData),
      };

      // Only set Content-Type for JSON; browser sets it automatically for FormData
      if (!isFormData) {
        options.headers = {
          "Content-Type": "application/json",
        };
      }

      const { ok, data, status } = await fetchJSON(
        `${COMPANIES_ENDPOINT}${id}/`,
        options
      );

      if (!ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          data?.detail ||
          `Failed to update company ${id} (${status})`;
        const error = new Error(errorMessage);
        error.response = { data, status };
        throw error;
      }

      console.log("✅ Company updated:", data);
      return data;
    } catch (error) {
      console.error(`❌ Error updating company ${id}:`, error);
      throw error;
    }
  },

  /**
   * Partially update company
   * @param {number|string} id - Company ID
   * @param {Object} partialData - Partial company data
   * @returns {Promise<Object>} Updated company
   */
  patchCompany: async (id, partialData) => {
    try {
      const { ok, data, status } = await fetchJSON(
        `${COMPANIES_ENDPOINT}${id}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(partialData),
        }
      );

      if (!ok) {
        throw new Error(
          data?.message || `Failed to patch company ${id} (${status})`
        );
      }

      console.log("✅ Company patched:", data);
      return data;
    } catch (error) {
      console.error(`❌ Error patching company ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete company
   * @param {number|string} id - Company ID
   * @returns {Promise<void>}
   */
  deleteCompany: async (id) => {
    try {
      const { ok, data, status } = await fetchJSON(
        `${COMPANIES_ENDPOINT}${id}/`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(
          data?.message || `Failed to delete company ${id} (${status})`
        );
      }

      console.log(`✅ Company ${id} deleted`);
      return data;
    } catch (error) {
      console.error(`❌ Error deleting company ${id}:`, error);
      throw error;
    }
  },

  /**
   * Search companies
   * @param {string} searchTerm - Search query
   * @returns {Promise<Object>} Filtered companies
   */
  searchCompanies: async (searchTerm) => {
    try {
      return await companyService.getAllCompanies({ search: searchTerm });
    } catch (error) {
      console.error("❌ Search error:", error);
      throw error;
    }
  },

  /**
   * Filter companies by industry
   * @param {string} industry - Industry name
   * @returns {Promise<Object>} Filtered companies
   */
  filterByIndustry: async (industry) => {
    try {
      return await companyService.getAllCompanies({ industry });
    } catch (error) {
      console.error("❌ Filter error:", error);
      throw error;
    }
  },

  /**
   * Filter companies by location
   * @param {string} city - City name
   * @returns {Promise<Object>} Filtered companies
   */
  filterByCity: async (city) => {
    try {
      return await companyService.getAllCompanies({ city });
    } catch (error) {
      console.error("❌ Filter error:", error);
      throw error;
    }
  },
};

export default companyService;
