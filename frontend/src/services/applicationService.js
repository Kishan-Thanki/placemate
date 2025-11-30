import { fetchJSON } from "../lib/api";

/**
 * Application Service
 * Handles all API calls related to job applications
 */

const APPLICATIONS_ENDPOINT = "/api/v1/applications";

export const applicationService = {
  
  createApplication: async (applicationData) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${APPLICATIONS_ENDPOINT}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(applicationData),
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to create application (${status})`);
      }

      console.log("✅ Application created successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error creating application:", error);
      throw error;
    }
  },

  getMyApplications: async () => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${APPLICATIONS_ENDPOINT}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to fetch applications (${status})`);
      }

      console.log("✅ Applications fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching applications:", error);
      throw error;
    }
  },

  getMyApplicationsByDrive: async (companyDriveId, studentId = null) => {
    try {
      let url = `${APPLICATIONS_ENDPOINT}/?company_drive=${companyDriveId}`;
      
      // Add student filter if provided
      if (studentId) {
        url += `&student=${studentId}`;
      }
      
      const { ok, data, status, message } = await fetchJSON(
        url,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to fetch applications (${status})`);
      }

      console.log(`✅ Applications for drive ${companyDriveId} fetched successfully:`, data);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching applications for drive ${companyDriveId}:`, error);
      throw error;
    }
  },

  getApplicationById: async (id) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${APPLICATIONS_ENDPOINT}/${id}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to fetch application (${status})`);
      }

      console.log("✅ Application fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching application:", error);
      throw error;
    }
  },

  withdrawApplication: async (id) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${APPLICATIONS_ENDPOINT}/${id}/withdraw/`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to withdraw application (${status})`);
      }

      console.log("✅ Application withdrawn successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error withdrawing application:", error);
      throw error;
    }
  },
};

export default applicationService;
