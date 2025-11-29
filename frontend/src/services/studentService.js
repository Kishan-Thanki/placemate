import { fetchJSON } from "../lib/api";


const STUDENTS_ENDPOINT = "/api/v1/students";
const PROFILES_ENDPOINT = "/api/v1/students/profiles";

export const studentService = {
 
  registerStudent: async (studentData) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${STUDENTS_ENDPOINT}/register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(studentData),
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to register student (${status})`);
      }

      console.log("✅ Student registered successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error registering student:", error);
      throw error;
    }
  },

  getAllStudents: async () => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${STUDENTS_ENDPOINT}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to fetch students (${status})`);
      }

      console.log("✅ Students fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching students:", error);
      throw error;
    }
  },

  getStudentById: async (id) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${STUDENTS_ENDPOINT}/${id}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to fetch student (${status})`);
      }

      console.log("✅ Student fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching student:", error);
      throw error;
    }
  },

  updateStudent: async (id, studentData) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${STUDENTS_ENDPOINT}/${id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(studentData),
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to update student (${status})`);
      }

      console.log("✅ Student updated successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error updating student:", error);
      throw error;
    }
  },

  deleteStudent: async (id) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${STUDENTS_ENDPOINT}/${id}/`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to delete student (${status})`);
      }

      console.log("✅ Student deleted successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error deleting student:", error);
      throw error;
    }
  },

  getStudentProfiles: async (page = 1, page_size = 20) => {
    try {
      const params = new URLSearchParams();
      if (page > 1) {
        params.append("page", page);
      }
      if (page_size !== 20) {
        params.append("page_size", page_size);
      }

      const queryString = params.toString();
      const url = queryString
        ? `${PROFILES_ENDPOINT}/?${queryString}`
        : `${PROFILES_ENDPOINT}/`;

      const { ok, data, status, message } = await fetchJSON(url, {
        method: "GET",
        credentials: "include",
      });

      if (!ok) {
        throw new Error(
          message || `Failed to fetch student profiles (${status})`
        );
      }

      console.log("✅ Student profiles fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching student profiles:", error);
      throw error;
    }
  },

  getStudentProfileByUser: async (userId) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${PROFILES_ENDPOINT}/${userId}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(
          message || `Failed to fetch student profile (${status})`
        );
      }

      console.log("✅ Student profile fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching student profile:", error);
      throw error;
    }
  },

  // Update student profile
  updateStudentProfile: async (userId, profileData) => {
    try {
      const isFormData = profileData instanceof FormData;

      const { ok, data, status, message } = await fetchJSON(
        `${PROFILES_ENDPOINT}/${userId}/`,
        {
          method: "PATCH",
          headers: isFormData
            ? {}
            : {
                "Content-Type": "application/json",
              },
          credentials: "include",
          body: isFormData ? profileData : JSON.stringify(profileData),
        }
      );

      if (!ok) {
        throw new Error(
          message || `Failed to update student profile (${status})`
        );
      }

      console.log("✅ Student profile updated successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error updating student profile:", error);
      throw error;
    }
  },

  // Mark student as placed/not placed
  markAsPlaced: async (userId, isPlaced) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${PROFILES_ENDPOINT}/${userId}/mark_as_placed/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ is_placed: isPlaced }),
        }
      );

      if (!ok) {
        throw new Error(
          message || `Failed to update placement status (${status})`
        );
      }

      console.log("✅ Placement status updated successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error updating placement status:", error);
      throw error;
    }
  },

  // Mark student as verified/not verified
  markAsVerified: async (userId, isVerified) => {
    try {
      const { ok, data, status, message } = await fetchJSON(
        `${PROFILES_ENDPOINT}/${userId}/mark_as_verified/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ is_verified: isVerified }),
        }
      );

      if (!ok) {
        throw new Error(
          message || `Failed to update verification status (${status})`
        );
      }

      console.log("✅ Verification status updated successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error updating verification status:", error);
      throw error;
    }
  },

  // Delete student profile
  deleteStudentProfile: async (userId) => {
    try {
      const { ok, status, message } = await fetchJSON(
        `${PROFILES_ENDPOINT}/${userId}/`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(
          message || `Failed to delete student profile (${status})`
        );
      }

      console.log("✅ Student profile deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Error deleting student profile:", error);
      throw error;
    }
  },
};

export default studentService;
