import React, { useState } from 'react';
import {
    useGetFirmsQuery,
    useUpdateFirmMutation,
    useDeleteFirmMutation,
} from '../../../context/firmaApi';
import { Edit3, Trash2, Plus, Save, X } from 'lucide-react';
import './style.css';

const FirmManagement = () => {
    const { data: firms = [], isLoading, error, refetch } = useGetFirmsQuery();
    const [updateFirm] = useUpdateFirmMutation();
    const [deleteFirm] = useDeleteFirmMutation();

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [displayDebt, setDisplayDebt] = useState('');

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

    if (isLoading) return <div className="firm-loading">Yuklanmoqda...</div>;
    if (error) return <div className="firm-error">Xatolik yuz berdi</div>;

    return (
        <div className="firm-container">
            <div className="firm-table-container">
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
                                <td className="firm-td">
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
                                </td>
                                <td className="firm-td firm-td-mobile-hide">
                                    {editingId === firm._id ? (
                                        <input
                                            className="firm-input-small"
                                            value={editData.phone || ''}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        />
                                    ) : (
                                        firm.phone
                                    )}
                                </td>
                                <td className="firm-td firm-td-mobile-hide">
                                    {editingId === firm._id ? (
                                        <input
                                            className="firm-input-small"
                                            value={editData.address || ''}
                                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                        />
                                    ) : (
                                        firm.address
                                    )}
                                </td>
                                <td className="firm-td">
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
                                    )}
                                </td>
                                <td className="firm-td">
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

