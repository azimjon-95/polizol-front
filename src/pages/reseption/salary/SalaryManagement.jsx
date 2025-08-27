import React, { useState, useEffect } from "react";
import { PiCreditCard, PiWarningFill, PiCalendar } from "react-icons/pi";
import { FaArrowLeft, FaP, FaPlus } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import {
  useGetAllEmployeesSalaryInfoQuery,
  usePaySalaryMutation,
  useAddPenaltyMutation,
} from "../../../context/alarApi";
import {
  Select,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
} from "antd";
import { useSelector } from "react-redux";
import { capitalizeFirstLetter } from "../../../hook/CapitalizeFirstLitter";
import SalaryLoadingState from "./loading/SalaryLoadingState";
import FinanceHistory from "./loading/FinanceHistory";
import "./style.css";
import { useCreateBonusMutation } from "../../../context/bonusApi";
import { toast, ToastContainer } from "react-toastify";

// Formatlash funksiyasi (masalan 1000000 -> "1 000 000")
const formatNumber = (num) => {
  if (!num) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// Raqamga qaytarish funksiyasi ("1 000 000" -> 1000000)
const parseNumber = (str) => {
  return Number(str.replace(/\s/g, ""));
};

const SalaryManagement = () => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null); // New state for selected role
  const { searchQuery } = useSelector((state) => state.search);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "naqt",
    salaryType: "oylik",
    description: "",
  });

  const [penaltyForm, setPenaltyForm] = useState({
    amount: "",
    reason: "",
    penaltyType: "boshqa",
  });

  const [openBonusModal, setOpenBonusModal] = useState(false);

  const {
    data: employeesData,
    isLoading,
    isError,
    error,
  } = useGetAllEmployeesSalaryInfoQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const [paySalary, { isLoading: isLoadingPayment }] = usePaySalaryMutation();
  const [addPenalty, { isLoading: isLoadingPenalty }] = useAddPenaltyMutation();
  const [createBonus] = useCreateBonusMutation();

  const months = [
    { value: 1, label: "Yanvar" },
    { value: 2, label: "Fevral" },
    { value: 3, label: "Mart" },
    { value: 4, label: "Aprel" },
    { value: 5, label: "May" },
    { value: 6, label: "Iyun" },
    { value: 7, label: "Iyul" },
    { value: 8, label: "Avgust" },
    { value: 9, label: "Sentyabr" },
    { value: 10, label: "Oktyabr" },
    { value: 11, label: "Noyabr" },
    { value: 12, label: "Dekabr" },
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );

  const departmentNames = {
    ishlab_chiqarish: "Ishlab chiqarish",
    sifat_nazorati: "Sifat nazorati",
    saler_meneger: "Saler menejer",
    ombor: "Ombor",
    buxgalteriya: "Buxgalteriya",
    elektrik: "Elektrik",
    transport: "Transport",
    xavfsizlik: "Xavfsizlik",
    tozalash: "Tozalash",
    oshxona: "Oshxona",
  };

  const paymentMethods = {
    naqt: "Naqd pul",
    bank: "Bank orqali",
  };

  const salaryMethods = {
    oylik: "Oylik",
    avans: "Avans",
  };

  const penaltyTypes = {
    kechikish: "Kechikish",
    kelmaslik: "Kelmaslik",
    qoida_buzish: "Qoida buzish",
    sifat_muammosi: "Sifat muammosi",
    boshqa: "Boshqa",
  };

  useEffect(() => {
    if (employeesData) {
      const all = [
        ...(employeesData?.innerData?.monthly || []),
        ...(employeesData?.innerData?.daily || []),
      ];
      setEmployees(all);
      setFilteredEmployees(all);
    }
  }, [employeesData]);

  // Filter employees based on search query and selected role
  useEffect(() => {
    let filtered = employees;

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter((emp) => {
        const fullName =
          `${emp.firstName} ${emp.middleName} ${emp?.lastName}`.toLowerCase();
        const department = departmentNames[emp.department]?.toLowerCase() || "";
        const position = emp.position.toLowerCase();
        const search = searchQuery.toLowerCase();

        return (
          fullName.includes(search) ||
          department.includes(search) ||
          position.includes(search)
        );
      });
    }

    // Apply role filter
    if (selectedRole) {
      filtered = filtered.filter((emp) => emp.role.includes(selectedRole));
    }

    setFilteredEmployees(filtered);
  }, [employees, searchQuery, selectedRole]);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showAlert("To'lov summasi to'g'ri kiritilmagan", "error");
      return;
    }

    try {
      await paySalary({
        employeeId: selectedEmployee._id,
        month: selectedMonth,
        year: selectedYear,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        salaryType: paymentForm.salaryType,
        description: paymentForm.description,
      }).unwrap();

      setShowPaymentModal(false);
      setPaymentForm({
        amount: "",
        paymentMethod: "naqt",
        salaryType: "oylik",
        description: "",
      });
      showAlert("To'lov muvaffaqiyatli amalga oshirildi", "success");
    } catch (error) {
      showAlert(
        "To'lov jarayonida xatolik yuz berdi: " + error.message,
        "error"
      );
    }
  };

  const handlePenalty = async (e) => {
    e.preventDefault();
    if (!penaltyForm.amount || !penaltyForm.reason) {
      showAlert("Barcha maydonlar to'ldirilishi shart", "error");
      return;
    }

    try {
      await addPenalty({
        employeeId: selectedEmployee._id,
        penaltyData: {
          amount: parseFloat(penaltyForm.amount),
          reason: penaltyForm.reason,
          penaltyType: penaltyForm.penaltyType,
          appliedDate: new Date().toISOString(),
        },
      }).unwrap();

      setShowPenaltyModal(false);
      setPenaltyForm({ amount: "", reason: "", penaltyType: "boshqa" });
      showAlert("Jarima muvaffaqiyatli qo'shildi", "success");
    } catch (error) {
      showAlert(
        "Jarima qo'shishda xatolik yuz berdi: " + error.message,
        "error"
      );
    }
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "to'liq_to'langan": {
        class: "factory-status-paid",
        text: "To'liq to'langan",
        icon: "✓",
      },
      "to'liq_to'lanmagan": {
        class: "factory-status-partial",
        text: "To'liq to'lanmagan",
        icon: "⏳",
      },
      "ortiqcha_to'langan": {
        class: "factory-status-overpaid",
        text: "Ortiqcha to'langan",
        icon: "↑",
      },
    };

    const config = statusConfig[status] || statusConfig["to'liq_to'lanmagan"];

    return (
      <span className={`factory-status-badge ${config.class}`}>
        <span>{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const calculateSummary = () => {
    const totalSalary = filteredEmployees?.reduce(
      (sum, emp) => sum + emp.salaryPayment.baseSalary,
      0
    );
    const totalPaid = filteredEmployees?.reduce(
      (sum, emp) => sum + emp.salaryPayment.totalPaid,
      0
    );
    const totalPenalties = filteredEmployees.reduce(
      (sum, emp) => sum + emp.salaryPayment.penaltyAmount,
      0
    );
    const totalRemaining = filteredEmployees.reduce(
      (sum, emp) => sum + emp.salaryPayment.remainingAmount,
      0
    );

    return { totalSalary, totalPaid, totalPenalties, totalRemaining };
  };

  const summary = calculateSummary();
  const uniqueRoles = [...new Set(employees.map((emp) => emp.role))];
  const roleOptions = [
    { label: "Barchasi", value: null }, // Option to reset filter
    ...uniqueRoles.map((role) => ({
      label: capitalizeFirstLetter(role),
      value: role,
    })),
  ];

  const onFinish = async (values) => {
    const payload = {
      employeeId: openBonusModal?._id,
      amount: values.amount,
      period: values.period.format("YYYY-MM"),
      description: values.description || "",
    };
    try {
      await createBonus(payload).unwrap();
      toast.success("Bonus yaratildi");
      form.resetFields();
      setOpenBonusModal(null);
    } catch (e) {
      toast.error(e?.data?.message || "Xatolik yuz berdi");
    }
  };

  return (
    <div className="factory-salary-container">
      <ToastContainer />
      {alert && (
        <div className={`factory-alert factory-alert-${alert.type}`}>
          <span>{alert.message}</span>
        </div>
      )}
      <div className="factory-summary-cards">
        <button
          onClick={() => {
            navigate(-1);
            localStorage.setItem("ruberoid-active-tab", "Harajatlar");
          }}
          className="factory-summary-cardsBtn"
        >
          <FaArrowLeft />
        </button>
        <div className="factory-summary-card total-salary">
          <div className="factory-card-label">💼 Umumiy maosh fondi</div>
          <div className="factory-card-amount green">
            {formatCurrency(summary.totalSalary)}
          </div>
        </div>
        <div className="factory-summary-card total-paid">
          <div className="factory-card-label">💳 To'langan summa</div>
          <div className="factory-card-amount blue">
            {formatCurrency(summary.totalPaid)}
          </div>
        </div>
        <div className="factory-summary-card total-penalties">
          <div className="factory-card-label">⚠️ Jarimalar</div>
          <div className="factory-card-amount red">
            {formatCurrency(summary.totalPenalties)}
          </div>
        </div>
        <div className="factory-summary-card total-remaining">
          <div className="factory-card-label">⏳ Qolgan summa</div>
          <div className="factory-card-amount orange">
            {formatCurrency(summary.totalRemaining)}
          </div>
        </div>
      </div>

      <div className="factory-employees-table-container">
        <div className="factory-table-header">
          <h2 className="factory-table-title">
            ({months.find((m) => m.value === selectedMonth)?.label}{" "}
            {selectedYear})
          </h2>
          <div className="factory-month-selector">
            <div className="factory-select-group">
              <label className="factory-select-label">📅 Oy</label>
              <select
                className="factory-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="factory-select-group">
              <label className="factory-select-label">📅 Yil</label>
              <select
                className="factory-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <Select
              placeholder="Lavozim tanlang"
              style={{ width: 140, height: 25 }}
              options={roleOptions}
              value={selectedRole}
              onChange={(value) => {
                setSelectedRole(value); // Update selected role
              }}
              allowClear // Allows clearing the selection
            />
          </div>
        </div>

        {isLoading ? (
          <SalaryLoadingState />
        ) : isError ? (
          <div className="factory-empty-state">
            <div className="factory-empty-state-icon">❌</div>
            <h3 className="factory-empty-state-title">Xatolik yuz berdi</h3>
            <p className="factory-empty-state-description">
              {error?.message || "Ma'lumotlarni yuklashda xatolik"}
            </p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="factory-empty-state">
            <div className="factory-empty-state-icon">👤</div>
            <h3 className="factory-empty-state-title">Ishchilar topilmadi</h3>
            <p className="factory-empty-state-description">
              {searchQuery || selectedRole
                ? "Qidiruv yoki filtr bo'yicha natija topilmadi"
                : "Bu oy uchun ishchilar ma'lumoti yo'q"}
            </p>
          </div>
        ) : (
          <div className="factory-employees-tableConat">
            <table className="factory-employees-table">
              <thead className="factory-table-head">
                <tr>
                  <th>👤 Ishchi</th>
                  <th>🏢 Bo'lim</th>
                  <th>💰 Maosh turi</th>
                  <th>💰 Asosiy maosh</th>
                  <th>💵 To'langan</th>
                  <th>⚠️ Jarimalar</th>
                  <th>💸 Avans</th>
                  <th>⏳ Qolgan</th>
                  <th>📊 Holat</th>
                  <th>⚙️ Amallar</th>
                  <th>📈 Maosh tarixi</th>
                </tr>
              </thead>
              <tbody className="factory-table-body">
                {filteredEmployees.map((employee, inx) => (
                  <tr key={inx}>
                    <td>
                      <div className="factory-employee-name">
                        {employee?.firstName} {employee?.lastName}
                      </div>
                    </td>
                    <td>
                      <span className="factory-department-badge">
                        {capitalizeFirstLetter(employee.unit)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-type">
                        {employee.type === "ishbay" ? "Ishbay" : "Oylik"}
                      </span>
                    </td>
                    <td>{formatCurrency(employee.salaryPayment.baseSalary)}</td>
                    <td>{formatCurrency(employee.salaryPayment.totalPaid)}</td>
                    <td>
                      {formatCurrency(employee.salaryPayment.penaltyAmount)}
                    </td>
                    <td>
                      {formatCurrency(employee.salaryPayment.advanceDebt || 0)}
                    </td>
                    <td>
                      {formatCurrency(employee.salaryPayment.remainingAmount)}
                    </td>
                    <td>{getStatusBadge(employee.salaryPayment.status)}</td>
                    <td>
                      <div className="factory-action-buttons">
                        <button
                          className="factory-btn factory-btn-primary"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setPaymentForm({
                              ...paymentForm,
                              amount:
                                employee.salaryPayment.remainingAmount || 0, // Pre-fill for oylik
                            });
                            setShowPaymentModal(true);
                          }}
                          data-tooltip="To'lov qilish"
                        >
                          <PiCreditCard style={{ fontSize: "20px" }} /> To'lov
                        </button>
                        <button
                          className="factory-btn factory-btn-warning"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowPenaltyModal(true);
                          }}
                          data-tooltip="Jarima qo'shish"
                        >
                          <PiWarningFill style={{ fontSize: "20px" }} /> Jarima
                        </button>

                        <button
                          onClick={() => setOpenBonusModal(employee)}
                          className="factory-btn factory-btn-success"
                        >
                          <FaPlus />
                          Bonus
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="factory-action-buttons">
                        <button
                          className="factory-btn factory-btn-primary"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowPaymentHistoryModal(true);
                          }}
                          data-tooltip="Maosh tarixi"
                        >
                          <PiCalendar style={{ fontSize: "20px" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bonus Modal */}
      <Modal
        title={`Bonus - ${openBonusModal?.firstName} ${openBonusModal?.lastName} uchun`}
        open={openBonusModal}
        onCancel={() => setOpenBonusModal(null)}
        footer={null}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          initialValues={{ employeeId: openBonusModal?._id }}
        >
          <Form.Item
            name="amount"
            label="Bonus summasi"
            rules={[{ required: true, message: "Summa kerak" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="period"
            label="Bonus uchun sana"
            rules={[{ required: true, message: "Sana kerak" }]}
          >
            <DatePicker picker="month" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="description" label="Izoh (ixtiyoriy)">
            <Input.TextArea rows={3} placeholder="Izoh (ixtiyoriy)" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Saqlash
          </Button>
        </Form>
      </Modal>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="factory-modal-overlay">
          <div className="factory-modal">
            <div className="factory-modal-header">
              <h2 className="factory-modal-title">
                💳 To'lov qilish - {selectedEmployee?.firstName}{" "}
                {selectedEmployee?.lastName}
              </h2>
              <button
                className="factory-modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePayment}>
              <div className="factory-modal-body">
                <div className="factory-form-group">
                  <label className="factory-form-label">To'lov summasi</label>
                  <input
                    type="text"
                    className="factory-form-input"
                    value={
                      paymentForm.salaryType === "oylik"
                        ? formatNumber(
                          selectedEmployee?.salaryPayment?.remainingAmount ||
                          0
                        )
                        : formatNumber(paymentForm.amount)
                    }
                    onChange={(e) => {
                      if (paymentForm.salaryType === "avans") {
                        const val = parseNumber(e.target.value);
                        setPaymentForm({ ...paymentForm, amount: val });
                      }
                    }}
                    placeholder={
                      paymentForm.salaryType === "avans"
                        ? "Summani kiriting"
                        : "Oylik uchun qolgan summa"
                    }
                    disabled={paymentForm.salaryType === "oylik"} // Disable input for oylik
                    required
                  />
                </div>
                <div className="factory-form-group-box">
                  <div className="factory-form-group">
                    <label className="factory-form-label">To'lov usuli</label>
                    <div className="factory-payment-method-grid">
                      {Object.entries(paymentMethods).map(([key, value]) => (
                        <div
                          className="factory-payment-method-option"
                          key={key}
                        >
                          <input
                            type="radio"
                            id={`payment-${key}`}
                            name="paymentMethod"
                            value={key}
                            className="factory-payment-method-input"
                            checked={paymentForm.paymentMethod === key}
                            onChange={(e) =>
                              setPaymentForm({
                                ...paymentForm,
                                paymentMethod: e.target.value,
                              })
                            }
                          />
                          <label
                            htmlFor={`payment-${key}`}
                            className="factory-payment-method-label"
                          >
                            {value}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="factory-form-group">
                    <label className="factory-form-label">Maosh turi</label>
                    <div className="factory-payment-method-grid">
                      {Object.entries(salaryMethods).map(([key, value]) => (
                        <div
                          className="factory-payment-method-option"
                          key={key}
                        >
                          <input
                            type="radio"
                            id={`salary-${key}`}
                            name="salaryType"
                            value={key}
                            className="factory-payment-method-input"
                            checked={paymentForm.salaryType === key}
                            onChange={(e) => {
                              const newSalaryType = e.target.value;
                              setPaymentForm({
                                ...paymentForm,
                                salaryType: newSalaryType,
                                amount:
                                  newSalaryType === "oylik"
                                    ? selectedEmployee?.salaryPayment
                                      ?.remainingAmount || 0
                                    : "",
                              });
                            }}
                          />
                          <label
                            htmlFor={`salary-${key}`}
                            className="factory-payment-method-label"
                          >
                            {value}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="factory-form-group">
                  <label className="factory-form-label">Izoh</label>
                  <textarea
                    className="factory-form-textarea"
                    value={paymentForm.description}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="To'lov haqida izoh"
                  />
                </div>
              </div>
              <div className="factory-modal-footer">
                <button
                  type="button"
                  className="factory-btn factory-btn-outline"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Bekor qilish
                </button>
                <Button
                  htmlType="submit"
                  className="factory-btn factory-btn-primary"
                  disabled={isLoadingPayment}
                  loading={isLoadingPayment}
                >
                  To'lovni tasdiqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Penalty Modal */}
      {showPenaltyModal && (
        <div className="factory-modal-overlay">
          <div className="factory-modal">
            <div className="factory-modal-header">
              <h2 className="factory-modal-title">
                ⚠️ Jarima qo'shish - {selectedEmployee?.firstName}{" "}
                {selectedEmployee?.lastName}
              </h2>
              <button
                className="factory-modal-close"
                onClick={() => setShowPenaltyModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePenalty}>
              <div className="factory-modal-body">
                <div className="factory-form-group">
                  <label className="factory-form-label">Jarima summasi</label>
                  <input
                    type="text"
                    className="factory-form-input"
                    value={formatNumber(penaltyForm.amount)}
                    onChange={(e) => {
                      const val = parseNumber(e.target.value);
                      setPenaltyForm({ ...penaltyForm, amount: val });
                    }}
                    placeholder="Summani kiriting"
                    required
                  />
                </div>
                <div className="factory-form-group">
                  <label className="factory-form-label">Jarima turi</label>
                  <select
                    className="factory-form-select"
                    value={penaltyForm.penaltyType}
                    onChange={(e) =>
                      setPenaltyForm({
                        ...penaltyForm,
                        penaltyType: e.target.value,
                      })
                    }
                  >
                    {Object.entries(penaltyTypes).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="factory-form-group">
                  <label className="factory-form-label">Jarima sababi</label>
                  <textarea
                    className="factory-form-textarea"
                    value={penaltyForm.reason}
                    onChange={(e) =>
                      setPenaltyForm({ ...penaltyForm, reason: e.target.value })
                    }
                    placeholder="Jarima sababini kiriting"
                    required
                  />
                </div>
              </div>
              <div className="factory-modal-footer">
                <button
                  type="button"
                  className="factory-btn factory-btn-outline"
                  onClick={() => setShowPenaltyModal(false)}
                >
                  Bekor qilish
                </button>
                <Button
                  htmlType="submit"
                  className="factory-btn factory-btn-warning"
                  disabled={isLoadingPenalty}
                  loading={isLoadingPenalty}
                >
                  Jarimani tasdiqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistoryModal && (
        <div className="ghy-factory-modal-overlay">
          <div className="ghy-factory-modal">
            <FinanceHistory
              employeeId={selectedEmployee?._id}
              fullName={`${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
            />
            <div className="factory-modal-footer">
              <button
                type="button"
                className="factory-btn factory-btn-outline"
                onClick={() => setShowPaymentHistoryModal(false)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;
