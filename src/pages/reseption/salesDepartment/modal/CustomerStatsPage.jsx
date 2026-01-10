import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    useGetCustomerStatsQuery,
    useUpdateCustomerMutation,
} from "../../../../context/customerApi";
import "./css/CustomerStatsPage.css";
import MahsulotlarJadvali from "./customer/MahsulotlarJadvali";
import html2canvas from 'html2canvas';

const CustomerStatsPage = () => {
    const { id } = useParams();
    const { data, isLoading, isError, refetch } = useGetCustomerStatsQuery(id);
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const tableRef = useRef(null);

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

    const { customer } = data?.innerData;

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
            company: customer?.company || '',
            balans: customer?.balans || 0
        });
    };

    const handleDownloadPDF = async () => {
        if (!tableRef.current) return;

        try {
            const canvas = await html2canvas(tableRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const link = document.createElement('a');
            link.download = `${customer?.name || 'Mijoz'}_hisobot_${new Date().toLocaleDateString('uz-UZ')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('PDF yaratishda xatolik:', error);
            alert('Rasmni yuklab olishda xatolik yuz berdi!');
        }
    };

    return (
        <div className="cs-container">
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

            <div className="cs-header">
                <button className="cs-pdf-btn" onClick={handleDownloadPDF}>
                    📄
                </button>
                <button className="cs-edit-btn" onClick={startEdit}>
                    ✏️
                </button>
            </div>

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

                            <div className="cs-form-group">
                                <label className="cs-form-label">💵 Balans</label>
                                <input
                                    type="number"
                                    className="cs-form-input"
                                    value={formData.balans || 0}
                                    onChange={(e) => handleFormChange('balans', Number(e.target.value))}
                                    placeholder="Balansni kiriting"
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

            <MahsulotlarJadvali customer={customer} allData={data} tableRef={tableRef} />
        </div>
    );
};

export default CustomerStatsPage;