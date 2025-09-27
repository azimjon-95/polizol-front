import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import PrivateRoute from "./auth/PrivateRoute";
import Layout from "./components/layout/Layout";
import { routes, rolePaths } from "./routes/Routes";
import Login from "./components/login/Login";
import QRFeedbackPage from "./pages/reseption/salesDepartment/QRFeedbackPage";

const App = () => {
  const authToken = localStorage.getItem("token");
  const authRole = localStorage.getItem("role");
  const location = useLocation();

  // Agar token yo‘q bo‘lsa → login sahifasiga yuborish
  if (!authToken) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/feedback" element={<QRFeedbackPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Agar token bo‘lsa → login sahifasiga yo‘l qo‘ymaslik
  if (authToken && location.pathname === "/login") {
    const defaultRoute = rolePaths[authRole] || "/dashboard";
    return <Navigate to={defaultRoute} replace />;
  }

  const defaultRoute = rolePaths[authRole] || "/dashboard";

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
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
};

export default App;

// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import PrivateRoute from "./auth/PrivateRoute";
// import Layout from "./components/layout/Layout";
// import { routes, rolePaths } from "./routes/Routes";
// import Login from "./components/login/Login";
// import QRFeedbackPage from "./pages/reseption/salesDepartment/QRFeedbackPage";

// const App = () => {
//   const authToken = localStorage.getItem("token");
//   const authRole = localStorage.getItem("role");

//   // Guest foydalanuvchi uchun login yo‘nalishlari
//   if (!authToken) {
//     return (
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route path="/feedback" element={<QRFeedbackPage />} />
//         <Route path="*" element={<Navigate to="/login" />} />
//       </Routes>
//     );
//   }

//   // Authenticated foydalanuvchi uchun
//   const defaultRoute = rolePaths[authRole] || "/dashboard"; // fallback

//   return (

//     <Routes>
//       <Route element={<Layout />}>
//         {routes.map(({ path, element, private: isPrivate, role }) => (
//           <Route
//             key={path}
//             path={path}
//             element={
//               isPrivate ? (
//                 <PrivateRoute role={role}>{element}</PrivateRoute>
//               ) : (
//                 element
//               )
//             }
//           />
//         ))}
//       </Route>
//       <Route path="/login" element={<Login />} />
//       <Route path="/feedback" element={<QRFeedbackPage />} />
//       <Route path="*" element={<Navigate to={defaultRoute} />} />
//     </Routes>
//   );
// };

// export default App;
