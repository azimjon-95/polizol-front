import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { User, AlertCircle, Phone, MapPin, Users, Activity, Filter, RefreshCw, Eye, X, Plus, Edit, Trash2, Target } from 'lucide-react';
import {
    useGetSalesEmployeesQuery,
    useGetAllPlansQuery,
    useCreatePlanMutation,
    useUpdatePlanMutation,
    useDeletePlanMutation,
} from '../../../../context/planSalesApi';
import { PhoneNumberFormat } from '../../../../hook/NumberFormat';
import { capitalizeFirstLetter } from '../../../../hook/CapitalizeFirstLitter';
import './style.css';

// Notifikatsiya funksiyalari
const notifySuccess = (message) => toast.success(message, { position: "top-right", autoClose: 3000 });
const notifyError = (message) => toast.error(message, { position: "top-right", autoClose: 3000 });
const notifyInfo = (message) => toast.info(message, { position: "top-right", autoClose: 3000 });

// Optimized PerformanceCell component
const PerformanceCell = React.memo(({ actual, plan, unit = '', className = '' }) => {
    const percentage = plan > 0 ? Math.round((actual / plan) * 100) : 0;
    const performanceClass = getPerformanceClass(percentage);

    const formatNumber = (num) => {
        if (!num && num !== 0) return '0';
        if (unit === 'M') return `${(num / 1000000).toFixed(1)}M`;
        if (unit === 'K') return `${(num / 1000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    return (
        <td className={`sdash-data-cell ${className}`}>
            <div className="sdash-performance-wrapper">
                <div className="sdash-performance-numbers">
                    <span className="sdash-actual-amount">{formatNumber(actual)}</span>
                    <span className="sdash-target-amount"> / {formatNumber(plan)}</span>
                </div>
                <div className={`sdash-performance-bar ${performanceClass}`}>
                    <div className="sdash-progress-fill" style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
                <div className={`sdash-percentage-text ${performanceClass}`}>{percentage}%</div>
            </div>
        </td>
    );
});

// Performance class helper function
const getPerformanceClass = (percentage) => {
    if (percentage >= 100) return 'sdash-performance-excellent';
    if (percentage >= 80) return 'sdash-performance-good';
    if (percentage >= 60) return 'sdash-performance-average';
    return 'sdash-performance-poor';
};

const SalespersonDashboard = () => {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({
        employeeId: '',
        targetAmount: '',
        month: selectedMonth,
    });
    const role = localStorage.getItem("role");
    const workersId = localStorage.getItem("workerId");

    // API hooks
    const {
        data: employeesData = { innerData: [] },
        isLoading: employeesLoading,
        error: employeesError,
    } = useGetSalesEmployeesQuery();
    const {
        data: plansData = { innerData: [] },
        isLoading: plansLoading,
        error: plansError,
        refetch: refetchPlans,
    } = useGetAllPlansQuery();
    const [createPlan] = useCreatePlanMutation();
    const [updatePlan] = useUpdatePlanMutation();
    const [deletePlan] = useDeletePlanMutation();

    // Safely filter employees based on role
    const salesEmployees = employeesData?.innerData?.length
        ? role === "sotuvchi"
            ? employeesData?.innerData.filter((employee) => employee?._id === workersId) ?? []
            : employeesData?.innerData
        : [];

    // Safely filter plans based on role
    const allPlans = plansData?.innerData?.length
        ? role === "sotuvchi"
            ? plansData?.innerData.filter((plan) => plan?.employeeId?._id === workersId) ?? []
            : plansData?.innerData
        : [];

    // Generate month options for the last 12 months and next 3 months
    const generateMonthOptions = () => {
        const months = [];
        const currentDate = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push({
                value: monthStr,
                label: date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' }),
            });
        }

        for (let i = 1; i <= 3; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const monthStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push({
                value: monthStr,
                label: date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' }),
            });
        }

        return months;
    };

    // Get previous month string
    const getPreviousMonth = (monthStr) => {
        const [year, month] = monthStr.split('.');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        date.setMonth(date.getMonth() - 1);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    // Combine employee and plan data
    const combineEmployeeData = () => {
        if (!salesEmployees || !allPlans) return [];

        return salesEmployees?.map((employee) => {
            const employeePlans = allPlans?.filter((plan) => {
                const employeeId = plan.employeeId?._id || plan.employeeId;
                return employeeId === employee._id;
            });

            const currentPlan = employeePlans?.find((plan) => plan.month === selectedMonth);
            const previousMonthPlan = employeePlans?.find((plan) => {
                const prevMonth = getPreviousMonth(selectedMonth);
                return plan.month === prevMonth;
            });

            return {
                ...employee,
                currentPlan: currentPlan || null,
                previousPlan: previousMonthPlan || null,
                allPlans: employeePlans,
            };
        });
    };

    // Filter employees
    const filteredEmployees = combineEmployeeData()?.filter((employee) => {
        const matchesSearch =
            employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.lastName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && employee.currentPlan) ||
            (filterStatus === 'inactive' && !employee.currentPlan);

        return matchesSearch && matchesStatus;
    });

    // Handle plan creation
    const handleCreatePlan = async (e) => {
        e.preventDefault();
        if (!planForm.employeeId || !planForm.targetAmount || isNaN(planForm.targetAmount) || planForm.targetAmount <= 0) {
            notifyError('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring');
            return;
        }

        try {
            await createPlan({
                ...planForm,
                targetAmount: parseFloat(planForm.targetAmount),
            }).unwrap();
            setShowPlanModal(false);
            setPlanForm({ employeeId: '', targetAmount: '', month: selectedMonth });
            notifySuccess('Plan muvaffaqiyatli yaratildi!');
            refetchPlans();
        } catch (error) {
            console.error('Plan yaratishda xatolik:', error);
            notifyError('Plan yaratishda xatolik yuz berdi');
        }
    };

    // Handle plan update
    const handleUpdatePlan = async (e) => {
        e.preventDefault();
        if (!planForm.employeeId || !planForm.targetAmount || isNaN(planForm.targetAmount) || planForm.targetAmount <= 0) {
            notifyError('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring');
            return;
        }

        try {
            await updatePlan({
                id: editingPlan._id,
                ...planForm,
                targetAmount: parseFloat(planForm.targetAmount),
            }).unwrap();
            setShowPlanModal(false);
            setEditingPlan(null);
            setPlanForm({ employeeId: '', targetAmount: '', month: selectedMonth });

            notifySuccess('Plan muvaffaqiyatli yangilandi!');
            refetchPlans();
        } catch (error) {
            console.error('Plan yangilashda xatolik:', error);
            notifyError('Plan yangilashda xatolik yuz berdi');
        }
    };

    // Handle plan deletion
    const handleDeletePlan = async (planId) => {
        try {
            const res = await deletePlan(planId).unwrap();
            notifySuccess('Plan muvaffaqiyatli o\'chirildi!');
            refetchPlans();
        } catch (error) {
            console.error('Plan o\'chirishda xatolik:', error);
            notifyError('Plan o\'chirishda xatolik yuz berdi');
        }
    };

    // Open plan modal for editing
    const openEditPlanModal = (plan) => {
        setEditingPlan(plan);
        setPlanForm({
            employeeId: plan.employeeId?._id || plan.employeeId,
            targetAmount: plan.targetAmount.toString(),
            month: plan.month,
        });
        setShowPlanModal(true);
    };

    // Open plan modal for creating
    const openCreatePlanModal = (employeeId = '') => {
        setEditingPlan(null);
        setPlanForm({
            employeeId,
            targetAmount: '',
            month: selectedMonth,
        });
        setShowPlanModal(true);
    };

    // Status badge component
    const StatusBadge = ({ hasCurrentPlan }) => (
        <span className={`sdash-status-indicator ${hasCurrentPlan ? 'sdash-status-active' : 'sdash-status-inactive'}`}>
            {hasCurrentPlan ? (
                <>
                    <Activity className="sdash-icon-xs" /> Faol
                </>
            ) : (
                <>
                    <AlertCircle className="sdash-icon_xs" /> Plan yo'q
                </>
            )}
        </span>
    );

    // Format number with thousands separator
    const formatNumber = (value) => {
        if (!value) return '';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // Parse number by removing thousands separator
    const parseNumber = (value) => {
        return value.replace(/\./g, '');
    };

    // Calculate statistics
    const calculateStatistics = () => {
        const currentMonthPlans = allPlans?.filter((plan) => plan.month === selectedMonth) || [];
        const activePlansCount = filteredEmployees.filter((emp) => emp.currentPlan).length;
        const totalAchieved = currentMonthPlans.reduce((sum, plan) => sum + (plan.achievedAmount || 0), 0);

        return {
            activePlansCount,
            currentMonthPlansCount: currentMonthPlans.length,
            totalAchieved
        };
    };

    const statistics = calculateStatistics();

    // Debug logging
    useEffect(() => {
        console.log('Filtered Employees:', filteredEmployees);
        console.log('All Plans:', allPlans);
        console.log('Selected Month:', selectedMonth);
        console.log('Statistics:', statistics);
    }, [filteredEmployees, allPlans, selectedMonth]);

    if (employeesLoading || plansLoading) {
        return (
            <div className="sdash-loading-wrapper">
                <RefreshCw className="sdash-loading-icon animate-spin" />
                <p>Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    if (employeesError || plansError) {
        notifyError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
        return (
            <div className="sdash-error-wrapper">
                <AlertCircle className="sdash-error-icon" />
                <p>Ma'lumotlarni yuklashda xatolik yuz berdi</p>
                <button onClick={() => window.location.reload()} className="sdash-retry-button">
                    Qayta urinish
                </button>
            </div>
        );
    }

    return (
        <div className="sdash-main-container">
            <ToastContainer />
            {/* Header */}
            <div className="sdash-header-section">
                <div className="sdash-header-content">
                    <div className="sdash-header-left">
                        <h1 className="sdash-main-title">
                            <Users className="sdash-icon-lg" />
                            Sotuvchilar Boshqaruv Paneli
                        </h1>
                        <div className="sdash-filter-controls">
                            <Filter className="sdash-filter-icon" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="sdash-filter-dropdown"
                                aria-label="Holatni tanlash"
                            >
                                <option value="all">Barcha holatlar</option>
                                <option value="active">Faol planlar</option>
                                <option value="inactive">Plan yo'q</option>
                            </select>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="sdash-filter-dropdown"
                                aria-label="Oyni tanlash"
                            >
                                {generateMonthOptions().map((month) => (
                                    <option key={month.value} value={month.value}>
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Sotuvchini qidiring..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="sdash-search-input"
                            />
                        </div>
                    </div>
                    <div className="sdash-statistics-grid">
                        <div className="sdash-stat-card">
                            <div className="sdash-stat-number">{statistics.activePlansCount}</div>
                            <div className="sdash-stat-text">Faol planlar</div>
                        </div>
                        <div className="sdash-stat-card">
                            <div className="sdash-stat-number">{statistics.currentMonthPlansCount}</div>
                            <div className="sdash-stat-text">Joriy oy planlari</div>
                        </div>
                        <div className="sdash-stat-card">
                            <div className="sdash-stat-number">
                                {statistics.totalAchieved.toLocaleString()}
                            </div>
                            <div className="sdash-stat-text">Jami bajarilgan (so'm)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="sdash-table-wrapper">
                <table className="sdash-data-table">
                    <thead className="sdash-table-head">
                        <tr>
                            <th className="sdash-header-cell">Sotuvchi</th>
                            <th className="sdash-header-cell">Ish turi</th>
                            <th className="sdash-header-cell">Holat</th>
                            <th className="sdash-header-cell">Plan bajarish</th>
                            <th className="sdash-header-cell">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="sdash-table-body">
                        {filteredEmployees && filteredEmployees.length > 0 ? (
                            filteredEmployees.map((employee, index) => {
                                return (
                                    <tr key={employee._id || index} className="sdash-data-row">
                                        <td className="sdash-data-cell">
                                            <div className="sdash-employee-wrapper">
                                                <div className="sdash-employee-avatar">
                                                    <User className="sdash-avatar-icon" />
                                                </div>
                                                <div className="sdash-employee-info">
                                                    <div className="sdash-employee-name">
                                                        {employee.firstName} {employee.lastName}
                                                    </div>
                                                    <div className="sdash-employee-contact">
                                                        <Phone className="sdash-icon-xs" />
                                                        {PhoneNumberFormat ? PhoneNumberFormat(employee.phone) : employee.phone || 'N/A'}
                                                    </div>
                                                    <div className="sdash-employee-contact">
                                                        <MapPin className="sdash-icon-xs" />
                                                        {employee.role || 'Sotuvchi'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="sdash-data-cell">
                                            {capitalizeFirstLetter ? capitalizeFirstLetter(employee.unit || 'sotuvchi') : (employee.unit || 'Sotuvchi')}
                                        </td>
                                        <td className="sdash-data-cell">
                                            <StatusBadge hasCurrentPlan={!!employee.currentPlan} />
                                        </td>
                                        <PerformanceCell
                                            actual={employee.currentPlan?.achievedAmount || 0}
                                            plan={employee.currentPlan?.targetAmount || 0}
                                            unit="M"
                                        />
                                        <td className="sdash-data-cell">
                                            <div className="sdash-action-group">
                                                {employee.currentPlan && role !== "sotuvchi" ? (
                                                    <>
                                                        <button
                                                            onClick={() => openEditPlanModal(employee.currentPlan)}
                                                            className="sdash-action-btn sdash-edit-btn"
                                                            title="Planni tahrirlash"
                                                            aria-label="Planni tahrirlash"
                                                        >
                                                            <Edit className="sdash-icon-xs" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePlan(employee.currentPlan._id)}
                                                            className="sdash-action-btn sdash-delete-btn"
                                                            title="Planni o'chirish"
                                                            aria-label="Planni o'chirish"
                                                        >
                                                            <Trash2 className="sdash-icon-xs" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {role !== "sotuvchi" &&
                                                            <button
                                                                onClick={() => openCreatePlanModal(employee._id)}
                                                                className="sdash-action-btn sdash-create-btn"
                                                                title="Plan qo'shish"
                                                                aria-label="Plan qo'shish"
                                                            >
                                                                <Plus className="sdash-icon-xs" />
                                                            </button>
                                                        }
                                                    </>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        setSelectedEmployee(employee);
                                                        setShowPlanModal(false);
                                                    }}
                                                    className="sdash-action-btn sdash-view-btn"
                                                    title="Faoliyatni ko'rish"
                                                    aria-label="Faoliyatni ko'rish"
                                                >
                                                    <Eye className="sdash-icon-xs" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="sdash-data-cell text-center">
                                    <div style={{ padding: '2rem', color: '#666' }}>
                                        Ma'lumotlar topilmadi
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Plan Modal */}
            {showPlanModal && (
                <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <Target className="sdash-icon-md" />
                                {editingPlan ? 'Planni tahrirlash' : 'Yangi plan qo\'shish'}
                            </h3>
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowPlanModal(false)}
                                aria-label="Modalni yopish"
                            >
                                <X className="sdash-icon-sm" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}>
                                <div className="form-group">
                                    <label className="form-label">Sotuvchi:</label>
                                    <select
                                        value={planForm?.employeeId}
                                        onChange={(e) => setPlanForm({ ...planForm, employeeId: e.target.value })}
                                        className="form-select"
                                        disabled={editingPlan}
                                        aria-label="Sotuvchini tanlash"
                                    >
                                        <option value="">Sotuvchini tanlang</option>
                                        {salesEmployees?.map((employee) => (
                                            <option key={employee._id} value={employee._id}>
                                                {employee.firstName} {employee.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Oy:</label>
                                    <select
                                        value={planForm.month}
                                        onChange={(e) => setPlanForm({ ...planForm, month: e.target.value })}
                                        className="form-select"
                                        aria-label="Oyni tanlash"
                                    >
                                        {generateMonthOptions().map((month) => (
                                            <option key={month.value} value={month.value}>
                                                {month.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Maqsad summasi:</label>
                                    <input
                                        type="text"
                                        value={formatNumber(planForm.targetAmount)}
                                        onChange={(e) => {
                                            const rawValue = parseNumber(e.target.value);
                                            if (!isNaN(rawValue)) {
                                                setPlanForm({ ...planForm, targetAmount: rawValue });
                                            }
                                        }}
                                        className="form-input"
                                        placeholder="Summani kiriting"
                                        inputMode="numeric"
                                        aria-label="Maqsad summasi"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="sdash-primary-button">
                                        {editingPlan ? 'Yangilash' : 'Saqlash'}
                                    </button>
                                    <button
                                        type="button"
                                        className="sdash-secondary-btn"
                                        onClick={() => {
                                            setShowPlanModal(false);
                                            notifyInfo('Plan qo\'shish bekor qilindi');
                                        }}
                                        aria-label="Bekor qilish"
                                    >
                                        Bekor qilish
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {selectedEmployee && (
                <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
                    <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <Activity className="sdash-icon-md" />
                                {selectedEmployee.firstName} {selectedEmployee.lastName} - Faoliyat tarixi
                            </h3>
                            <button
                                className="modal-close-btn"
                                onClick={() => {
                                    setSelectedEmployee(null);
                                    notifyInfo('Faoliyat tarixi yopildi');
                                }}
                                aria-label="Modalni yopish"
                            >
                                <X className="sdash-icon-sm" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="activity-summary">
                                <div className="summary-cards">
                                    <div className="summary-card">
                                        <div className="summary-value">{selectedEmployee.allPlans?.length || 0}</div>
                                        <div className="summary-label">Jami planlar</div>
                                    </div>
                                    <div className="summary-card">
                                        <div className="summary-value">{selectedEmployee.currentPlan?.achievedAmount?.toLocaleString() || 0}</div>
                                        <div className="summary-label">Joriy oy bajarilgan</div>
                                    </div>
                                    <div className="summary-card">
                                        <div className="summary-value">
                                            {selectedEmployee.currentPlan && selectedEmployee.currentPlan.targetAmount > 0
                                                ? Math.round((selectedEmployee.currentPlan.achievedAmount / selectedEmployee.currentPlan.targetAmount) * 100)
                                                : 0}
                                            %
                                        </div>
                                        <div className="summary-label">Bajarish foizi</div>
                                    </div>
                                </div>
                            </div>
                            <div className="plans-history">
                                <h4>Planlar tarixi:</h4>
                                <div className="plans-list">
                                    {selectedEmployee.allPlans && selectedEmployee.allPlans.length > 0 ? (
                                        selectedEmployee.allPlans.map((plan) => (
                                            <div key={plan._id} className="plan-card">
                                                <div className="plan-header">
                                                    <div className="plan-month">{plan.month}</div>
                                                    <div className={`plan-status ${(plan.achievedAmount || 0) >= plan.targetAmount ? 'completed' : 'pending'}`}>
                                                        {(plan.achievedAmount || 0) >= plan.targetAmount ? 'Bajarilgan' : 'Jarayonda'}
                                                    </div>
                                                </div>
                                                <div className="plan-details">
                                                    <div className="plan-amounts">
                                                        <span>Plan: {plan.targetAmount.toLocaleString()} so'm</span>
                                                        <span>Bajarilgan: {(plan.achievedAmount || 0).toLocaleString()} so'm</span>
                                                    </div>
                                                    <div className="plan-progress">
                                                        <div className="progress-bar">
                                                            <div
                                                                className="progress-fill"
                                                                style={{
                                                                    width: `${Math.min(((plan.achievedAmount || 0) / plan.targetAmount) * 100, 100)}%`
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="progress-text">
                                                            {Math.round(((plan.achievedAmount || 0) / plan.targetAmount) * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                            Hozircha planlar mavjud emas
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalespersonDashboard;









// import React, { useState, useEffect } from 'react';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { User, AlertCircle, Phone, MapPin, Users, Activity, Filter, RefreshCw, Eye, X, Plus, Edit, Trash2, Target } from 'lucide-react';
// import {
//     useGetSalesEmployeesQuery,
//     useGetAllPlansQuery,
//     useCreatePlanMutation,
//     useUpdatePlanMutation,
//     useDeletePlanMutation,
// } from '../../../../context/planSalesApi';
// import { PhoneNumberFormat } from '../../../../hook/NumberFormat';
// import { capitalizeFirstLetter } from '../../../../hook/CapitalizeFirstLitter';
// import './style.css';

// // Notifikatsiya funksiyalari
// const notifySuccess = (message) => toast.success(message, { position: "top-right", autoClose: 3000 });
// const notifyError = (message) => toast.error(message, { position: "top-right", autoClose: 3000 });
// const notifyInfo = (message) => toast.info(message, { position: "top-right", autoClose: 3000 });

// // Optimized PerformanceCell component
// const PerformanceCell = React.memo(({ actual, plan, unit = '', className = '' }) => {
//     const percentage = plan > 0 ? Math.round((actual / plan) * 100) : 0;
//     const performanceClass = getPerformanceClass(percentage);

//     const formatNumber = (num) => {
//         if (unit === 'M') return `${(num / 1000000).toFixed(1)}M`;
//         if (unit === 'K') return `${(num / 1000).toFixed(1)}K`;
//         return num.toLocaleString();
//     };

//     return (
//         <td className={`sdash-data-cell ${className}`}>
//             <div className="sdash-performance-wrapper">
//                 <div className="sdash-performance-numbers">
//                     <span className="sdash-actual-amount">{formatNumber(actual)}</span>
//                     <span className="sdash-target-amount"> / {formatNumber(plan)}</span>
//                 </div>
//                 <div className={`sdash-performance-bar ${performanceClass}`}>
//                     <div className="sdash-progress-fill" style={{ width: `${Math.min(percentage, 100)}%` }} />
//                 </div>
//                 <div className={`sdash-percentage-text ${performanceClass}`}>{percentage}%</div>
//             </div>
//         </td>
//     );
// });

// // Performance class helper function
// const getPerformanceClass = (percentage) => {
//     if (percentage >= 100) return 'sdash-performance-excellent';
//     if (percentage >= 80) return 'sdash-performance-good';
//     if (percentage >= 60) return 'sdash-performance-average';
//     return 'sdash-performance-poor';
// };

// const SalespersonDashboard = () => {
//     const [filterStatus, setFilterStatus] = useState('all');
//     const [searchTerm, setSearchTerm] = useState('');
//     const [selectedMonth, setSelectedMonth] = useState(() => {
//         const date = new Date();
//         return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
//     });
//     const [showPlanModal, setShowPlanModal] = useState(false);
//     const [selectedEmployee, setSelectedEmployee] = useState(null);
//     const [editingPlan, setEditingPlan] = useState(null);
//     const [planForm, setPlanForm] = useState({
//         employeeId: '',
//         targetAmount: '',
//         month: selectedMonth,
//     });
//     const role = localStorage.getItem("role");
//     const workersId = localStorage.getItem("workerId");

//     // API hooks
//     const {
//         data: employeesData = { innerData: [] },
//         isLoading: employeesLoading,
//         error: employeesError,
//     } = useGetSalesEmployeesQuery();
//     const {
//         data: plansData = { innerData: [] },
//         isLoading: plansLoading,
//         error: plansError,
//         refetch: refetchPlans,
//     } = useGetAllPlansQuery();
//     const [createPlan] = useCreatePlanMutation();
//     const [updatePlan] = useUpdatePlanMutation();
//     const [deletePlan] = useDeletePlanMutation();

//     // Safely filter employees based on role
//     const salesEmployees = employeesData?.innerData?.length
//         ? role === "sotuvchi"
//             ? employeesData?.innerData.filter((employee) => employee?._id === workersId) ?? []
//             : employeesData?.innerData
//         : [];

//     // Safely filter plans based on role
//     const allPlans = plansData?.innerData?.length
//         ? role === "sotuvchi"
//             ? plansData?.innerData.filter((plan) => plan?.employeeId?._id === workersId) ?? []
//             : plansData?.innerData
//         : [];

//     // Generate month options for the last 12 months and next 3 months
//     const generateMonthOptions = () => {
//         const months = [];
//         const currentDate = new Date();

//         for (let i = 11; i >= 0; i--) {
//             const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
//             const monthStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
//             months.push({
//                 value: monthStr,
//                 label: date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' }),
//             });
//         }

//         for (let i = 1; i <= 3; i++) {
//             const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
//             const monthStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
//             months.push({
//                 value: monthStr,
//                 label: date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' }),
//             });
//         }

//         return months;
//     };

//     // Combine employee and plan data
//     const combineEmployeeData = () => {
//         if (!salesEmployees || !allPlans) return [];

//         return salesEmployees?.map((employee) => {
//             const employeePlans = allPlans?.filter((plan) => {
//                 const employeeId = plan.employeeId?._id || plan.employeeId;
//                 return employeeId === employee._id;
//             });

//             const currentPlan = employeePlans?.find((plan) => plan.month === selectedMonth);
//             const previousMonthPlan = employeePlans?.find((plan) => {
//                 const prevMonth = getPreviousMonth(selectedMonth);
//                 return plan.month === prevMonth;
//             });

//             return {
//                 ...employee,
//                 currentPlan: currentPlan || null,
//                 previousPlan: previousMonthPlan || null,
//                 allPlans: employeePlans,
//             };
//         });
//     };

//     // Get previous month string
//     const getPreviousMonth = (monthStr) => {
//         const [year, month] = monthStr.split('.');
//         const date = new Date(parseInt(year), parseInt(month) - 1, 1);
//         date.setMonth(date.getMonth() - 1);
//         return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
//     };

//     // Filter employees
//     const filteredEmployees = combineEmployeeData()?.filter((employee) => {
//         const matchesSearch =
//             employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             employee.lastName.toLowerCase().includes(searchTerm.toLowerCase());

//         const matchesStatus =
//             filterStatus === 'all' ||
//             (filterStatus === 'active' && employee.currentPlan) ||
//             (filterStatus === 'inactive' && !employee.currentPlan);

//         return matchesSearch && matchesStatus;
//     });


//     // Handle plan creation
//     const handleCreatePlan = async (e) => {
//         e.preventDefault();
//         if (!planForm.employeeId || !planForm.targetAmount || isNaN(planForm.targetAmount) || planForm.targetAmount <= 0) {
//             notifyError('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring');
//             return;
//         }

//         try {
//             await createPlan({
//                 ...planForm,
//                 targetAmount: parseFloat(planForm.targetAmount),
//             }).unwrap();
//             setShowPlanModal(false);
//             setPlanForm({ employeeId: '', targetAmount: '', month: selectedMonth });
//             notifySuccess('Plan muvaffaqiyatli yaratildi!');
//             refetchPlans();
//         } catch (error) {
//             console.error('Plan yaratishda xatolik:', error);
//             notifyError('Plan yaratishda xatolik yuz berdi');
//         }
//     };

//     // Handle plan update
//     const handleUpdatePlan = async (e) => {
//         e.preventDefault();
//         if (!planForm.employeeId || !planForm.targetAmount || isNaN(planForm.targetAmount) || planForm.targetAmount <= 0) {
//             notifyError('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring');
//             return;
//         }

//         try {
//             await updatePlan({
//                 id: editingPlan._id,
//                 ...planForm,
//                 targetAmount: parseFloat(planForm.targetAmount),
//             }).unwrap();
//             setShowPlanModal(false);
//             setEditingPlan(null);
//             setPlanForm({ employeeId: '', targetAmount: '', month: selectedMonth });

//             notifySuccess('Plan muvaffaqiyatli yangilandi!');
//             refetchPlans();
//         } catch (error) {
//             console.error('Plan yangilashda xatolik:', error);
//             notifyError('Plan yangilashda xatolik yuz berdi');
//         }
//     };

//     // Handle plan deletion
//     const handleDeletePlan = async (planId) => {
//         try {
//             const res = await deletePlan(planId).unwrap();
//             notifySuccess('Plan muvaffaqiyatli o\'chirildi!');
//             refetchPlans();
//         } catch (error) {
//             console.error('Plan o\'chirishda xatolik:', error);
//             notifyError('Plan o\'chirishda xatolik yuz berdi');
//         }

//     };

//     // Open plan modal for editing
//     const openEditPlanModal = (plan) => {
//         setEditingPlan(plan);
//         setPlanForm({
//             employeeId: plan.employeeId?._id || plan.employeeId,
//             targetAmount: plan.targetAmount.toString(),
//             month: plan.month,
//         });
//         setShowPlanModal(true);
//     };

//     // Open plan modal for creating
//     const openCreatePlanModal = (employeeId = '') => {
//         setEditingPlan(null);
//         setPlanForm({
//             employeeId,
//             targetAmount: '',
//             month: selectedMonth,
//         });
//         setShowPlanModal(true);
//     };

//     // Calculate performance metrics
//     // const calculatePerformance = (current, previous) => {
//     //     if (!current) return { percentage: 0, trend: 0 };

//     //     const percentage = current.targetAmount > 0 ? Math.round((current.achievedAmount / current.targetAmount) * 100) : 0;
//     //     const trend = previous && previous.achievedAmount > 0 ? Math.round(((current.achievedAmount - previous.achievedAmount) / previous.achievedAmount) * 100) : 0;

//     //     return { percentage, trend };
//     // };

//     // Status badge component
//     const StatusBadge = ({ hasCurrentPlan }) => (
//         <span className={`sdash-status-indicator ${hasCurrentPlan ? 'sdash-status-active' : 'sdash-status-inactive'}`}>
//             {hasCurrentPlan ? (
//                 <>
//                     <Activity className="sdash-icon-xs" /> Faol
//                 </>
//             ) : (
//                 <>
//                     <AlertCircle className="sdash-icon_xs" /> Plan yo'q
//                 </>
//             )}
//         </span>
//     );


//     // Format number with thousands separator
//     const formatNumber = (value) => {
//         if (!value) return '';
//         return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
//     };

//     // Parse number by removing thousands separator
//     const parseNumber = (value) => {
//         return value.replace(/\./g, '');
//     };

//     if (employeesLoading || plansLoading) {
//         return (
//             <div className="sdash-loading-wrapper">
//                 <RefreshCw className="sdash-loading-icon animate-spin" />
//                 <p>Ma'lumotlar yuklanmoqda...</p>
//             </div>
//         );
//     }

//     if (employeesError || plansError) {
//         notifyError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
//         return (
//             <div className="sdash-error-wrapper">
//                 <AlertCircle className="sdash-error-icon" />
//                 <p>Ma'lumotlarni yuklashda xatolik yuz berdi</p>
//                 <button onClick={() => window.location.reload()} className="sdash-retry-button">
//                     Qayta urinish
//                 </button>
//             </div>
//         );
//     }

//     console.log(filteredEmployees);


//     return (
//         <div className="sdash-main-container">
//             <ToastContainer />
//             {/* Header */}
//             <div className="sdash-header-section">
//                 <div className="sdash-header-content">
//                     <div className="sdash-header-left">
//                         <h1 className="sdash-main-title">
//                             <Users className="sdash-icon-lg" />
//                             Sotuvchilar Boshqaruv Paneli
//                         </h1>
//                         <div className="sdash-filter-controls">
//                             <Filter className="sdash-filter-icon" />
//                             <select
//                                 value={filterStatus}
//                                 onChange={(e) => setFilterStatus(e.target.value)}
//                                 className="sdash-filter-dropdown"
//                                 aria-label="Holatni tanlash"
//                             >
//                                 <option value="all">Barcha holatlar</option>
//                                 <option value="active">Faol planlar</option>
//                                 <option value="inactive">Plan yo'q</option>
//                             </select>
//                             <select
//                                 value={selectedMonth}
//                                 onChange={(e) => setSelectedMonth(e.target.value)}
//                                 className="sdash-filter-dropdown"
//                                 aria-label="Oyni tanlash"
//                             >
//                                 {generateMonthOptions().map((month) => (
//                                     <option key={month.value} value={month.value}>
//                                         {month.label}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>
//                     </div>
//                     <div className="sdash-statistics-grid">
//                         <div className="sdash-stat-card">
//                             <div className="sdash-stat-number">{filteredEmployees.filter((emp) => emp.currentPlan).length}</div>
//                             <div className="sdash-stat-text">Faol planlar</div>
//                         </div>
//                         <div className="sdash-stat-card">
//                             <div className="sdash-stat-number">{allPlans?.filter((plan) => plan.month === selectedMonth).length}</div>
//                             <div className="sdash-stat-text">Joriy oy planlari</div>
//                         </div>
//                         <div className="sdash-stat-card">
//                             <div className="sdash-stat-number">
//                                 {allPlans?.filter((plan) => plan.month === selectedMonth)
//                                     .reduce((sum, plan) => sum + (plan.achievedAmount || 0), 0)
//                                     .toLocaleString()}
//                             </div>
//                             <div className="sdash-stat-text">Jami bajarilgan (so'm)</div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Main Table */}
//             <div className="sdash-table-wrapper">
//                 <table className="sdash-data-table">
//                     <thead className="sdash-table-head">
//                         <tr>
//                             <th className="sdash-header-cell">Sotuvchi</th>
//                             <th className="sdash-header-cell">Ish turi</th>
//                             <th className="sdash-header-cell">Holat</th>
//                             <th className="sdash-header-cell">Plan bajarish</th>
//                             <th className="sdash-header-cell">Amallar</th>
//                         </tr>
//                     </thead>
//                     <tbody className="sdash-table-body">
//                         {filteredEmployees?.map((employee, inx) => {
//                             // const { percentage, trend } = calculatePerformance(employee.currentPlan, employee.previousPlan);

//                             return (
//                                 <tr key={inx} className="sdash-data-row">
//                                     <td className="sdash-data-cell">
//                                         <div className="sdash-employee-wrapper">
//                                             <div className="sdash-employee-avatar">
//                                                 <User className="sdash-avatar-icon" />
//                                             </div>
//                                             <div className="sdash-employee-info">
//                                                 <div className="sdash-employee-name">
//                                                     {employee.firstName} {employee.lastName}
//                                                 </div>
//                                                 <div className="sdash-employee-contact">
//                                                     <Phone className="sdash-icon-xs" />
//                                                     {PhoneNumberFormat(employee.phone) || 'N/A'}
//                                                 </div>
//                                                 <div className="sdash-employee-contact">
//                                                     <MapPin className="sdash-icon-xs" />
//                                                     {"Sotuvchi" || 'N/A'}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </td>
//                                     <td className="sdash-data-cell">
//                                         {capitalizeFirstLetter(employee.unit)}
//                                     </td>
//                                     <td className="sdash-data-cell">
//                                         <StatusBadge hasCurrentPlan={!!employee.currentPlan} />
//                                     </td>
//                                     <PerformanceCell
//                                         actual={employee.currentPlan?.achievedAmount || 0}
//                                         plan={employee.currentPlan?.targetAmount || 0}
//                                         unit="M"
//                                     />
//                                     <td className="sdash-data-cell">
//                                         <div className="sdash-action-group">
//                                             {employee.currentPlan && role !== "sotuvchi" ? (
//                                                 <>
//                                                     <button
//                                                         onClick={() => openEditPlanModal(employee.currentPlan)}
//                                                         className="sdash-action-btn sdash-edit-btn"
//                                                         title="Planni tahrirlash"
//                                                         aria-label="Planni tahrirlash"
//                                                     >
//                                                         <Edit className="sdash-icon-xs" />
//                                                     </button>
//                                                     <button
//                                                         onClick={() => handleDeletePlan(employee.currentPlan._id)}
//                                                         className="sdash-action-btn sdash-delete-btn"
//                                                         title="Planni o'chirish"
//                                                         aria-label="Planni o'chirish"
//                                                     >
//                                                         <Trash2 className="sdash-icon-xs" />
//                                                     </button>
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     {role !== "sotuvchi" &&
//                                                         <button button
//                                                             onClick={() => openCreatePlanModal(employee._id)}
//                                                             className="sdash-action-btn sdash-create-btn"
//                                                             title="Plan qo'shish"
//                                                             aria-label="Plan qo'shish"
//                                                         >
//                                                             <Plus className="sdash-icon-xs" />
//                                                         </button>
//                                                     }
//                                                 </>
//                                             )}

//                                             <button
//                                                 onClick={() => {
//                                                     setSelectedEmployee(employee);
//                                                     setShowPlanModal(false);
//                                                 }}
//                                                 className="sdash-action-btn sdash-view-btn"
//                                                 title="Faoliyatni ko'rish"
//                                                 aria-label="Faoliyatni ko'rish"
//                                             >
//                                                 <Eye className="sdash-icon-xs" />
//                                             </button>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             );
//                         })}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Plan Modal */}
//             {
//                 showPlanModal && (
//                     <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
//                         <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                             <div className="modal-header">
//                                 <h3 className="modal-title">
//                                     <Target className="sdash-icon-md" />
//                                     {editingPlan ? 'Planni tahrirlash' : 'Yangi plan qo\'shish'}
//                                 </h3>
//                                 <button
//                                     className="modal-close-btn"
//                                     onClick={() => setShowPlanModal(false)}
//                                     aria-label="Modalni yopish"
//                                 >
//                                     <X className="sdash-icon-sm" />
//                                 </button>
//                             </div>
//                             <div className="modal-body">
//                                 <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}>
//                                     <div className="form-group">
//                                         <label className="form-label">Sotuvchi:</label>
//                                         <select
//                                             value={planForm?.employeeId}
//                                             onChange={(e) => setPlanForm({ ...planForm, employeeId: e.target.value })}
//                                             className="form-select"
//                                             disabled={editingPlan}
//                                             aria-label="Sotuvchini tanlash"
//                                         >
//                                             <option value="">Sotuvchini tanlang</option>
//                                             {salesEmployees?.map((employee) => (
//                                                 <option key={employee._id} value={employee._id}>
//                                                     {employee.firstName} {employee.lastName}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     </div>
//                                     <div className="form-group">
//                                         <label className="form-label">Oy:</label>
//                                         <select
//                                             value={planForm.month}
//                                             onChange={(e) => setPlanForm({ ...planForm, month: e.target.value })}
//                                             className="form-select"
//                                             aria-label="Oyni tanlash"
//                                         >
//                                             {generateMonthOptions().map((month) => (
//                                                 <option key={month.value} value={month.value}>
//                                                     {month.label}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     </div>
//                                     <input
//                                         type="text"
//                                         value={formatNumber(planForm.targetAmount)}
//                                         onChange={(e) => {
//                                             const rawValue = parseNumber(e.target.value);
//                                             if (!isNaN(rawValue)) {
//                                                 setPlanForm({ ...planForm, targetAmount: rawValue });
//                                             }
//                                         }}
//                                         className="form-input"
//                                         placeholder="Summani kiriting"
//                                         inputMode="numeric"
//                                         aria-label="Maqsad summasi"
//                                     />
//                                     <div className="form-actions">
//                                         <button type="submit" className="sdash-primary-button">
//                                             {editingPlan ? 'Yangilash' : 'Saqlash'}
//                                         </button>
//                                         <button
//                                             type="button"
//                                             className="sdash-secondary-btn"
//                                             onClick={() => {
//                                                 setShowPlanModal(false);
//                                                 notifyInfo('Plan qo\'shish bekor qilindi');
//                                             }}
//                                             aria-label="Bekor qilish"
//                                         >
//                                             Bekor qilish
//                                         </button>
//                                     </div>
//                                 </form>
//                             </div>
//                         </div>
//                     </div>
//                 )
//             }

//             {/* Activity Modal */}
//             {
//                 selectedEmployee && (
//                     <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
//                         <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
//                             <div className="modal-header">
//                                 <h3 className="modal-title">
//                                     <Activity className="sdash-icon-md" />
//                                     {selectedEmployee.firstName} {selectedEmployee.lastName} - Faoliyat tarixi
//                                 </h3>
//                                 <button
//                                     className="modal-close-btn"
//                                     onClick={() => {
//                                         setSelectedEmployee(null);
//                                         notifyInfo('Faoliyat tarixi yopildi');
//                                     }}
//                                     aria-label="Modalni yopish"
//                                 >
//                                     <X className="sdash-icon-sm" />
//                                 </button>
//                             </div>
//                             <div className="modal-body">
//                                 <div className="activity-summary">
//                                     <div className="summary-cards">
//                                         <div className="summary-card">
//                                             <div className="summary-value">{selectedEmployee.allPlans?.length || 0}</div>
//                                             <div className="summary-label">Jami planlar</div>
//                                         </div>
//                                         <div className="summary-card">
//                                             <div className="summary-value">{selectedEmployee.currentPlan?.achievedAmount?.toLocaleString() || 0}</div>
//                                             <div className="summary-label">Joriy oy bajarilgan</div>
//                                         </div>
//                                         <div className="summary-card">
//                                             <div className="summary-value">
//                                                 {selectedEmployee.currentPlan
//                                                     ? Math.round((selectedEmployee.currentPlan.achievedAmount / selectedEmployee.currentPlan.targetAmount) * 100)
//                                                     : 0}
//                                                 %
//                                             </div>
//                                             <div className="summary-label">Bajarish foizi</div>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className="plans-history">
//                                     <h4>Planlar tarixi:</h4>
//                                     <div className="plans-list">
//                                         {selectedEmployee.allPlans?.map((plan) => (
//                                             <div key={plan._id} className="plan-card">
//                                                 <div className="plan-header">
//                                                     <div className="plan-month">{plan.month}</div>
//                                                     <div className={`plan-status ${plan.achievedAmount >= plan.targetAmount ? 'completed' : 'pending'}`}>
//                                                         {plan.achievedAmount >= plan.targetAmount ? 'Bajarilgan' : 'Jarayonda'}
//                                                     </div>
//                                                 </div>
//                                                 <div className="plan-details">
//                                                     <div className="plan-amounts">
//                                                         <span>Plan: {plan.targetAmount.toLocaleString()} so'm</span>
//                                                         <span>Bajarilgan: {plan.achievedAmount.toLocaleString()} so'm</span>
//                                                     </div>
//                                                     <div className="plan-progress">
//                                                         <div className="progress-bar">
//                                                             <div
//                                                                 className="progress-fill"
//                                                                 style={{ width: `${Math.min((plan.achievedAmount / plan.targetAmount) * 100, 100)}%` }}
//                                                             />
//                                                         </div>
//                                                         <span className="progress-text">{Math.round((plan.achievedAmount / plan.targetAmount) * 100)}%</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )
//             }
//         </div >
//     );
// };

// export default SalespersonDashboard;










