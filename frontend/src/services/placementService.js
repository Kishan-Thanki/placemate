import { fetchJSON } from "../lib/api";

/**
 * Placement Service
 * Handles all API calls related to Placement Drives CRUD operations
 */

const PLACEMENT_DRIVES_ENDPOINT = "/api/v1/placements/placement-drives/";

export const placementService = {
  /**
   * Get all placement drives with optional filters
   * @param {Object} params - Query parameters (search, page, etc.)
   * @returns {Promise<Object>} List of placement drives
   */
  getAllDrives: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const path = queryString
        ? `${PLACEMENT_DRIVES_ENDPOINT}?${queryString}`
        : PLACEMENT_DRIVES_ENDPOINT;

      const { ok, data, status } = await fetchJSON(path, {
        method: "GET",
        credentials: "include",
      });

      if (!ok) {
        throw new Error(
          data?.message || `Failed to fetch placement drives (${status})`
        );
      }

      console.log("✅ Placement drives fetched:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching placement drives:", error);
      throw error;
    }
  },

  /**
   * Get single placement drive by ID
   * @param {number|string} id - Placement Drive ID
   * @returns {Promise<Object>} Placement drive details
   */
  getDriveById: async (id) => {
    try {
      const { ok, data, status } = await fetchJSON(
        `${PLACEMENT_DRIVES_ENDPOINT}${id}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(
          data?.message || `Failed to fetch placement drive ${id} (${status})`
        );
      }

      console.log("✅ Placement drive details fetched:", data);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching placement drive ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new placement drive
   * @param {Object} driveData - Placement drive data (title, start_date, end_date)
   * @returns {Promise<Object>} Created placement drive
   */
  createDrive: async (driveData) => {
    try {
      const options = {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(driveData),
        headers: {
          "Content-Type": "application/json",
        },
      };

      const { ok, data } = await fetchJSON(
        PLACEMENT_DRIVES_ENDPOINT,
        options
      );

      if (!ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          data?.detail ||
          "Failed to create placement drive";
        throw new Error(errorMessage);
      }

      console.log("✅ Placement drive created:", data);
      return data;
    } catch (error) {
      console.error("❌ Error creating placement drive:", error);
      throw error;
    }
  },

  updateDrive: async (id, driveData) => {
    try {
      const options = {
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(driveData),
        headers: {
          "Content-Type": "application/json",
        },
      };

      const { ok, data } = await fetchJSON(
        `${PLACEMENT_DRIVES_ENDPOINT}${id}/`,
        options
      );

      if (!ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          data?.detail ||
          "Failed to update placement drive";
        throw new Error(errorMessage);
      }

      console.log("✅ Placement drive updated:", data);
      return data;
    } catch (error) {
      console.error(`❌ Error updating placement drive ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete placement drive
   * @param {number|string} id - Placement Drive ID
   * @returns {Promise<void>}
   */
  deleteDrive: async (id) => {
    try {
      const { ok, data } = await fetchJSON(
        `${PLACEMENT_DRIVES_ENDPOINT}${id}/`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          data?.detail ||
          "Failed to delete placement drive";
        throw new Error(errorMessage);
      }

      console.log("✅ Placement drive deleted:", id);
      return data;
    } catch (error) {
      console.error(`❌ Error deleting placement drive ${id}:`, error);
      throw error;
    }
  },
};
