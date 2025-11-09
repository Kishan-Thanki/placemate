import { fetchJSON } from "../lib/api";

/**
 * Company Drive Service
 * Handles all API calls related to Company Drives CRUD operations
 */

const COMPANY_DRIVES_ENDPOINT = "/api/v1/placements/company-drives/";

export const companyDriveService = {
  /**
   * Get all company drives with optional filters
   * @param {Object} params - Query parameters (placement_drive, company, drive_type, status, etc.)
   * @returns {Promise<Object>} List of company drives
   */
  getAllDrives: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const path = queryString
        ? `${COMPANY_DRIVES_ENDPOINT}?${queryString}`
        : COMPANY_DRIVES_ENDPOINT;

      const { ok, data, status } = await fetchJSON(path, {
        method: "GET",
        credentials: "include",
      });

      if (!ok) {
        throw new Error(
          data?.message || `Failed to fetch company drives (${status})`
        );
      }

      console.log("✅ Company drives fetched:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching company drives:", error);
      throw error;
    }
  },

  /**
   * Get single company drive by ID
   * @param {number|string} id - Company Drive ID
   * @returns {Promise<Object>} Company drive details
   */
  getDriveById: async (id) => {
    try {
      const { ok, data, status } = await fetchJSON(
        `${COMPANY_DRIVES_ENDPOINT}${id}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(
          data?.message || `Failed to fetch company drive ${id} (${status})`
        );
      }

      console.log("✅ Company drive details fetched:", data);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching company drive ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all jobs for a specific company drive
   * @param {number|string} id - Company Drive ID
   * @returns {Promise<Object>} List of jobs for the drive
   */
  getDriveJobs: async (id) => {
    try {
      const { ok, data, status } = await fetchJSON(
        `${COMPANY_DRIVES_ENDPOINT}${id}/jobs/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(
          data?.message || `Failed to fetch jobs for drive ${id} (${status})`
        );
      }

      console.log("✅ Drive jobs fetched:", data);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching drive jobs for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new company drive with jobs
   * @param {Object} driveData - Company drive data including jobs array
   * @returns {Promise<Object>} Created company drive
   */
  createDrive: async (driveData) => {
    try {
      const options = {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(driveData),
      };

      const { ok, data, status } = await fetchJSON(
        COMPANY_DRIVES_ENDPOINT,
        options
      );

      if (!ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          data?.detail ||
          (data?.errors ? JSON.stringify(data.errors) : null) ||
          `Failed to create company drive (${status})`;

        const error = new Error(errorMessage);
        error.response = { data, status };
        throw error;
      }

      console.log("✅ Company drive created:", data);
      return data;
    } catch (error) {
      console.error("❌ Error creating company drive:", error);
      throw error;
    }
  },

  /**
   * Update existing company drive
   * @param {number|string} id - Company Drive ID
   * @param {Object} driveData - Updated company drive data
   * @returns {Promise<Object>} Updated company drive
   */
  updateDrive: async (id, driveData) => {
    try {
      const options = {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(driveData),
      };

      const { ok, data } = await fetchJSON(
        `${COMPANY_DRIVES_ENDPOINT}${id}/`,
        options
      );

      if (!ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          data?.detail ||
          "Failed to update company drive";
        throw new Error(errorMessage);
      }

      console.log("✅ Company drive updated:", data);
      return data;
    } catch (error) {
      console.error(`❌ Error updating company drive ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete company drive
   * @param {number|string} id - Company Drive ID
   * @returns {Promise<void>}
   */
  deleteDrive: async (id) => {
    try {
      const { ok, data } = await fetchJSON(
        `${COMPANY_DRIVES_ENDPOINT}${id}/`,
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
          "Failed to delete company drive";
        throw new Error(errorMessage);
      }

      console.log("✅ Company drive deleted:", id);
      return data;
    } catch (error) {
      console.error(`❌ Error deleting company drive ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new job for a company drive
   * @param {Object} jobData - Job data including company_drive ID
   * @returns {Promise<Object>} Created job
   */
  createJob: async (jobData) => {
    try {
      let options;
      
      // Check if jobData contains a file (job_pdf)
      if (jobData.job_pdf instanceof File) {
        // Use FormData for file upload
        const formData = new FormData();
        Object.keys(jobData).forEach(key => {
          if (jobData[key] !== null && jobData[key] !== undefined) {
            if (key === 'eligible_programs' && Array.isArray(jobData[key])) {
              // For arrays, append each item separately
              jobData[key].forEach(item => {
                formData.append('eligible_programs', item);
              });
            } else if (key === 'job_desc' && typeof jobData[key] === 'object') {
              // Stringify JSON objects (like TipTap content)
              formData.append(key, JSON.stringify(jobData[key]));
            } else {
              formData.append(key, jobData[key]);
            }
          }
        });

        options = {
          method: "POST",
          credentials: "include",
          // Don't set Content-Type header for FormData - browser will set it with boundary
          body: formData,
        };
      } else {
        // Regular JSON request
        options = {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jobData),
        };
      }

      const { ok, data, status: responseStatus } = await fetchJSON(
        "/api/v1/placements/jobs/",
        options
      );

      if (!ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          data?.detail ||
          (data?.errors ? JSON.stringify(data.errors) : null) ||
          `Failed to update job (${responseStatus})`;

        const error = new Error(errorMessage);
        error.response = { data, status: responseStatus };
        throw error;
      }

      console.log("✅ Job created:", data);
      return data;
    } catch (error) {
      console.error("❌ Error creating job:", error);
      throw error;
    }
  },

  /**
   * Update an existing job
   * @param {number|string} id - Job ID
   * @param {Object} jobData - Updated job data
   * @returns {Promise<Object>} Updated job
   */
  updateJob: async (id, jobData) => {
    try {
      let options;
      
      // Check if jobData contains a file (job_pdf)
      if (jobData.job_pdf instanceof File) {
        // Use FormData for file upload
        const formData = new FormData();
        Object.keys(jobData).forEach(key => {
          if (jobData[key] !== null && jobData[key] !== undefined) {
            if (key === 'eligible_programs' && Array.isArray(jobData[key])) {
              // For arrays, append each item separately
              jobData[key].forEach(item => {
                formData.append('eligible_programs', item);
              });
            } else if (key === 'job_desc' && typeof jobData[key] === 'object') {
              // Stringify JSON objects (like TipTap content)
              formData.append(key, JSON.stringify(jobData[key]));
            } else {
              formData.append(key, jobData[key]);
            }
          }
        });

        options = {
          method: "PATCH",
          credentials: "include",
          // Don't set Content-Type header for FormData - browser will set it with boundary
          body: formData,
        };
      } else {
        // Regular JSON request
        options = {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jobData),
        };
      }

      const { ok, data } = await fetchJSON(
        `/api/v1/placements/jobs/${id}/`,
        options
      );

      if (!ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          data?.detail ||
          "Failed to update job";
        throw new Error(errorMessage);
      }

      console.log("✅ Job updated:", data);
      return data;
    } catch (error) {
      console.error(`❌ Error updating job ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a job
   * @param {number|string} id - Job ID
   * @returns {Promise<void>}
   */
  deleteJob: async (id) => {
    try {
      const { ok, data } = await fetchJSON(
        `/api/v1/placements/jobs/${id}/`,
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
          "Failed to delete job";
        throw new Error(errorMessage);
      }

      console.log("✅ Job deleted:", id);
      return data;
    } catch (error) {
      console.error(`❌ Error deleting job ${id}:`, error);
      throw error;
    }
  },
};
