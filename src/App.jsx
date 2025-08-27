import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./auth/PrivateRoute";
import Layout from "./components/layout/Layout";
import { routes, rolePaths } from "./routes/Routes";
import Login from "./components/login/Login";
import QRFeedbackPage from "./pages/reseption/salesDepartment/QRFeedbackPage";

const App = () => {
  const authToken = localStorage.getItem("token");
  const authRole = localStorage.getItem("role");

  // Guest foydalanuvchi uchun login yo‘nalishlari
  if (!authToken) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/feedback" element={<QRFeedbackPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Authenticated foydalanuvchi uchun
  const defaultRoute = rolePaths[authRole] || "/dashboard"; // fallback

  return (
    
    <Routes>
      <Route element={<Layout />}>
        {routes.map(({ path, element, private: isPrivate, role }) => (
          <Route
            key={path}
            path={path}
            element={
              isPrivate ? (
                <PrivateRoute role={role}>{element}</PrivateRoute>
              ) : (
                element
              )
            }
          />
        ))}
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/feedback" element={<QRFeedbackPage />} />
      <Route path="*" element={<Navigate to={defaultRoute} />} />
    </Routes>
  );
};

export default App;
