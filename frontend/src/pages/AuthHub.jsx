import { ArrowRight, Building2, HeartHandshake, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const AuthHub = () => {
  const role = localStorage.getItem("role");

  const dashboardPath =
    role === "donor"
      ? "/donor"
      : role === "hospital"
      ? "/hospital"
      : role === "blood-lab"
      ? "/lab"
      : role === "admin"
      ? "/admin"
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
      <Header />
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-600 mb-3">
              Welcome
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose how you want to continue
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sign in to an existing account or register for the role that matches how you use the platform.
            </p>
          </div>

          {dashboardPath && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <p className="text-green-800 font-medium mb-3">
                A session is already available in this browser.
              </p>
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
              >
                Continue to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/login"
              className="bg-white rounded-3xl border border-red-100 shadow-lg p-7 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-5">
                <LogIn className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Login</h2>
              <p className="text-gray-600 mb-5">
                Access your donor, hospital, lab, or admin dashboard.
              </p>
              <span className="inline-flex items-center gap-2 text-red-700 font-semibold">
                Open Login
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link
              to="/register/donor"
              className="bg-white rounded-3xl border border-red-100 shadow-lg p-7 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Register as Donor</h2>
              <p className="text-gray-600 mb-5">
                Create a donor account, track your history, and join upcoming blood camps.
              </p>
              <span className="inline-flex items-center gap-2 text-red-700 font-semibold">
                Become a Donor
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link
              to="/register/facility"
              className="bg-white rounded-3xl border border-red-100 shadow-lg p-7 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
                <Building2 className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Register Facility</h2>
              <p className="text-gray-600 mb-5">
                Onboard a hospital or blood lab to manage requests, donors, and inventory.
              </p>
              <span className="inline-flex items-center gap-2 text-red-700 font-semibold">
                Register Facility
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthHub;
