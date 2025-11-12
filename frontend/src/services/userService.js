import { fetchJSON } from "../lib/api";

/**
 * User Management Service
 * Handles all API calls related to user management and role assignments
 */

const USER_ENDPOINT = "/api/v1/users";

export const userService = {
  /**
   * Get all users
   * @returns {Promise<Object>} List of all users
   */
  getAllUsers: async () => {
    try {
      const { ok, data, message, status } = await fetchJSON(
        `${USER_ENDPOINT}/manage/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to fetch users (${status})`);
      }

      // Log raw API wrapper for debugging (backend wraps payload in { success, message, data, pagination })
      console.debug("userService.getAllUsers - raw response:", { ok, status, message, data });

      // Normalize: return the inner payload if present, otherwise return the raw data
      return data && data.data !== undefined ? data.data : data;
    } catch (error) {
      console.error("❌ Failed to fetch users:", error);
      throw error;
    }
  },

  /**
   * Get users by role
   * @param {number} roleId - Role ID (1: Student, 2: Admin, 3: Student Placement Cell)
   * @returns {Promise<Object>} List of users with the specified role
   */
  getUsersByRole: async (roleId) => {
    try {
      const { ok, data, message, status } = await fetchJSON(
        `${USER_ENDPOINT}/manage/?role_id=${roleId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to fetch users by role (${status})`);
      }

      // Debug: log the full API response so we can see if the backend returns pagination or wraps data
      console.debug("userService.getUsersByRole - raw response for role", roleId, { ok, status, message, data });

      // If backend uses our SuccessResponse wrapper, the useful payload is in data.data
      const inner = data && data.data !== undefined ? data.data : data;

      // If inner is paginated with .results, return that object for convenience (contains results + pagination)
      if (inner && inner.results && Array.isArray(inner.results)) {
        console.debug("userService.getUsersByRole - detected paginated results, count:", inner.results.length);
        return inner;
      }

      return inner;
    } catch (error) {
      console.error("❌ Failed to fetch users by role:", error);
      throw error;
    }
  },

  /**
   * Update user roles
   * @param {number} userId - User ID
   * @param {Object} roleData - Role data { role_ids: [1, 2, 3] } or { action: "add"/"remove", role_ids: [3] }
   * @returns {Promise<Object>} Updated user data
   */
  updateUserRoles: async (userId, roleData) => {
    try {
      console.log("🔄 Updating roles for user:", userId, roleData);

      // If caller passed an action-based payload (add/remove), translate it to { roles: [ids] }
      let payload = roleData;
      if (roleData && roleData.action && Array.isArray(roleData.role_ids)) {
        // Fetch current user roles
        const userResp = await userService.getUser(userId);
        // userResp may be the user object or a wrapper
        const currentRoles = userResp && (userResp.roles || userResp.data || userResp.results) ? (userResp.roles || userResp.data || userResp.results) : [];
        // Normalize to role id list
        const currentRoleIds = Array.isArray(currentRoles)
          ? currentRoles.map((r) => (r.id !== undefined ? r.id : r))
          : [];

        const modifyIds = roleData.role_ids;
        let newRoleIds = new Set(currentRoleIds);
        if (roleData.action === "add") {
          modifyIds.forEach((id) => newRoleIds.add(id));
        } else if (roleData.action === "remove") {
          modifyIds.forEach((id) => newRoleIds.delete(id));
        }

        payload = { roles: Array.from(newRoleIds) };
        console.debug("userService.updateUserRoles - translated payload:", payload, "from action", roleData.action);
      }

      // Ensure payload shape is { roles: [ids] }
      if (!payload || (!Array.isArray(payload.roles) && !Array.isArray(payload))) {
        // If caller passed a plain array, assume it's roles array
        if (Array.isArray(payload)) {
          payload = { roles: payload };
        }
      }

      const { ok, data, message, status } = await fetchJSON(
        `${USER_ENDPOINT}/manage/${userId}/roles/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );

      console.log("📥 Update roles response:", { ok, status, message, data });

      if (!ok) {
        throw new Error(message || `Failed to update user roles (${status})`);
      }

      console.log("✅ User roles updated successfully!");
      return data && data.data !== undefined ? data.data : data;
    } catch (error) {
      console.error("❌ Failed to update user roles:", error);
      throw error;
    }
  },
  assignSPCRole: async (userId) => {
    // Fetch current roles and send full roles array to backend
    const user = await userService.getUser(userId);
    const currentRoleIds = (user && Array.isArray(user.roles) ? user.roles.map((r) => (r.id !== undefined ? r.id : r)) : []);
    const newRoleIds = Array.from(new Set([...currentRoleIds, 3]));
    return userService.updateUserRoles(userId, { roles: newRoleIds });
  },

  /**
   * Revoke SPC role from a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated user data
   */
  revokeSPCRole: async (userId) => {
    // Fetch current roles and remove SPC role id then send full roles array
    const user = await userService.getUser(userId);
    const currentRoleIds = (user && Array.isArray(user.roles) ? user.roles.map((r) => (r.id !== undefined ? r.id : r)) : []);
    const newRoleIds = currentRoleIds.filter((id) => id !== 3);
    return userService.updateUserRoles(userId, { roles: newRoleIds });
  },
  getSPCUsers: async () => {
    return userService.getUsersByRole(3); // 3 = Student Placement Cell
  },
  getUser: async (userId) => {
    try {
      const { ok, data, message, status } = await fetchJSON(
        `${USER_ENDPOINT}/manage/${userId}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(message || `Failed to fetch user (${status})`);
      }

      console.debug("userService.getUser - raw response:", { ok, status, message, data });
      return data && data.data !== undefined ? data.data : data;
    } catch (error) {
      console.error("❌ Failed to fetch user:", error);
      throw error;
    }
  },

  /**
   * Get students without SPC role (only Student role)
   * @returns {Promise<Array>} List of students with only Student role
   */
  getStudentsWithoutSPC: async () => {
    return userService.getUsersByRole(1); // 1 = Student
  },
};
