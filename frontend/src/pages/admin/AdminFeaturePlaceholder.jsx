import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Construction, ShieldAlert } from "lucide-react";

const featureContent = {
  "/admin/camps": {
    title: "Blood Camps",
    description:
      "The admin view for monitoring and managing blood donation camps is not implemented in this build yet.",
  },
  "/admin/donations": {
    title: "Donation History",
    description:
      "The admin donation history and reporting screen is not implemented in this build yet.",
  },
};

const AdminFeaturePlaceholder = () => {
  const location = useLocation();
  const content = featureContent[location.pathname] || {
    title: "Admin Feature",
    description: "This admin page is not available yet.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 md:p-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-red-100 rounded-2xl">
              <Construction className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
                Admin Module
              </p>
              <h1 className="text-3xl font-bold text-gray-800">{content.title}</h1>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
              <p className="text-gray-700">{content.description}</p>
            </div>
          </div>

          <p className="text-gray-600 mb-8">
            The route exists now so the admin dashboard no longer drops into a blank page.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Dashboard
            </Link>
            <Link
              to="/admin/facilities"
              className="inline-flex items-center gap-2 border border-red-200 text-red-700 hover:bg-red-50 px-5 py-3 rounded-xl font-semibold transition-colors"
            >
              Open Facilities
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFeaturePlaceholder;
