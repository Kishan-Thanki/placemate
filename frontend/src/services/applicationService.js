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

  getMyApplications: async (studentId = null) => {
    try {
      let url = `${APPLICATIONS_ENDPOINT}/`;
      
      // Add student filter if provided
      if (studentId) {
        url += `?student=${studentId}`;
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

  updateApplication: async (existingApplicationId, applicationData) => {
    try {
      // First withdraw the existing application
      await applicationService.withdrawApplication(existingApplicationId);
      
      // Then create a new application with updated data
      return await applicationService.createApplication(applicationData);
    } catch (error) {
      console.error("❌ Error updating application:", error);
      throw error;
    }
  },

  acceptOffer: async (id) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${APPLICATIONS_ENDPOINT}/${id}/accept_offer/`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to accept offer (${status})`);
      }

      console.log("✅ Offer accepted successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error accepting offer:", error);
      throw error;
    }
  },

  declineOffer: async (id) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${APPLICATIONS_ENDPOINT}/${id}/decline_offer/`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to decline offer (${status})`);
      }

      console.log("✅ Offer declined successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error declining offer:", error);
      throw error;
    }
  },

  // Admin methods
  offerJob: async (applicationId, jobId) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${APPLICATIONS_ENDPOINT}/${applicationId}/offer_job/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ job_id: jobId }),
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to offer job (${status})`);
      }

      console.log("✅ Job offered successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error offering job:", error);
      throw error;
    }
  },

  rejectApplication: async (id) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${APPLICATIONS_ENDPOINT}/${id}/reject/`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to reject application (${status})`);
      }

      console.log("✅ Application rejected successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error rejecting application:", error);
      throw error;
    }
  },
};

export default applicationService;
