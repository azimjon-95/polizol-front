import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./Layout.css";
import Sidebar from "../sidebar/Sidebar";
import Header from "../header/Header";

const NON_SIDEBAR_ROLES = [
  "sotuvchi",
  "sotuvchi eksport",
  "sotuvchi Menejir",
  "polizol ish boshqaruvchi",
  "okisleniya ish boshqaruvchi",
  "rubiroid ish boshqaruvchi",
];
const LOCATION_ROLES = [
  "polizol ish boshqaruvchi",
  "okisleniya ish boshqaruvchi",
  "rubiroid ish boshqaruvchi",
];

const DIRECTOR_PATHS = ["/direktor", "/expense"];

function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (!role) {
      navigate("/login");
    }
  }, [role, navigate]);

  const showSidebar = role && !NON_SIDEBAR_ROLES.includes(role);
  const isDirectorPath = DIRECTOR_PATHS.includes(pathname);
  const isLocationRole = role && LOCATION_ROLES.includes(role);

  return (
    <div className="layout">
      {showSidebar && (
        <div className="layout_left">
          <Sidebar />
        </div>
      )}

      <div className="layout_right">
        {showSidebar && <Header />}
        <main
          className="main-content"
          style={{
            background: isDirectorPath ? "#0f172a" : "#f1f5f9",
            padding: isDirectorPath || isLocationRole ? 0 : 0,
            height: isLocationRole ? "100vh" : "calc(100vh - 50px)", // Set height to 100vh for LOCATION_ROLES
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;