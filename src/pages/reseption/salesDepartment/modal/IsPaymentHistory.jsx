import React from 'react';
import './checklist.css';
import { Modal } from 'antd';
import {
    NumberFormat
} from '../../../../hook/NumberFormat';

const PaymentChecklist = ({
    modalState,
    closeModal,
}) => {

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        return (NumberFormat(Math.abs(amount))) + ' ming so\'m';
    };

    const getPaymentMethodText = (method) => {
        switch (method) {
            case 'naqt': return 'Naqd pul';
            case 'karta': return 'Bank kartasi';
            case 'terminal': return 'Terminal';
            default: return method;
        }
    };

    const getTypeIcon = (type) => {
        return type === 'kirim' ? '💰' : '💸';
    };;

    return (
        <div className="paymentChecklist">
            <Modal
                open={modalState.isHistoryModalOpen}
                onCancel={closeModal}
                title="To'lov amalga oshirish"
                footer={null}
                width={700}
            >
                <div className="chi-payment-container">
                    <div className="chi-checklist">
                        <div className="chi-checklist-header">
                            ✓ To'lovlar Tarixi / Payment History
                        </div>

                        {modalState?.activeHistory.map((item, index) => (
                            <div key={index} className="chi-receipt-item">
                                <div className="chi-checkmark">✓</div>

                                <div className="chi-receipt-header">
                                    <div className="chi-receipt-id">
                                        ID: {typeof item._id === 'string' ? item._id.slice(-8) : item._id.toString().slice(-8)}
                                    </div>
                                    <div className={`chi-status-badge ${item.type === 'kirim' ? 'chi-status-kirim' : 'chi-status-chiqim'}`}>
                                        {item.type === 'kirim' ? 'KIRIM' : 'CHIQIM'}
                                    </div>
                                </div>

                                <div className="chi-customer-info">
                                    <div className="chi-customer-name">
                                        {getTypeIcon(item.type)} {item.category}
                                    </div>
                                    <div className="chi-customer-phone">
                                        📝 {item.description}
                                    </div>
                                    <div className="chi-customer-balance">
                                        💳 To'lov usuli: {getPaymentMethodText(item.paymentMethod)}
                                    </div>
                                </div>

                                <div className="chi-transaction-details">
                                    <div className="chi-detail-item">
                                        <div className="chi-detail-label">Sana / Date</div>
                                        <div className="chi-detail-value">{formatDate(item.date)}</div>
                                    </div>

                                    <div className="chi-detail-item">
                                        <div className="chi-detail-label">Vaqt / Time</div>
                                        <div className="chi-detail-value">{formatTime(item.date)}</div>
                                    </div>

                                    <div className="chi-detail-item">
                                        <div className="chi-detail-label">Bog'langan ID</div>
                                        <div className="chi-detail-value">{item.relatedId.slice(-8)}</div>
                                    </div>

                                    <div className="chi-detail-item">
                                        <div className="chi-detail-label">Turi / Type</div>
                                        <div className="chi-detail-value">
                                            {item.type === 'kirim' ? 'Daromad' : 'Xarajat'}
                                        </div>
                                    </div>
                                </div>

                                <div className="chi-payment-summary">
                                    <div className="chi-total-amount">
                                        <span>Miqdor:</span>
                                        <span style={{ color: item.type === 'kirim' ? '#28a745' : '#dc3545' }}>
                                            {formatAmount(item.amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PaymentChecklist;