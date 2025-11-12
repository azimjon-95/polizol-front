import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import {
  Users,
  UserPlus,
  Filter,
  Edit,
  Trash2,
  Building,
  Shield,
  Clock,
  Key,
  Phone,
  MapPin,
  Download,
  Cake,
} from "lucide-react";
import { PhoneNumberFormat } from "../../../hook/NumberFormat";
import { capitalizeFirstLetter } from "../../../hook/CapitalizeFirstLitter";
import "./style.css";
import EmployeeModal from "./WorkersForm";
import {
  useGetWorkersQuery,
  useAddWorkerMutation,
  useUpdateWorkerMutation,
  useDeleteWorkerMutation,
} from "../../../context/workersApi";

const RuberoidFactoryHR = () => {
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [todayBirthdays, setTodayBirthdays] = useState(new Set());
  const { searchQuery } = useSelector((state) => state.search);
  const role = localStorage.getItem("role");

  const {
    data: employees = { innerData: [] },
    isLoading,
    isError,
    error,
  } = useGetWorkersQuery();

  const [addWorker] = useAddWorkerMutation();
  const [updateWorker] = useUpdateWorkerMutation();
  const [deleteWorker] = useDeleteWorkerMutation();

  const units = useMemo(
    () => ({
      all: "Barcha bo'limlar",
      direktor: "Direktor",
      buxgalteriya: "Buxgalteriya",
      menejir: "Menejir",
      ombor: "Ombor",
      sifat_nazorati: "Sifat nazorati",
      svarshik: "Svarshik",
      elektrik: "Elektrik",
      transport: "Transport",
      xavfsizlik: "Xavfsizlik",
      tozalash: "Tozalash",
      oshxona: "Oshxona",
      sotuvchi: "Sotuvchi",
      sotuvchi_eksport: "Sotuvchi Eksport",
      avto_kara: "Avto kara",
      muhandis: "Muhandis",
      sotuvchi_menejir: "Sotuvchi Menejir",
      polizol: "Polizol",
      polizol_ish_boshqar: "Polizol Ish Boshqaruvchi",
      polizol_ish_boshqaruvchi: "Polizol Ish Boshqaruvchi",
      rubiroid: "Rubiroid",
      rubiroid_ish_boshqaruvchi: "Rubiroid Ish Boshqaruvchi",
      Okisleniya: "Okisleniya",
      Okisleniya_ish_boshqaruvchi: "Okisleniya Ish Boshqaruvchi",
      boshqa: "Boshqa",
    }),
    []
  );

  const paymentTypes = useMemo(
    () => ({
      oylik: "Oylik maosh",
      kunlik: "Kunlik maosh",
      soatlik: "Soatlik maosh",
      ishbay: "Ishbay maosh",
    }),
    []
  );

  const roles = useMemo(
    () => ({
      "ofis xodimi": "Ofis Xodimi",
      "ishlab chiqarish": "Ishlab Chiqarish",
      "boshqa ishchilar": "Boshqa Ishchilar",
    }),
    []
  );

  // Check for birthdays and set todayBirthdays
  useEffect(() => {
    const today = new Date(); // August 23, 2025, 02:39 PM +05
    const todayMonth = today.getMonth(); // 7 (August, 0-based)
    const todayDay = today.getDate(); // 23
    const birthdayIds = new Set();

    const employeeList = Array.isArray(employees?.innerData)
      ? employees.innerData
      : [];

    employeeList.forEach((employee) => {
      if (employee.dateOfBirth) {
        const birthDate = new Date(employee.dateOfBirth);
        const birthMonth = birthDate.getMonth();
        const birthDay = birthDate.getDate();

        if (todayMonth === birthMonth && todayDay === birthDay) {
          birthdayIds.add(employee._id);
          toast(
            <div className="birthday-toast">
              <span>
                🎉 Bugun {capitalizeFirstLetter(employee.firstName)}{" "}
                {capitalizeFirstLetter(employee.lastName)}ning tug'ilgan kuni!
              </span>
            </div>,
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              className: "birthday-toast-container",
            }
          );
        }
      }
    });

    setTodayBirthdays(birthdayIds);
  }, [employees]);

  useEffect(() => {
    const employeeList = Array.isArray(employees?.innerData)
      ? employees.innerData
      : [];
    const normalizedEmployeeList = employeeList.map((emp) => ({
      ...emp,
      unit: emp.unit ? emp.unit.replace(/\s+/g, "_") : emp.unit,
    }));

    let filtered = [...normalizedEmployeeList];

    if (selectedUnit !== "all") {
      filtered = filtered.filter((emp) => emp.unit === selectedUnit);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((emp) =>
        [
          emp.firstName || "",
          emp.lastName || "",
          emp.unit ? units[emp.unit] : "",
          emp.experience || "",
          emp.phone || "",
          emp.address || "",
          emp.dateOfBirth
            ? new Date(emp.dateOfBirth).toLocaleDateString("uz-UZ")
            : "",
        ].some((field) => field.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredEmployees((prev) => {
      const prevStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(filtered);
      return prevStr !== nextStr ? filtered : prev;
    });
  }, [employees, selectedUnit, searchQuery, units]);

  const handleAddEmployee = async (newEmployee) => {
    try {
      const employee = {
        ...newEmployee,
        salary: Number(newEmployee.salary),
        dateOfBirth: newEmployee.dateOfBirth || null,
      };
      await addWorker(employee).unwrap();
      setShowAddModal(false);
      toast.success("Ishchi muvaffaqiyatli qo'shildi!");
    } catch (err) {
      toast.error(
        `Ishchi qo'shishda xatolik: ${err.data?.message || err.message}`
      );
    }
  };

  const handleUpdateEmployee = async (updatedEmployee) => {
    try {
      const { id, ...employeeData } = updatedEmployee;
      await updateWorker({
        id: editingEmployee._id,
        ...employeeData,
        dateOfBirth: employeeData.dateOfBirth || null,
      }).unwrap();
      setEditingEmployee(null);
      toast.success("Ishchi ma'lumotlari muvaffaqiyatli yangilandi!");
    } catch (err) {
      toast.error(
        `Ma'lumotlarni yangilashda xatolik: ${err.data?.message || err.message}`
      );
    }
  };

  const handleDeleteEmployee = (id) => {
    if (!id) {
      toast.error("Xatolik: Ishchi ID topilmadi");
      return;
    }
    toast(
      ({ closeToast }) => (
        <div className="confirm-toast">
          <p>Ishchini o'chirishni tasdiqlaysizmi?</p>
          <div className="confirm-toast-buttons">
            <button
              onClick={async () => {
                try {
                  await deleteWorker(id).unwrap();
                  toast.success("Ishchi muvaffaqiyatli o'chirildi!");
                  closeToast();
                } catch (err) {
                  toast.error(
                    `O'chirishda xatolik: ${err.data?.message || err.message}`
                  );
                  closeToast();
                }
              }}
              className="confirm-btn"
            >
              Tasdiqlash
            </button>
            <button onClick={closeToast} className="cancel-btn">
              Bekor qilish
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        position: "top-center",
      }
    );
  };

  const formatSalary = (salary, type) => {
    const formatted = salary?.toLocaleString("uz-UZ");
    switch (type) {
      case "oylik":
        return `${formatted} so'm/oy`;
      case "kunlik":
        return `${formatted} so'm/kun`;
      case "soatlik":
        return `${formatted} so'm/soat`;
      default:
        return `${formatted} so'm`;
    }
  };

  const formatDateOfBirth = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const exportToExcel = () => {
    const excelData = filteredEmployees.map((emp, index) => ({
      "№": index + 1,
      Ism: emp.firstName || "",
      Familya: emp.lastName || "",
      "Otasining ismi": emp.middleName || "",
      "Bo'lim": units[emp.unit] || "",
      "Ish staji": emp.experience || "",
      "Pasport seriyasi": emp.passportSeries || "",
      Telefon: emp.phone || "",
      Manzil: emp.address || "",
      "To'lov turi": paymentTypes[emp.paymentType] || "",
      Miqdor: formatSalary(emp.salary, emp.paymentType),
      "Ofis xodimi": emp.isOfficeWorker ? "Ha" : "Yo'q",
      Login: emp.login || "Tayinlanmagan",
      Rol: emp.role ? roles[emp.role] : "Tayinlanmagan",
      "Tug'ilgan kun": formatDateOfBirth(emp.dateOfBirth),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 5 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
    ];
    ws["!cols"] = colWidths;

    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = headerStyle;
    }

    const dataStyle = {
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } },
      },
    };

    for (let row = 1; row <= range.e.r; row++) {
      const fillColor = row % 2 === 0 ? "F8F9FA" : "FFFFFF";
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          ...dataStyle,
          fill: { fgColor: { rgb: fillColor } },
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Ishchilar ro'yxati");
    const currentDate = new Date()
      .toLocaleDateString("uz-UZ")
      .replace(/\//g, "-");
    const filename = `Ishchilar_royxati_${currentDate}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success("Excel fayli muvaffaqiyatli yuklab olindi!");
  };

  if (isLoading) {
    return (
      <div className="ruberoid-factory-hr-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="ruberoid-factory-hr-container">
      <ToastContainer />
      <div className="hr-dashboard-header">
        <div className="header-content-wrapper">
          <div className="factory-brand-section">
            <Building className="factory-logo-icon" />
            <div className="brand-text-container">
              <h1 className="factory-main-title">Kadrlar Boshqaruvi Tizimi</h1>
              <p className="factory-subtitle"></p>
            </div>
          </div>
          <div className="header-stats-panel">
            <div className="stat-item-card">
              <Users className="stat-icon" />
              <div className="stat-details">
                <span className="stat-number">
                  {employees?.innerData?.length || 0}
                </span>
                <span className="stat-label">Jami ishchilar</span>
              </div>
            </div>
            <div className="stat-item-card">
              <Shield className="stat-icon" />
              <div className="stat-details">
                <span className="stat-number">
                  {employees?.innerData?.filter((e) => e.isOfficeWorker)
                    .length || 0}
                </span>
                <span className="stat-label">Ofis xodimlari</span>
              </div>
            </div>
            <div className="controls-panel-section">
              {role !== "direktor" && (
                <button
                  onClick={() => {
                    setShowAddModal(true);
                  }}
                  className="add-employee-btn"
                >
                  <UserPlus className="btn-icon" />
                  Yangi ishchi qo'shish
                </button>
              )}
              <div className="department-filter-wrapper">
                <Filter className="filter-dropdown-icon" />
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="department-filter-select"
                >
                  {Object.entries(units).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={exportToExcel}
              className="export-excel-btn"
              title="Excel faylini yuklab olish"
            >
              <Download />
              Excel
            </button>
          </div>
        </div>
      </div>
      <div className="hr-main-content">
        <div className="employees-table-container">
          <table className="employees-data-table">
            <thead className="table-header-section">
              <tr>
                <th>Ism Familya Otasini ismi</th>
                <th>Bo'lim</th>
                <th>Lavozim</th>
                <th>Ish staji</th>
                <th>Pasport</th>
                <th>Telefon</th>
                <th>Manzil</th>
                <th>Tug'ilgan kun</th>
                <th>Miqdor</th>
                <th>Login ma'lumotlari</th>
                {role !== "direktor" && <th>Amallar</th>}
              </tr>
            </thead>
            <tbody className="table-body-section">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee, inx) => {
                  return (
                    <tr key={inx} className="employee-table-row">
                      <td>
                        <span className="employee-name-cell">
                          {capitalizeFirstLetter(employee?.firstName || "")}{" "}
                          {capitalizeFirstLetter(employee?.lastName || "")}{" "}
                          {capitalizeFirstLetter(employee?.middleName || "")}
                          {employee.isOfficeWorker && (
                            <span className="office-worker-badge">
                              <Shield className="badge-icon" />
                            </span>
                          )}
                        </span>
                      </td>
                      <td>{roles[employee.role] || "-"}</td>
                      <td>{units[employee.unit] || "-"}</td>
                      <td>
                        <span className="experience-badge">
                          <Clock className="experience-icon" />
                          {employee.experience || 0}
                        </span>
                      </td>
                      <td className="passport-series-cell">
                        {employee.passportSeries || "-"}
                      </td>
                      <td className="phone-cell">
                        <Phone className="phone-icon" />
                        {PhoneNumberFormat(employee.phone || "")}
                      </td>
                      <td className="address-cell">
                        <MapPin className="address-icon" />
                        {capitalizeFirstLetter(employee.address || "")}
                      </td>
                      <td>
                        <span
                          className={`date-of-birth-cell ${
                            todayBirthdays.has(employee._id)
                              ? "birthday-today"
                              : ""
                          }`}
                        >
                          <Cake className="date-of-birth-icon" />
                          {formatDateOfBirth(employee.dateOfBirth)}
                        </span>
                      </td>
                      <td className="salary-amount-cell">
                        {employee.salary === 0
                          ? employee.paymentType
                          : formatSalary(employee.salary, employee.paymentType)}
                      </td>
                      <td className="login-credentials-cell">
                        {employee.isOfficeWorker ? (
                          <div className="credentials-info">
                            <div className="login-display">
                              <Key className="credentials-icon" />
                              {employee.login || "Tayinlanmagan"}
                            </div>
                            {employee.role && (
                              <span className="role-badge">
                                {roles[employee.role] || "Tayinlanmagan"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="no-credentials-text">
                            Login talab qilinmaydi
                          </span>
                        )}
                      </td>
                      {role !== "direktor" && (
                        <td className="actions-cell">
                          <div className="action-buttons-group">
                            <button
                              onClick={() => {
                                setEditingEmployee(employee);
                              }}
                              className="edit-action-btn"
                              title="Tahrirlash"
                            >
                              <Edit className="action-icon" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee._id)}
                              className="delete-action-btn"
                              title="O'chirish"
                            >
                              <Trash2 className="action-icon" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={role !== "direktor" ? 10 : 9}
                    className="no-data"
                  >
                    Ma'lumot topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {(showAddModal || editingEmployee) && (
        <EmployeeModal
          roles={roles}
          paymentTypes={paymentTypes}
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          editingEmployee={editingEmployee}
          setEditingEmployee={setEditingEmployee}
          handleAddEmployee={handleAddEmployee}
          handleUpdateEmployee={handleUpdateEmployee}
        />
      )}
    </div>
  );
};

export default RuberoidFactoryHR;
