// Header.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BsCaretUpFill } from "react-icons/bs";
import { useSelector, useDispatch } from "react-redux";
import { notification } from "antd";
import { Calendar } from "lucide-react";
import { BsCaretDownFill } from "react-icons/bs";
import {
  RiLogoutCircleRLine,
  RiUser3Line,
  RiSearchLine,
  RiCloseLine,
} from "react-icons/ri";
import { DollarOutlined, SwapOutlined } from "@ant-design/icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  toggleSearchPanel,
  setSearchQuery,
  clearSearchQuery,
} from "../../context/actions/authSearch";
import { setSelectedMonth } from "../../context/actions/monthSlice";
import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const adminFullname = localStorage.getItem("admin_fullname");
  const role = localStorage.getItem("role");
  const { isSearchOpen, searchQuery } = useSelector((state) => state.search);
  const { selectedMonth } = useSelector((state) => state.month);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const searchPanelRef = useRef(null);
  const profileToggleRef = useRef(null);

  const [dollarRate, setDollarRate] = useState(null);
  const [isDollarOpen, setIsDollarOpen] = useState(false);

  const [usdValue, setUsdValue] = useState("");
  const [uzsValue, setUzsValue] = useState("");

  // Kurs olish
  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((res) => res.json())
      .then((data) => setDollarRate(data.rates.UZS))
      .catch((err) => console.error("API error:", err));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      // Agar profile ochilgan bo‘lsa va bosilgan joy ref ichida bo‘lmasa -> yopamiz
      if (
        isProfileOpen &&
        profileToggleRef.current &&
        !profileToggleRef.current.contains(event.target) &&
        !searchPanelRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);
  // Number format helper
  const formatNumber = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("uz-UZ").format(value);
  };

  const parseNumber = (value) => {
    return Number(value.replace(/\D/g, "")) || 0;
  };

  // USD -> UZS
  const handleUsdChange = (e) => {
    const raw = parseNumber(e.target.value);
    setUsdValue(raw);
    if (dollarRate) {
      setUzsValue(Math.round(raw * dollarRate));
    }
  };

  // UZS -> USD
  const handleUzsChange = (e) => {
    const raw = parseNumber(e.target.value);
    setUzsValue(raw);
    if (dollarRate) {
      setUsdValue((raw / dollarRate).toFixed(2));
    }
  };

  // Logout
  const handleLogout = () => {
    try {
      dispatch(clearSearchQuery());
      setIsProfileOpen(false);
      notification.success({
        message: "Muvaffaqiyatli tizimdan chiqdingiz!",
        placement: "topRight",
      });
      setTimeout(() => {
        localStorage.clear();
        navigate("/login");
      }, 500);
    } catch (err) {
      notification.error({
        message: "Chiqishda xatolik!",
        placement: "topRight",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Date picker
  const currentDate = new Date();
  const defaultMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;
  const selectedDate = selectedMonth
    ? new Date(`${selectedMonth}-01T00:00:00`)
    : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const handleMonthChange = (date) => {
    if (date) {
      const formatted = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      dispatch(setSelectedMonth(formatted));
    }
  };

  const isDirectorPath = location.pathname === "/dashboard";

  return (
    <header className="header">

      <div className="dollarRate">
        <p onClick={() => setIsDollarOpen((prev) => !prev)}>O'zbekiston Milliy Banki </p>
        <p
          className="dollar-toggle"
          onClick={() => setIsDollarOpen((prev) => !prev)}
        >
          1$ = {dollarRate?.toLocaleString("uz-UZ")} so'm {!isDollarOpen ? <BsCaretDownFill /> : <BsCaretUpFill />}
        </p>

        {isDollarOpen && (
          <div className="dollar-converter-wrapper">
            <div className="dollar-converter-header">
              <DollarOutlined style={{ color: "#1890ff" }} />
              <span>Dollar Kalkulyator</span>
              <RiCloseLine
                className="converter-close"
                onClick={() => setIsDollarOpen(false)}
              />
            </div>

            <div className="dollar-converter-box">
              <div className="converter-input">
                <input
                  type="text"
                  value={usdValue ? formatNumber(usdValue) : ""}
                  onChange={handleUsdChange}
                  placeholder="USD miqdor..."
                  className="converter-field"
                />
                <span style={{ fontWeight: 600 }}>$</span>
              </div>

              <div className="converter-swap">
                <SwapOutlined style={{ fontSize: 20, color: "#555" }} />
              </div>

              <div className="converter-input">
                <input
                  type="text"
                  value={uzsValue ? formatNumber(uzsValue) : ""}
                  onChange={handleUzsChange}
                  placeholder="UZS miqdor..."
                  className="converter-field"
                />
                <span style={{ fontWeight: 600 }}>so'm</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="header-right">
        {isDirectorPath && (
          <div className="complex-header-flex">
            <Calendar className="complex-calendar-icon" />
            <DatePicker
              selected={selectedDate}
              onChange={handleMonthChange}
              dateFormat="yyyy-MM"
              showMonthYearPicker
              className="complex-month-selector"
              placeholderText="Yil-Oy tanlang"
            />
          </div>
        )}

        <div className="search-container">
          <button
            className="search-toggle"
            onClick={() => dispatch(toggleSearchPanel())}
            ref={profileToggleRef}
          >
            {isSearchOpen ? <RiCloseLine /> : <RiSearchLine />}
          </button>
          {isSearchOpen && (
            <div className="search-panel">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                placeholder="Qidirish..."
                className="search-input"
              />
            </div>
          )}
        </div>

        <button
          className="profile-btn"
          ref={searchPanelRef}
          onClick={() => setIsProfileOpen((prev) => !prev)}
        >
          <RiUser3Line />
        </button>

        {isProfileOpen && (
          <div ref={profileToggleRef} className="profile-panel">
            <div className="profile-section">
              <RiUser3Line className="profile-icon" />
              <div>
                <p className="profile-name">
                  {adminFullname || localStorage.getItem("doctor") || "Admin"}
                </p>
                <p className="profile-role">{role || "Role not specified"}</p>
              </div>
            </div>
            <button
              className="logout-btn"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <RiLogoutCircleRLine />
              {isLoggingOut ? "Chiqilmoqda..." : "Chiqish"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
