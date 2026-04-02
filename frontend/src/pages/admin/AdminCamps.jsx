import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Calendar,
  MapPin,
  RefreshCw,
  Users,
  Clock3,
  Building2,
  Filter,
} from "lucide-react";

const API_URL = "/api/admin";

const statusColors = {
  Upcoming: "bg-blue-100 text-blue-800 border-blue-200",
  Ongoing: "bg-amber-100 text-amber-800 border-amber-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
};

const AdminCamps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchCamps = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/camps`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to fetch camps: ${res.status}`);
      }

      const data = await res.json();
      setCamps(data.camps || []);

      if (showToast) {
        toast.success(`Loaded ${data.camps?.length || 0} camps`);
      }
    } catch (error) {
      console.error("Admin camps error:", error);
      toast.error("Failed to load blood camps");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const filteredCamps = useMemo(() => {
    return camps.filter((camp) => statusFilter === "all" || camp.status === statusFilter);
  }, [camps, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: camps.length,
      upcoming: camps.filter((camp) => camp.status === "Upcoming").length,
      ongoing: camps.filter((camp) => camp.status === "Ongoing").length,
      completed: camps.filter((camp) => camp.status === "Completed").length,
    };
  }, [camps]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Blood Camps</h2>
          <p className="text-gray-500">Preparing camp overview for admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-2xl">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Blood Camps</h1>
              <p className="text-gray-600 mt-1">
                Admin overview of upcoming, active, and completed blood donation camps
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchCamps(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Camps"}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Camps" value={stats.total} />
          <StatCard label="Upcoming" value={stats.upcoming} accent="text-blue-600" />
          <StatCard label="Ongoing" value={stats.ongoing} accent="text-amber-600" />
          <StatCard label="Completed" value={stats.completed} accent="text-green-600" />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-4 mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-red-600" />
            <label className="text-sm font-semibold text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filteredCamps.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-10 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No camps found</h3>
            <p className="text-gray-600">
              No blood camps matched the current filter, or none have been created yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredCamps.map((camp) => (
              <div
                key={camp._id}
                className="bg-white rounded-2xl shadow-lg border border-red-100 p-6"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl font-semibold text-gray-800">{camp.title}</h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          statusColors[camp.status] || "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>

                    {camp.description && (
                      <p className="text-gray-600 max-w-3xl">{camp.description}</p>
                    )}

                    <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
                      <InfoRow
                        icon={<Building2 className="w-4 h-4 text-red-600" />}
                        text={camp.hospital?.name || "Unknown facility"}
                      />
                      <InfoRow
                        icon={<Calendar className="w-4 h-4 text-red-600" />}
                        text={new Date(camp.date).toLocaleDateString()}
                      />
                      <InfoRow
                        icon={<Clock3 className="w-4 h-4 text-red-600" />}
                        text={`${camp.time?.start || "--"} - ${camp.time?.end || "--"}`}
                      />
                      <InfoRow
                        icon={<Users className="w-4 h-4 text-red-600" />}
                        text={`Expected ${camp.expectedDonors || 0}, actual ${camp.actualDonors || 0}`}
                      />
                      <InfoRow
                        icon={<MapPin className="w-4 h-4 text-red-600" />}
                        text={`${camp.location?.venue || ""}, ${camp.location?.city || ""}, ${camp.location?.state || ""}`}
                      />
                      <InfoRow
                        icon={<Building2 className="w-4 h-4 text-red-600" />}
                        text={camp.hospital?.facilityType || "facility"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, accent = "text-red-600" }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-5">
    <div className={`text-3xl font-bold ${accent}`}>{value}</div>
    <div className="text-sm text-gray-600 mt-1">{label}</div>
  </div>
);

const InfoRow = ({ icon, text }) => (
  <div className="flex items-center gap-2">
    {icon}
    <span>{text}</span>
  </div>
);

export default AdminCamps;
