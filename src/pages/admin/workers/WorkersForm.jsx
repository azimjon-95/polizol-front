import React, { useState, useEffect } from "react";
import {
  User,
  Building2,
  Briefcase,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  Shield,
  Key,
  UserCheck,
  Calendar,
  X,
  Save,
  UserPlus,
  Edit3,
} from "lucide-react";
import "./form.css";
import { toast } from "react-toastify";
import { capitalizeFirstLetter } from "../../../hook/CapitalizeFirstLitter";

const EmployeeModal = ({
  paymentTypes,
  roles,
  showAddModal,
  setShowAddModal,
  editingEmployee,
  setEditingEmployee,
  handleAddEmployee,
  handleUpdateEmployee,
}) => {
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    experience: "",
    passportSeries: "",
    phone: "",
    address: "",
    paymentType: "oylik",
    salary: "",
    isOfficeWorker: false,
    login: "",
    password: "",
    role: "boshqa ishchilar",
    unit: "boshqa",
    unitHeadPassword: "",
    plans: [],
  });

  useEffect(() => {
    if (editingEmployee) {
      setNewEmployee({
        firstName: editingEmployee.firstName || "",
        middleName: editingEmployee.middleName || "",
        lastName: editingEmployee.lastName || "",
        dateOfBirth: editingEmployee.dateOfBirth
          ? new Date(editingEmployee.dateOfBirth).toISOString().split("T")[0]
          : "",
        experience: editingEmployee.experience || "",
        passportSeries: editingEmployee.passportSeries || "",
        phone: editingEmployee.phone || "",
        address: editingEmployee.address || "",
        paymentType: editingEmployee.paymentType || "oylik",
        salary: editingEmployee.salary || "",
        isOfficeWorker: editingEmployee.isOfficeWorker || false,
        login: editingEmployee.login || "",
        password: editingEmployee.password || "",
        role: editingEmployee.role || "boshqa ishchilar",
        unit: editingEmployee.unit || "boshqa",
        unitHeadPassword: editingEmployee.unitHeadPassword || "",
        plans: editingEmployee.plans || [],
      });
    } else {
      setNewEmployee({
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",
        experience: "",
        passportSeries: "",
        phone: "",
        address: "",
        paymentType: "oylik",
        salary: "",
        isOfficeWorker: false,
        login: "",
        password: "",
        role: "boshqa ishchilar",
        unit: "boshqa",
        unitHeadPassword: "",
        plans: [],
      });
    }
  }, [editingEmployee]);

  // Telefon raqamni ko‘rsatishda formatlash: +998 90 123 45 67
  const formatPhoneInput = (value) => {
    let cleaned = value.replace(/\D/g, "").slice(0, 12); // Faqat raqamlar
    if (cleaned.startsWith("998")) cleaned = cleaned.slice(3);
    const parts = cleaned.match(/(\d{2})(\d{3})(\d{2})(\d{2})/);
    return parts
      ? `+998 ${parts[1]} ${parts[2]} ${parts[3]} ${parts[4]}`
      : `+998 ${cleaned}`;
  };

  // Serverga yuborish uchun faqat raqam ko‘rinishida tozalash
  const cleanPhoneNumber = (formatted) => {
    return `+998${formatted.replace(/\D/g, "").slice(-9)}`;
  };

  // Telefon formatni tekshirish
  const isValidPhone = (value) => /^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(value);

  // Pasport seriyani formatlash (katta harf + raqam)
  const formatPassportSeries = (value) => {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 9);
  };

  // Pasport seriya validatsiyasi: 2ta harf + 7ta raqam
  const isValidPassportSeries = (value) => /^[A-Z]{2}[0-9]{7}$/.test(value);

  // Tug‘ilgan sana validatsiyasi
  const isValidDateOfBirth = (value) => {
    if (!value) return false;
    const date = new Date(value);
    if (isNaN(date.getTime())) return false; // Invalid date
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      return age - 1 >= 18; // Check if at least 18 years old
    }
    return age >= 18;
  };

  const handleInputChange = (field, value) => {
    setNewEmployee((prev) => {
      const updated = { ...prev, [field]: value };
      // If role is not "ofis xodimi", clear login and password
      if (field === "role" && value !== "ofis xodimi") {
        updated.login = "";
        updated.password = "";
      }
      // Set isOfficeWorker based on role
      updated.isOfficeWorker = value === "ofis xodimi";
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!newEmployee.firstName) {
      toast.error("Iltimos, ismingizni kiriting!");
      return;
    }
    if (!newEmployee.lastName) {
      toast.error("Iltimos, familiyangizni kiriting!");
      return;
    }
    if (!newEmployee.dateOfBirth) {
      toast.error("Iltimos, tug‘ilgan sanani kiriting!");
      return;
    }
    if (!newEmployee.passportSeries) {
      toast.error("Iltimos, pasport seriyasini kiriting!");
      return;
    }
    if (!newEmployee.phone) {
      toast.error("Iltimos, telefon raqamingizni kiriting!");
      return;
    }
    if (!newEmployee.address) {
      toast.error("Iltimos, manzilingizni kiriting!");
      return;
    }
    if (!newEmployee.paymentType) {
      toast.error("Iltimos, to‘lov turini kiriting!");
      return;
    }
    if (!isValidPassportSeries(newEmployee.passportSeries)) {
      toast.error("Pasport seriyasi noto‘g‘ri! Masalan: AB1234567");
      return;
    }
    if (!isValidPhone(newEmployee.phone)) {
      toast.error("Telefon raqam noto‘g‘ri! Masalan: +998 90 123 45 67");
      return;
    }
    if (!isValidDateOfBirth(newEmployee.dateOfBirth)) {
      toast.error("Tug‘ilgan sana noto‘g‘ri yoki xodim 18 yoshdan kichik!");
      return;
    }
    if (newEmployee.role === "ofis xodimi" && (!newEmployee.login || !newEmployee.password)) {
      toast.error("Ofis xodimi uchun login va parol majburiy!");
      return;
    }

    const cleanedEmployee = {
      ...newEmployee,
      passportSeries: newEmployee.passportSeries.toUpperCase(),
      phone: cleanPhoneNumber(newEmployee.phone),
      salary: Number(newEmployee.salary) || 0,
      dateOfBirth: newEmployee.dateOfBirth ? new Date(newEmployee.dateOfBirth) : null,
      unitHeadPassword: newEmployee.unit === "boshqa" ? "" : newEmployee.unitHeadPassword,
      login: newEmployee.role === "ofis xodimi" ? newEmployee.login : "",
      isOfficeWorker: newEmployee.role === "ofis xodimi" ? true : false,
      password: newEmployee.role === "ofis xodimi" ? newEmployee.password : "",
    };

    try {
      if (editingEmployee) {
        await handleUpdateEmployee(cleanedEmployee);
      } else {
        await handleAddEmployee(cleanedEmployee);
      }
    } catch (err) {
      toast.error(`${err.data?.message || err.message}`);
    }
  };

  const handleClose = () => {
    setShowAddModal(false);
    setEditingEmployee(null);
  };

  return (
    <div className="modal-app-container">
      {(showAddModal || editingEmployee) && (
        <div className="modal-overlay-backdrop">
          <div className="employee-form-modal">
            <div className="modal-header-section">
              <div className="modal-title-group">
                {editingEmployee ? (
                  <Edit3 className="modal-icon" />
                ) : (
                  <UserPlus className="modal-icon" />
                )}
                <h3 className="modal-title">
                  {editingEmployee
                    ? "Ishchi ma'lumotlarini tahrirlash"
                    : "Yangi ishchi qo'shish"}
                </h3>
              </div>
              <button onClick={handleClose} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="form-fields-container">
              <div className="form-section">
                <div className="section-header">
                  <User className="section-icon" />
                  <h4 className="section-title">Shaxsiy ma'lumotlar</h4>
                </div>
                <div className="form-row-layout">
                  <div className="input-field-group">
                    <label className="field-label">
                      <User className="label-icon" />
                      Ism
                    </label>
                    <input
                      type="text"
                      value={newEmployee.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className="form-input-field"
                      placeholder="Ishchining ismi"
                    />
                  </div>
                  <div className="input-field-group">
                    <label className="field-label">
                      <User className="label-icon" />
                      Otasi ismi
                    </label>
                    <input
                      type="text"
                      value={newEmployee.middleName}
                      onChange={(e) =>
                        handleInputChange("middleName", e.target.value)
                      }
                      className="form-input-field"
                      placeholder="Ishchining otasi ismi"
                    />
                  </div>
                  <div className="input-field-group">
                    <label className="field-label">
                      <User className="label-icon" />
                      Familya
                    </label>
                    <input
                      type="text"
                      value={newEmployee.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className="form-input-field"
                      placeholder="Ishchining familyasi"
                    />
                  </div>
                </div>
                <div className="form-row-layout">
                  <div className="input-field-group">
                    <label className="field-label">
                      <Calendar className="label-icon" />
                      Tug‘ilgan sana
                    </label>
                    <input
                      type="date"
                      value={newEmployee.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      className="form-input-field"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <Briefcase className="section-icon" />
                  <h4 className="section-title">Ish ma'lumotlari</h4>
                </div>
                <div className="form-row-layout">
                  <div className="input-field-group">
                    <label className="field-label">
                      <Building2 className="label-icon" />
                      Bo'lim
                    </label>
                    <select
                      value={newEmployee.unit}
                      onChange={(e) =>
                        handleInputChange("unit", e.target.value)
                      }
                      className="form-select-field"
                    >
                      {[
                        "direktor",
                        "buxgalteriya",
                        "menejir",
                        "ombor",
                        "muhandis",
                        "sifat nazorati",
                        "elektrik",
                        "transport",
                        "xavfsizlik",
                        "tozalash",
                        "oshxona",
                        "sotuvchi",
                        "avto kara",
                        "sotuvchi eksport",
                        "sotuvchi menejir",
                        "polizol",
                        "polizol ish boshqaruvchi",
                        "rubiroid",
                        "rubiroid ish boshqaruvchi",
                        "Okisleniya",
                        "Okisleniya ish boshqaruvchi",
                        "boshqa",
                      ].map((unit) => (
                        <option key={unit} value={unit}>
                          {capitalizeFirstLetter(unit)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-field-group">
                    <label className="field-label">
                      <Briefcase className="label-icon" />
                      Ish staji
                    </label>
                    <input
                      type="text"
                      value={newEmployee.experience}
                      onChange={(e) =>
                        handleInputChange("experience", e.target.value)
                      }
                      className="form-input-field"
                      placeholder="Masalan: 5 yil"
                    />
                  </div>
                </div>
                <div className="form-row-layout">
                  <div className="input-field-group">
                    <label className="field-label">
                      <CreditCard className="label-icon" />
                      Pasport seriyasi
                    </label>
                    <input
                      type="text"
                      value={newEmployee.passportSeries}
                      onChange={(e) =>
                        handleInputChange(
                          "passportSeries",
                          formatPassportSeries(e.target.value)
                        )
                      }
                      className="form-input-field"
                      placeholder="HA1234567"
                    />
                  </div>
                  <div className="input-field-group">
                    <label className="field-label">
                      <Key className="label-icon" />
                      Bo'lim boshlig'i paroli
                    </label>
                    <input
                      type="text"
                      value={newEmployee.unitHeadPassword}
                      onChange={(e) =>
                        handleInputChange("unitHeadPassword", e.target.value)
                      }
                      className="form-input-field"
                      placeholder="Bo'lim boshlig'i paroli"
                      disabled={newEmployee.unit === "boshqa"}
                      style={
                        newEmployee.unit === "boshqa"
                          ? { background: "#eee", color: "#888" }
                          : {}
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <Phone className="section-icon" />
                  <h4 className="section-title">Aloqa ma'lumotlari</h4>
                </div>
                <div className="form-row-layout">
                  <div className="input-field-group">
                    <label className="field-label">
                      <Phone className="label-icon" />
                      Telefon raqami
                    </label>
                    <input
                      type="text"
                      value={formatPhoneInput(newEmployee.phone)}
                      onChange={(e) =>
                        handleInputChange(
                          "phone",
                          formatPhoneInput(e.target.value)
                        )
                      }
                      className="form-input-field"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div className="input-field-group">
                    <label className="field-label">
                      <MapPin className="label-icon" />
                      Manzil
                    </label>
                    <input
                      type="text"
                      value={newEmployee.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className="form-input-field"
                      placeholder="Toshkent, Chilanzar 45A"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <DollarSign className="section-icon" />
                  <h4 className="section-title">Maosh ma'lumotlari</h4>
                </div>
                <div className="form-row-layout">
                  <div className="input-field-group">
                    <label className="field-label">
                      <DollarSign className="label-icon" />
                      Maosh turi
                    </label>
                    <select
                      value={newEmployee.paymentType}
                      onChange={(e) =>
                        handleInputChange("paymentType", e.target.value)
                      }
                      className="form-select-field"
                    >
                      {["oylik", "kunlik", "soatlik", "ishbay"].map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-field-group">
                    <label className="field-label">
                      <DollarSign className="label-icon" />
                      Maosh miqdori (so'm)
                    </label>
                    <input
                      type="number"
                      value={newEmployee.salary}
                      onChange={(e) =>
                        handleInputChange("salary", e.target.value)
                      }
                      className="form-input-field"
                      placeholder="Maosh miqdori"
                      disabled={newEmployee.paymentType === "ishbay"}
                      style={
                        newEmployee.paymentType === "ishbay"
                          ? { background: "#eee", color: "#888" }
                          : {}
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <Shield className="section-icon" />
                  <h4 className="section-title">Rol va kirish ma'lumotlari</h4>
                </div>
                <div className="form-row-layout">
                  <div className="input-field-group">
                    <label className="field-label">
                      <UserCheck className="label-icon" />
                      Rol
                    </label>
                    <select
                      value={newEmployee.role}
                      onChange={(e) =>
                        handleInputChange("role", e.target.value)
                      }
                      className="form-select-field"
                    >
                      <option value="boshqa ishchilar">Rolni tanlang</option>
                      {["ofis xodimi", "ishlab chiqarish", "boshqa ishchilar"].map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row-layout">
                  <div className="input-field-group">
                    <label className="field-label">
                      <Key className="label-icon" />
                      Login
                    </label>
                    <input
                      type="text"
                      value={newEmployee.login}
                      onChange={(e) =>
                        handleInputChange("login", e.target.value)
                      }
                      className="form-input-field"
                      placeholder="Foydalanuvchi nomi"
                      disabled={newEmployee.role !== "ofis xodimi"}
                      style={
                        newEmployee.role !== "ofis xodimi"
                          ? { background: "#eee", color: "#888" }
                          : {}
                      }
                    />
                  </div>
                  <div className="input-field-group">
                    <label className="field-label">
                      <Key className="label-icon" />
                      Parol
                    </label>
                    <input
                      type="password"
                      value={newEmployee.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className="form-input-field"
                      placeholder="Parol"
                      disabled={newEmployee.role !== "ofis xodimi"}
                      style={
                        newEmployee.role !== "ofis xodimi"
                          ? { background: "#eee", color: "#888" }
                          : {}
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions-section">
              <button onClick={handleClose} className="cancel-action-btn">
                <X className="btn-icon" />
                Bekor qilish
              </button>
              <button onClick={handleSubmit} className="save-action-btn">
                <Save className="btn-icon" />
                {editingEmployee ? "Yangilash" : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeModal;