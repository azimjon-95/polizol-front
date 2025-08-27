import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import axios from "../../api";
import { rolePaths } from "../../routes/Routes";
import {
  Eye,
  EyeOff,
  Factory,
  Shield,
  User,
  Lock,
  ArrowRight,
} from "lucide-react";
import "./login.css";

const Login = () => {
  const [authMode, setAuthMode] = useState(() => {
    const savedAuthMode = localStorage.getItem("authMode");
    return savedAuthMode !== null ? JSON.parse(savedAuthMode) : true;
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    pin: "",
  });

  useEffect(() => {
    localStorage.setItem("authMode", JSON.stringify(authMode));
  }, [authMode]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const clearForm = () => {
    setFormData({ username: "", password: "", pin: "" });
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data =
      authMode === true
        ? {
          login: formData.username.trim(),
          password: formData.password.trim(),
        }
        : { pin: formData.pin.trim() };

    if (!data.login && !data.pin) {
      toast.warn("Iltimos, login yoki PIN kodini kiriting!");
      return;
    }

    setLoading(true);

    try {
      const endpoint = authMode === true ? "/admin/login" : "/admin/pin";

      const res = await axios.post(endpoint, data);
      console.log(res);
      const { message: successMessage, innerData } = res.data;
      const doctorName = `${innerData?.employee?.firstName || ""} ${innerData?.employee?.lastName || ""
        }`.trim();

      const role = innerData?.employee?.unit?.toLowerCase() || "unknown";
      localStorage.setItem("workerId", innerData?.employee?._id);
      localStorage.setItem("admin_fullname", doctorName);
      localStorage.setItem("token", innerData?.token);
      localStorage.setItem("role", role);

      toast.success(successMessage || "Muvaffaqiyatli tizimga kirdingiz!");
      clearForm();
      console.log(role);
      console.log(rolePaths[role]);
      navigate(rolePaths[role] || "/login");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Tizimga kirishda xatolik yuz berdi!";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="bpf-authentication-wrapper">
      <ToastContainer />
      <div className="bpf-animated-background-overlay">
        <div className="bpf-floating-paper-roll-primary"></div>
        <div className="bpf-floating-paper-roll-secondary"></div>
        <div className="bpf-floating-paper-roll-tertiary"></div>
      </div>

      <div className="bpf-industrial-silhouette-container">
        <div className="bpf-factory-architectural-layout">
          <div className="bpf-manufacturing-building-primary"></div>
          <div className="bpf-industrial-chimney-primary"></div>
          <div className="bpf-manufacturing-building-secondary"></div>
          <div className="bpf-industrial-chimney-secondary"></div>
        </div>
      </div>

      <div className="bpf-authentication-container-wrapper">
        <div className="bpf-brand-identity-section">
          <div className="bpf-corporate-logo-container">
            <Factory className="w-10 h-10 text-white" />
          </div>
          <h1 className="bpf-company-title-primary">POP POLIZOL</h1>
          <p className="bpf-system-description-subtitle">
            CRM Boshqaruv Tizimi
          </p>
        </div>
        {authMode === true ? (
          <div className="bpf-authentication-panel-container">
            <div className="bpf-form-fields-container">
              <div className="bpf-input-field-grouping-wrapper">
                <label
                  htmlFor="username"
                  className="bpf-field-label-typography"
                >
                  Foydalanuvchi nomi
                </label>
                <div className="bpf-interactive-input-container">
                  <div className="bpf-input-icon-positioning-wrapper">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="bpf-primary-text-input-field"
                    placeholder="Foydalanuvchi nomingizni kiriting"
                    required
                  />
                </div>
              </div>

              <div className="bpf-input-field-grouping-wrapper">
                <label
                  htmlFor="password"
                  className="bpf-field-label-typography"
                >
                  Parol
                </label>
                <div className="bpf-interactive-input-container">
                  <div className="bpf-input-icon-positioning-wrapper">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="bpf-password-input-field"
                    placeholder="Parolingizni kiriting"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="bpf-password-visibility-toggle-button"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="bpf-primary-authentication-button"
              >
                <span>CRM tizimiga kirish</span>
                <ArrowRight className="w-5 h-5 bpf-button-icon-animation-wrapper" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bpf-authentication-panel-container">
            <div className="bpf-form-fields-container">
              <label htmlFor="pin" className="rgh-pin-label">
                PIN Kod
              </label>
              <div className="rgh-pin-input-wrapper">
                <div className="rgh-pin-input-icon">
                  <Lock className="w-5 h-5 text-blue-300" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="pin"
                  name="pin"
                  value={formData.pin}
                  onChange={handleInputChange}
                  className="rgh-pin-input-field"
                  placeholder="PIN kodingizni kiriting"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="rgh-pin-visibility-toggle"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-blue-300" />
                  ) : (
                    <Eye className="w-5 h-5 text-blue-300" />
                  )}
                </button>
              </div>

              <button
                onClick={handleSubmit}
                className="bpf-primary-authentication-button"
              >
                <span>CRM tizimiga kirish</span>
                <ArrowRight className="w-5 h-5 bpf-button-icon-animation-wrapper" />
              </button>
            </div>
          </div>
        )}
        <div
          onClick={() => setAuthMode(!authMode)}
          className="bpf-security-certification-badge"
        >
          <Shield className="w-4 h-4" />
          <span className="bpf-security-badge-text">Xavfsiz ulanish</span>
        </div>
      </div>
    </div>
  );
};

export default Login;




