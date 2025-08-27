import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { store } from "./context/store";
// import SalaryManagement from "./pages/reseption/salary/SalaryManagement";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        {/* <SalaryManagement/> */}
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
