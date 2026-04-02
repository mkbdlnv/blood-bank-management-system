import { Navigate, useLocation } from "react-router-dom";

const resolveRolePath = (pathname, role) => {
  if (pathname === "/dashboard") {
    return role === "donor"
      ? "/donor"
      : role === "hospital"
      ? "/hospital"
      : role === "blood-lab"
      ? "/lab"
      : role === "admin"
      ? "/admin"
      : "/login";
  }

  if (pathname === "/profile") {
    return role === "donor"
      ? "/donor/profile"
      : role === "blood-lab"
      ? "/lab/profile"
      : role === "hospital"
      ? "/hospital"
      : role === "admin"
      ? "/admin"
      : "/login";
  }

  return "/";
};

const RouteResolver = () => {
  const location = useLocation();
  const role = localStorage.getItem("role");

  return <Navigate to={resolveRolePath(location.pathname, role)} replace />;
};

export default RouteResolver;
