import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    useGetCustomerStatsQuery,
    useUpdateCustomerMutation,
} from "../../../../context/customerApi";
import { LeftOutlined } from "@ant-design/icons";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import "./css/CustomerStatsPage.css";

const CustomerStatsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, isError, refetch } = useGetCustomerStatsQuery(id);
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    // const data?.innerData = mewData?.innerData || [];
    console.log(data?.innerData);
    // Loading state
    if (isLoading) {
        return (
            <div className="cs-loading-wrapper">
                <div className="cs-loading-spinner">
                    <div className="cs-spinner"></div>
                    <p className="cs-loading-text">Ma'lumotlar yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (isError || !data?.innerData) {
        return (
            <div className="cs-error-wrapper">
                <div className="cs-error-container">
                    <div className="cs-error-icon">⚠️</div>
                    <h2 className="cs-error-title">Xatolik yuz berdi</h2>
                    <p className="cs-error-message">Ma'lumotlarni yuklashda muammo bo'ldi</p>
                    <button className="cs-retry-btn" onClick={() => window.location.reload()}>
                        Qayta urinish
                    </button>
                </div>
            </div>
        );
    }

    const { customer, stats, balans, expenses, totalPayments } = data?.innerData;

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateCustomer({ id, ...formData }).unwrap();
            setShowSuccessMessage(true);
            setEditing(false);
            refetch();
            setTimeout(() => setShowSuccessMessage(false), 3000);
        } catch (err) {
            setShowErrorMessage(true);
            setTimeout(() => setShowErrorMessage(false), 3000);
        }
    };

    const startEdit = () => {
        setEditing(true);
        setFormData({
            name: customer?.name || '',
            type: customer?.type || '',
            phone: customer?.phone || '',
            companyAddress: customer?.companyAddress || '',
            company: customer?.company || ''
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ').format(amount);
    };

    return (
        <div className="cs-container">
            {/* Success/Error Messages */}
            {showSuccessMessage && (
                <div className="cs-message cs-message-success">
                    <span className="cs-message-icon">✅</span>
                    Mijoz ma'lumotlari muvaffaqiyatli yangilandi!
                </div>
            )}

            {showErrorMessage && (
                <div className="cs-message cs-message-error">
                    <span className="cs-message-icon">❌</span>
                    Ma'lumotlarni yangilashda xatolik yuz berdi!
                </div>
            )}

            {/* Header Section */}
            <div className="cs-header">
                <div className="cs-header-content">
                    <h1 style={{ cursor: "pointer" }} onClick={() => navigate(-1)} className="cs-page-title">
                        Mijoz Statistikasi</h1>
                    <div className="cs-customer-info">
                        <div className="cs-avatar">
                            {customer?.name?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <div className="cs-customer-details">
                            <h2 className="cs-customer-name">{customer?.name || 'Noma\'lum mijoz'}</h2>
                            <span className="cs-customer-type">
                                {customer?.type === 'individual' ? 'Jismoniy shaxs' : 'Yuridik shaxs'}
                            </span>
                        </div>
                    </div>
                </div>
                <button className="cs-edit-btn" onClick={startEdit}>
                    <span className="cs-edit-icon">✏️</span>
                    Tahrirlash
                </button>
            </div>

            {/* Stats Cards */}
            <div className="cs-stats-grid">
                <div className="cs-stat-card cs-balance-card">
                    <div className="cs-stat-header">
                        <div className="cs-stat-icon cs-balance-icon">💰</div>
                        <h3 className="cs-stat-title">Joriy Balans</h3>
                    </div>
                    <div className={balans > 0 ? "cs-stat-value-Qarzdor" : "cs-stat-value-Haqdor"}>{formatCurrency(Math.abs(balans))} so'm</div>
                    <div className="cs-stat-trend">
                        {balans > 0 ? '📈 Qarzdor' : '📉 Haqdor'}
                    </div>
                </div>

                <div className="cs-stat-card cs-payments-card">
                    <div className="cs-stat-header">
                        <div className="cs-stat-icon cs-payments-icon">🏦</div>
                        <h3 className="cs-stat-title">Jami To'lovlar</h3>
                    </div>
                    <div className="cs-stat-value">{formatCurrency(totalPayments)} so'm</div>
                    <div className="cs-stat-description">Umumiy summa</div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="cs-chart-section">
                <div className="cs-chart-header">
                    <h3 className="cs-chart-title">📊 To'lovlar Grafigi</h3>
                    <div className="cs-chart-legend">
                        <span className="cs-legend-item">
                            <div className="cs-legend-color"></div>
                            To'lov miqdori
                        </span>
                    </div>
                </div>
                <div className="cs-chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                stroke="#8884d8"
                                fontSize={12}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('uz-UZ')}
                            />
                            <YAxis stroke="#8884d8" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value) => [`${formatCurrency(value)} so'm`, 'Summa']}
                                labelFormatter={(label) => `Sana: ${new Date(label).toLocaleDateString('uz-UZ')}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#667eea"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Payment History */}
            <div className="cs-history-section">
                <div className="cs-history-header">
                    <h3 className="cs-history-title">💳 To'lovlar Tarixi</h3>
                    <span className="cs-history-count">
                        {expenses?.length || 0} ta yozuv
                    </span>
                </div>

                {expenses?.length > 0 ? (
                    <div className="cs-history-list">
                        {expenses?.map((payment, index) => (
                            <div key={payment._id || index} className="cs-payment-item">
                                <div className="cs-payment-main">
                                    <div className="cs-payment-icon">💰</div>
                                    <div className="cs-payment-details">
                                        <div className="cs-payment-amount">
                                            {formatCurrency(payment.amount)} so'm
                                        </div>
                                        <div className="cs-payment-meta">
                                            <span className="cs-payment-type">
                                                {payment.paymentType?.toUpperCase() || 'NAQD'}
                                            </span>
                                            {/* <span className="cs-payment-by">
                                                {payment.paidBy || 'Noma\'lum'}
                                            </span> */}
                                        </div>
                                    </div>
                                </div>
                                <div className="cs-payment-date">
                                    {new Date(payment.date).toLocaleDateString("uz-UZ", {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="cs-empty-state">
                        <div className="cs-empty-icon">📝</div>
                        <p className="cs-empty-text">To'lovlar tarixi mavjud emas</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="cs-modal-overlay">
                    <div className="cs-modal">
                        <div className="cs-modal-header">
                            <h3 className="cs-modal-title">✏️ Mijoz Ma'lumotlarini Yangilash</h3>
                            <button className="cs-modal-close" onClick={() => setEditing(false)}>
                                ✕
                            </button>
                        </div>

                        <form className="cs-form" onSubmit={handleUpdate}>
                            <div className="cs-form-group">
                                <label className="cs-form-label">👤 Mijoz nomi</label>
                                <input
                                    type="text"
                                    className="cs-form-input"
                                    value={formData.name || ''}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    placeholder="Mijoz nomini kiriting"
                                    required
                                />
                            </div>

                            <div className="cs-form-group">
                                <label className="cs-form-label">🏢 Turi</label>
                                <select
                                    className="cs-form-select"
                                    value={formData.type || ''}
                                    onChange={(e) => handleFormChange('type', e.target.value)}
                                >
                                    <option value="individual">Jismoniy shaxs</option>
                                    <option value="company">Yuridik shaxs</option>
                                </select>
                            </div>

                            <div className="cs-form-group">
                                <label className="cs-form-label">📞 Telefon</label>
                                <input
                                    type="tel"
                                    className="cs-form-input"
                                    value={formData.phone || ''}
                                    onChange={(e) => handleFormChange('phone', e.target.value)}
                                    placeholder="+998 90 123 45 67"
                                />
                            </div>

                            <div className="cs-form-group">
                                <label className="cs-form-label">🏠 Kompaniya manzili</label>
                                <input
                                    type="text"
                                    className="cs-form-input"
                                    value={formData.companyAddress || ''}
                                    onChange={(e) => handleFormChange('companyAddress', e.target.value)}
                                    placeholder="Manzilni kiriting"
                                />
                            </div>

                            <div className="cs-form-group">
                                <label className="cs-form-label">🏢 Kompaniya nomi</label>
                                <input
                                    type="text"
                                    className="cs-form-input"
                                    value={formData.company || ''}
                                    onChange={(e) => handleFormChange('company', e.target.value)}
                                    placeholder="Kompaniya nomini kiriting"
                                />
                            </div>

                            <div className="cs-form-actions">
                                <button
                                    type="button"
                                    className="cs-btn cs-btn-secondary"
                                    onClick={() => setEditing(false)}
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    className="cs-btn cs-btn-primary"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <>
                                            <div className="cs-btn-spinner"></div>
                                            Saqlanmoqda...
                                        </>
                                    ) : (
                                        'Saqlash'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerStatsPage;