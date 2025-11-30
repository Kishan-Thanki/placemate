import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Shield,
  UserPlus,
  UserMinus,
  AlertCircle,
  CheckCircle,
  Search,
  X,
} from "lucide-react";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../components/layout";
import { Button, Card, Spinner, Toast } from "../../components/ui";
import { Modal } from "../../components/ui/Modal";
import { useTheme } from "../../contexts/ThemeContext";
import { userService } from "../../services/userService";

// ✅ Clean, fixed implementation
export default function SPCManagement() {
  const { isDark } = useTheme();
  
  // UI helpers
  const initials = (u) => {
    const parts = [u.first_name, u.middle_name, u.last_name].filter(Boolean);
    const letters = parts.map((s) => s[0]?.toUpperCase()).join("");
    return letters || (u.email ? u.email[0].toUpperCase() : "U");
  };

  const roleBadge = (r) => {
    const base = "px-2 py-0.5 text-xs rounded-full font-medium inline-block";
    if (!r) return null;
    if (r.id === 3) return <span className={`${base} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>{r.name}</span>;
    if (r.id === 2) return <span className={`${base} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`}>{r.name}</span>;
    return <span className={`${base} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>{r.name}</span>;
  };
  const [loading, setLoading] = useState(true);
  const [spcUsers, setSpcUsers] = useState([]);

  // modal / assign state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [filteredAvailableStudents, setFilteredAvailableStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [processing, setProcessing] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  const normalizeList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.data?.results)) return data.data.results;
    return [];
  };

  const loadSPCUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getSPCUsers();
      setSpcUsers(normalizeList(data));
    } catch (err) {
      showToast(err.message || "Failed to load SPC users", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // load once on mount
  useEffect(() => {
    loadSPCUsers();
  }, [loadSPCUsers]);

  const openAssignModal = async () => {
    setIsModalOpen(true);
    setAvailableLoading(true);
    setSelectedStudents([]);
    setSearchTerm("");
    try {
      const all = await userService.getAllUsers();
      const users = normalizeList(all);
      const students = users.filter(
        (u) =>
          Array.isArray(u.roles) &&
          u.roles.some((r) => r.id === 1) && // Student
          !u.roles.some((r) => r.id === 3) // Not SPC
      );
      setAvailableStudents(students);
      setFilteredAvailableStudents(students);
      setTimeout(() => searchRef.current?.focus(), 120);
    } catch (err) {
      showToast(err.message || "Failed to load students", "error");
      setAvailableStudents([]);
      setFilteredAvailableStudents([]);
    } finally {
      setAvailableLoading(false);
    }
  };

  const closeAssignModal = () => {
    setIsModalOpen(false);
    setSelectedStudents([]);
    setSearchTerm("");
  };

  // debounce search
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    const t = setTimeout(() => {
      if (!term) return setFilteredAvailableStudents(availableStudents);
      const filtered = availableStudents.filter((s) => {
        const fullName = `${s.first_name || ""} ${
          s.middle_name || ""
        } ${s.last_name || ""}`.toLowerCase();
        const email = (s.email || "").toLowerCase();
        return (
          fullName.includes(term) ||
          email.includes(term) ||
          String(s.id) === term
        );
      });
      setFilteredAvailableStudents(filtered);
    }, 200);
    return () => clearTimeout(t);
  }, [searchTerm, availableStudents]);

  const toggleSelect = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const assignSelected = async () => {
    if (selectedStudents.length === 0)
      return showToast("Please select at least one student", "error");
    setProcessing(true);
    try {
      await Promise.all(selectedStudents.map((id) => userService.assignSPCRole(id)));
      showToast(`Assigned SPC to ${selectedStudents.length} student(s)`, "success");
      closeAssignModal();
      await loadSPCUsers();
    } catch (err) {
      showToast(err.message || "Failed to assign SPC role", "error");
    } finally {
      setProcessing(false);
    }
  };

  const revokeSPC = async (userId, name) => {
    if (!confirm(`Revoke SPC role from ${name}?`)) return;
    setProcessing(true);
    try {
      await userService.revokeSPCRole(userId);
      showToast(`Revoked SPC from ${name}`, "success");
      await loadSPCUsers();
    } catch (err) {
      showToast(err.message || "Failed to revoke SPC role", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout title="Manage SPC Roles">
      <PageContainer>
        <Section>
          {/* Header */}
          <div className="flex items-center justify-end mb-6">
            
            <Button variant="primary" onClick={openAssignModal} disabled={processing}>
              <UserPlus className="w-4 h-4 mr-2" /> Add SPC
            </Button>
          </div>

          {/* SPC Users Table */}
          <Card>
            
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : spcUsers.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle
                    className={`w-12 h-12 mx-auto mb-3 ${
                      isDark ? "text-gray-600" : "text-gray-400"
                    }`}
                  />
                  <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                    No SPC members found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr
                        className={`border-b ${
                          isDark ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Member
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {spcUsers.map((u) => (
                        <tr
                          key={u.id}
                          className={`border-b ${
                            isDark
                              ? "border-gray-700 hover:bg-gray-700/50"
                              : "border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                                  isDark ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-800"
                                }`}
                              >
                                {initials(u)}
                              </div>
                              <div>
                                <div className={`font-medium ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}>
                                  {`${u.first_name || ""} ${u.middle_name || ""} ${u.last_name || ""}`}
                                </div>
                                <div className="text-xs mt-1 flex items-center gap-2">
                                  {Array.isArray(u.roles) && u.roles.map((r) => (
                                    <span key={r.id}>{roleBadge(r)}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${
                            isDark ? "text-gray-300" : "text-gray-900"
                          }`}>{u.email}</td>
                          <td className={`px-4 py-3 ${
                            isDark ? "text-gray-300" : "text-gray-900"
                          }`}>{u.phone_number}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                revokeSPC(u.id, `${u.first_name} ${u.last_name}`)
                              }
                              disabled={processing}
                            >
                              <UserMinus className="w-4 h-4 mr-1" /> Revoke
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </Section>
      </PageContainer>

      {/* Assign Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeAssignModal}
        title="Assign SPC Role"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className={isDark ? "text-gray-300" : "text-gray-600"}>
            Select students to grant SPC role.
          </p>

          {availableLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : availableStudents.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle
                className={`w-12 h-12 mx-auto mb-3 ${
                  isDark ? "text-gray-600" : "text-gray-400"
                }`}
              />
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                No available students to assign SPC role
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex items-center flex-1 px-3 py-2 rounded-md border ${
                      isDark
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Search
                      className={`w-4 h-4 mr-2 ${
                        isDark ? "text-gray-300" : "text-gray-500"
                      }`}
                    />
                    <input
                      ref={searchRef}
                      aria-label="Search students"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or email"
                      className={`flex-1 bg-transparent outline-none text-sm ${
                        isDark ? "text-gray-200" : "text-gray-800"
                      }`}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <X
                          className={`w-4 h-4 ${
                            isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        />
                      </button>
                    )}
                  </div>
                  <div className={`text-sm whitespace-nowrap ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {filteredAvailableStudents.length} student{filteredAvailableStudents.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto border rounded-lg dark:border-gray-700">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          checked={
                            selectedStudents.length ===
                              filteredAvailableStudents.length &&
                            filteredAvailableStudents.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedStudents(
                                filteredAvailableStudents.map((s) => s.id)
                              );
                            else setSelectedStudents([]);
                          }}
                        />
                      </th>
                      <th className={`px-4 py-3 text-left text-sm font-semibold ${
                        isDark ? "text-gray-900" : "text-gray-900"
                      }`}>
                        Member
                      </th>
                      <th className={`px-4 py-3 text-left text-sm font-semibold ${
                        isDark ? "text-gray-900" : "text-gray-900"
                      }`}>
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAvailableStudents.map((s) => (
                      <tr
                        key={s.id}
                        className={`border-b cursor-pointer ${
                          isDark
                            ? "border-gray-700 hover:bg-gray-700/50"
                            : "border-gray-100 hover:bg-gray-50"
                        }`}
                        onClick={() => toggleSelect(s.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(s.id)}
                            onChange={() => toggleSelect(s.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                                isDark ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {initials(s)}
                            </div>
                            <div>
                              <div className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}>
                                {`${s.first_name || ""} ${s.middle_name || ""} ${s.last_name || ""}`}
                              </div>
                              <div className={`text-xs ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}>ID: {s.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-sm ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        }`}>{s.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedStudents.length > 0 && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    isDark ? "bg-blue-500/20" : "bg-blue-50"
                  }`}
                >
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    {selectedStudents.length} selected
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={closeAssignModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={assignSelected}
                  disabled={selectedStudents.length === 0 || processing}
                >
                  {processing ? (
                    <>
                      <Spinner size="sm" className="mr-2" /> Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" /> Assign SPC
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </DashboardLayout>
  );
}
