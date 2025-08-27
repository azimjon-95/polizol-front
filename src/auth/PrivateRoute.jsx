import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, role }) => {
  const authToken = localStorage.getItem("token");
  const authRole = localStorage.getItem("role");

  // Check if user is authenticated and has the required role
  if (!authToken) {
    return <Navigate to="/login" />;
  }

  if (role && !role.includes(authRole)) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
