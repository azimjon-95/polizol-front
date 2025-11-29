import { useState } from 'react';
import {
    useGetFirmsQuery,
    useUpdateFirmMutation,
    useDeleteFirmMutation,
} from '../../../context/firmaApi';
import html2canvas from "html2canvas";
import { Edit3, Trash2, Save, X, Download } from 'lucide-react';
import { PhoneNumberFormat } from '../../../hook/NumberFormat';
import './style.css';


const FirmManagement = () => {
    const { data: firms = [], isLoading, error, refetch } = useGetFirmsQuery();
    const [updateFirm] = useUpdateFirmMutation();
    const [deleteFirm] = useDeleteFirmMutation();
    console.log(firms);

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [displayDebt, setDisplayDebt] = useState('');

    // Calculate totals for cards
    const totalFirms = firms?.innerData?.length || 0;
    const totalFirmDebt = firms?.innerData?.reduce((sum, firm) => sum + Math.max(firm.debt || 0, 0), 0) || 0;
    const totalCompanyDebt = firms?.innerData?.reduce((sum, firm) => sum + Math.abs(Math.min(firm.debt || 0, 0)), 0) || 0;

    const handleEdit = (firm) => {
        setEditingId(firm._id);
        setEditData(firm);
        setDisplayDebt(new Intl.NumberFormat('uz-UZ').format(firm.debt || 0));
    };

    const handleDebtChange = (e) => {
        const input = e.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
        const numericValue = input ? Number(input) : 0;
        setEditData({ ...editData, debt: numericValue });
        setDisplayDebt(input ? new Intl.NumberFormat('uz-UZ').format(numericValue) : '');
    };

    const handleSave = async () => {
        try {
            await updateFirm({
                id: editingId,
                ...editData
            }).unwrap();
            setEditingId(null);
            setEditData({});
            setDisplayDebt('');
            refetch();
        } catch (err) {
            console.error('Update failed:', err);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditData({});
        setDisplayDebt('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Firmani o\'chirishni xohlaysizmi?')) {
            try {
                await deleteFirm(id).unwrap();
                refetch();
            } catch (err) {
                console.error('Delete failed:', err);
            }
        }
    };


    const getDebtStatus = (debt) => {
        if (debt < 0) return 'firm-debt-negative';
        if (debt > 0) return 'firm-debt-positive';
        return 'firm-debt-zero';
    };

    const formatDebt = (debt) => {
        return new Intl.NumberFormat('uz-UZ').format(Math.abs(debt));
    };


    const handleExportPNG = async () => {
        // Olingan element — aynan firm-container hamma ko‘ringan qismi
        const element = document.querySelector(".firm-container");

        if (!element) return;

        // Yaxshi sifat uchun scale yuqori qilindi
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false
        });

        const pngFile = canvas.toDataURL("image/png");

        // Faylni yuklab berish
        const link = document.createElement("a");
        link.href = pngFile;
        link.download = `firmalar_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
    };
    if (isLoading) return <div className="firm-loading">Yuklanmoqda...</div>;
    if (error) return <div className="firm-error">Xatolik yuz berdi</div>;
    return (
        <div className="firm-container">

            {/* Stats Cards */}
            <div className="firm-stats">
                <div className="firm-stat-card">
                    <button></button>
                    <div className="">
                        <h1 className="firm-title">Firma Boshqaruvi</h1>
                        <button className="firm-export-btn" onClick={handleExportPNG}>
                            <Download size={16} />
                            PDF Yuklab Olish
                        </button>
                    </div>
                </div>
                <div className="firm-stat-card">
                    <div className="firm-stat-number">{totalFirms}</div>
                    <div className="firm-stat-label">Umumiy Firmalar</div>
                </div>
                <div className="firm-stat-card">
                    <div className="firm-stat-number">{formatDebt(totalFirmDebt)}</div>
                    <div className="firm-stat-label">Jami Firma Qarzi</div>
                </div>
                <div className="firm-stat-card">
                    <div className="firm-stat-number">{formatDebt(totalCompanyDebt)}</div>
                    <div className="firm-stat-label">Jami Kompaniya Qarzi</div>
                </div>
            </div>

            {/* Table */}
            <div className="firm-table-containers">
                <table className="firm-table">
                    <thead className="firm-table-head">
                        <tr>
                            <th className="firm-th">Firma nomi</th>
                            <th className="firm-th firm-th-mobile-hide">Telefon</th>
                            <th className="firm-th firm-th-mobile-hide">Manzil</th>
                            <th className="firm-th">Qarz holati</th>
                            <th className="firm-th">Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {firms?.innerData?.map((firm) => (
                            <tr key={firm._id} className="firm-row">
                                <td>
                                    <span className="firm-td">
                                        {editingId === firm._id ? (
                                            <input
                                                className="firm-input-small"
                                                value={editData.name || ''}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            />
                                        ) : (
                                            <div className="firm-name">{firm.name}</div>
                                        )}
                                        <div className="firm-mobile-info">
                                            <div className="firm-mobile-contact">{firm.contactPerson}</div>
                                            <div className="firm-mobile-phone">{firm.phone}</div>
                                        </div>
                                    </span>
                                </td>
                                <td>
                                    <span className="firm-td firm-td-mobile-hide">
                                        {editingId === firm._id ? (
                                            <input
                                                className="firm-input-small"
                                                value={editData.phone || ''}
                                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                            />
                                        ) : (
                                            <>
                                                +998 {PhoneNumberFormat(firm.phone)}
                                            </>
                                        )}
                                    </span>
                                </td>
                                <td>
                                    <span className="firm-td firm-td-mobile-hide">
                                        {editingId === firm._id ? (
                                            <input
                                                className="firm-input-small"
                                                value={editData.address || ''}
                                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            />
                                        ) : (
                                            firm.address
                                        )}
                                    </span>
                                </td>
                                <td>
                                    <span className="firm-td">
                                        {editingId === firm._id ? (
                                            <input
                                                className="firm-input-small"
                                                type="text"
                                                value={displayDebt}
                                                onChange={handleDebtChange}
                                                placeholder="0"
                                            />
                                        ) : (
                                            <div className={`firm-debt ${getDebtStatus(firm.debt)}`}>
                                                {firm.debt < 0 ? `Kompaniya qarzi: ${formatDebt(firm.debt)}` :
                                                    firm.debt > 0 ? `Firma qarzi: ${formatDebt(firm.debt)}` :
                                                        'Qarz yo\'q'}
                                            </div>
                                        )}</span>
                                </td>
                                <td >
                                    <div className="firm-actions">
                                        {editingId === firm._id ? (
                                            <>
                                                <button
                                                    className="firm-action-btn firm-save-action"
                                                    onClick={handleSave}
                                                >
                                                    <Save size={14} />
                                                </button>
                                                <button
                                                    className="firm-action-btn firm-cancel-action"
                                                    onClick={handleCancel}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="firm-action-btn firm-edit-action"
                                                    onClick={() => handleEdit(firm)}
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    className="firm-action-btn firm-delete-action"
                                                    onClick={() => handleDelete(firm._id)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FirmManagement;