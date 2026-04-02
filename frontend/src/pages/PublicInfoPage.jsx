import { ArrowRight, FileText, Heart, ShieldAlert } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const contentByPath = {
  "/mission": {
    eyebrow: "Our Purpose",
    title: "Our Mission",
    description:
      "We connect donors, hospitals, and blood labs so urgent blood needs can be handled faster and with better visibility.",
    bullets: [
      "Reduce delays during critical blood requests",
      "Keep inventory and donor data organized in one place",
      "Support safer, faster coordination across facilities",
    ],
    primary: { to: "/register/donor", label: "Become a Donor" },
    secondary: { to: "/about", label: "Read About Us" },
  },
  "/stories": {
    eyebrow: "Community Impact",
    title: "Success Stories",
    description:
      "Every donation creates a chain of impact. This space is reserved for donor stories, camp highlights, and patient recovery journeys.",
    bullets: [
      "Donor milestones and recognition",
      "Hospital response stories",
      "Blood camp outreach highlights",
    ],
    primary: { to: "/register/donor", label: "Start Your Journey" },
    secondary: { to: "/contact", label: "Share Your Story" },
  },
  "/news": {
    eyebrow: "Updates",
    title: "News & Updates",
    description:
      "This page will host platform announcements, campaign updates, and important blood donation advisories.",
    bullets: [
      "Upcoming awareness drives",
      "Product and workflow updates",
      "Emergency response announcements",
    ],
    primary: { to: "/contact", label: "Contact the Team" },
    secondary: { to: "/about", label: "About the Platform" },
  },
  "/eligibility": {
    eyebrow: "Donor Guide",
    title: "Eligibility Criteria",
    description:
      "Eligibility depends on health, recent donation history, and medical suitability. Final screening should always be done by medical staff.",
    bullets: [
      "Maintain general good health before donating",
      "Follow waiting periods between donations",
      "Bring valid identification for screening",
    ],
    primary: { to: "/register/donor", label: "Register as Donor" },
    secondary: { to: "/contact", label: "Ask a Question" },
  },
  "/process": {
    eyebrow: "Donor Guide",
    title: "Donation Process",
    description:
      "The typical flow includes registration, medical screening, donation, observation, and post-donation guidance.",
    bullets: [
      "Register and complete the initial intake",
      "Pass screening and eligibility checks",
      "Donate safely under trained supervision",
    ],
    primary: { to: "/register/donor", label: "Become a Donor" },
    secondary: { to: "/contact", label: "Need Help?" },
  },
  "/benefits": {
    eyebrow: "Donor Guide",
    title: "Donor Benefits",
    description:
      "Donors help save lives, strengthen local emergency response capacity, and can track their impact through the platform.",
    bullets: [
      "Support patients during urgent care",
      "Build a verified donation history",
      "Stay connected with camps and donation opportunities",
    ],
    primary: { to: "/register/donor", label: "Join as Donor" },
    secondary: { to: "/donor/camps", label: "View Camps" },
  },
  "/request-blood": {
    eyebrow: "Hospital Resource",
    title: "Blood Request Workflow",
    description:
      "Hospitals can request blood units from approved blood labs after logging into their facility account.",
    bullets: [
      "Create and track blood requests",
      "Review request history and statuses",
      "Coordinate with verified blood labs",
    ],
    primary: { to: "/login", label: "Login to Continue" },
    secondary: { to: "/register/facility", label: "Register Facility" },
  },
  "/inventory": {
    eyebrow: "Hospital Resource",
    title: "Inventory Management",
    description:
      "Inventory tools are available inside the protected facility dashboards for hospitals and blood labs.",
    bullets: [
      "Track quantities and expiry information",
      "Monitor low-stock and urgent cases",
      "Review updates in one dashboard",
    ],
    primary: { to: "/login", label: "Open Dashboard" },
    secondary: { to: "/register/facility", label: "Register Facility" },
  },
  "/emergency": {
    eyebrow: "Emergency Guidance",
    title: "Emergency Protocol",
    description:
      "For urgent blood needs, hospitals should contact emergency coordination channels and use authenticated request workflows inside the platform.",
    bullets: [
      "Use verified hospital accounts for urgent requests",
      "Keep patient and blood group details ready",
      "Escalate through emergency helplines when needed",
    ],
    primary: { to: "/contact", label: "Emergency Contacts" },
    secondary: { to: "/login", label: "Login" },
  },
  "/privacy": {
    eyebrow: "Legal",
    title: "Privacy Policy",
    description:
      "This build includes a placeholder privacy page so the footer links remain functional during development.",
    bullets: [
      "User data should be handled only for platform operations",
      "Access should be limited to authorized roles",
      "Sensitive data should be protected in transit and at rest",
    ],
    primary: { to: "/contact", label: "Contact Support" },
    secondary: { to: "/", label: "Back Home" },
  },
  "/terms": {
    eyebrow: "Legal",
    title: "Terms of Service",
    description:
      "This build includes a placeholder terms page so the footer links remain functional during development.",
    bullets: [
      "Use the platform only for legitimate healthcare workflows",
      "Keep account credentials secure",
      "Follow approval and verification requirements for facilities",
    ],
    primary: { to: "/contact", label: "Contact Support" },
    secondary: { to: "/", label: "Back Home" },
  },
  "/cookies": {
    eyebrow: "Legal",
    title: "Cookie Policy",
    description:
      "This build includes a placeholder cookie page so the footer links remain functional during development.",
    bullets: [
      "Session and preference storage may be used for login flows",
      "Operational cookies support dashboard access and navigation",
      "Policy details can be expanded later with production requirements",
    ],
    primary: { to: "/contact", label: "Contact Support" },
    secondary: { to: "/", label: "Back Home" },
  },
};

const PublicInfoPage = () => {
  const location = useLocation();
  const content = contentByPath[location.pathname] || {
    eyebrow: "Information",
    title: "Page Not Available",
    description: "This page is not ready yet, but the link is now connected to a working route.",
    bullets: ["You can continue browsing the platform", "Return to a main section", "Contact the team if you need help"],
    primary: { to: "/", label: "Go Home" },
    secondary: { to: "/contact", label: "Contact Us" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
      <Header />
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-[2rem] border border-red-100 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-700 to-red-900 px-8 py-12 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-red-100">
                  {content.eyebrow}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{content.title}</h1>
              <p className="text-lg text-red-100 max-w-3xl">{content.description}</p>
            </div>

            <div className="px-8 py-10 grid lg:grid-cols-[1.7fr,1fr] gap-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">What you can do here</h2>
                <div className="space-y-3">
                  {content.bullets.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-4"
                    >
                      <Heart className="w-5 h-5 text-red-600 mt-0.5" />
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 h-fit">
                <div className="flex items-center gap-3 mb-4 text-amber-700">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="font-semibold">Development Note</span>
                </div>
                <p className="text-gray-600 mb-6">
                  This section is connected so every visible UI link opens a valid screen while the full content is being completed.
                </p>
                <div className="space-y-3">
                  <Link
                    to={content.primary.to}
                    className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl font-semibold transition-colors"
                  >
                    {content.primary.label}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to={content.secondary.to}
                    className="w-full inline-flex items-center justify-center gap-2 border border-red-200 text-red-700 hover:bg-red-50 px-5 py-3 rounded-2xl font-semibold transition-colors"
                  >
                    {content.secondary.label}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicInfoPage;
