import React, { useState, useCallback } from 'react';
import { Select, Button } from 'antd';
import { toast } from 'react-toastify';
import { usePayDebtMutation } from '../../../../context/cartSaleApi';

const { Option } = Select;
const IsPaymentModal = ({
    modalState,
    closeModal,
    currentSale,
    paymentType,
    setPaymentType,
    paymentAmount,
    setPaymentAmount,
    Modal,
    salesData, setSalesData
}) => {
    const [payDebt, {
        isLoading
    }] = usePayDebtMutation();
    const [paymentDescription, setPaymentDescription] = useState('');

    const processPayment = useCallback(async (saleId) => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) {
            toast.error("Iltimos, to'g'ri to'lov miqdorini kiriting");
            return;
        }

        const sale = salesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }
        if (amount > (sale.payment?.debt || 0)) {
            toast.error("To'lov miqdori qarzdan oshib ketdi!");
            return;
        }

        const paymentData = {
            amount,
            paymentType,
            description: paymentDescription || "Qarz to‘lovi mijoz tomonidan qaytarildi",
        };

        try {
            await payDebt({ id: saleId, body: paymentData }).unwrap();
            setSalesData(prev =>
                prev.map(sale => {
                    if (sale._id === saleId) {
                        const newPaidAmount = (sale.payment?.paidAmount || 0) + amount;
                        const newDebt = (sale.payment?.totalAmount || 0) - newPaidAmount;
                        const newStatus = newDebt <= 0 ? 'paid' : 'partial';
                        return {
                            ...sale,
                            payment: {
                                ...sale.payment,
                                paidAmount: newPaidAmount,
                                debt: Math.max(0, newDebt),
                                status: newStatus,
                                paymentHistory: [
                                    ...(sale.payment?.paymentHistory || []),
                                    {
                                        amount,
                                        date: new Date().toISOString(),
                                        description: paymentData.description,
                                        paidBy: sale.salesperson,
                                        paymentType,
                                    },
                                ],
                            },
                        };
                    }
                    return sale;
                })
            );
            closeModal()
            toast.success("To'lov muvaffaqiyatli amalga oshirildi!");
        } catch (error) {
            toast.error(error?.data?.innerData || error?.data?.message || "To'lov amalga oshirishda xatolik yuz berdi.");
        }

        setPaymentAmount('');
        setPaymentDescription('');
    }, [paymentAmount, paymentDescription, paymentType, payDebt, salesData]);

    return (
        <Modal
            isOpen={modalState.isPaymentModalOpen}
            onClose={closeModal}
            title="To'lov amalga oshirish"
        >
            {currentSale ? (
                <div className="invoice-payment-form">
                    <input
                        className="invoice-form-input"
                        type="text"
                        placeholder="To'lov miqdor"
                        value={paymentAmount ? Number(paymentAmount).toLocaleString('uz-UZ') : ''}
                        onChange={(e) => {
                            // Remove non-numeric characters (e.g., dots, commas)
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            // Only update if the value is empty or a valid non-negative number
                            if (value === '' || (parseFloat(value) >= 0 && !isNaN(value))) {
                                setPaymentAmount(value);
                            }
                        }}
                        onBlur={() => {
                            // Optional: Ensure the value is formatted when the input loses focus
                            if (paymentAmount) {
                                setPaymentAmount(parseFloat(paymentAmount).toString());
                            }
                        }}
                        min="0"
                        max={currentSale.payment?.debt || 0}
                    />
                    <Select
                        className="invoice-form-select"
                        value={paymentType}
                        onChange={setPaymentType}
                        style={{ width: '100%' }}
                    >
                        <Option value="naqt">Naqt pul</Option>
                        <Option value="bank">Bank o'tkazmasi</Option>
                    </Select>
                    <input
                        className="invoice-form-input"
                        type="text"
                        placeholder="Izoh (ixtiyoriy)"
                        value={paymentDescription}
                        onChange={(e) => setPaymentDescription(e.target.value)}
                    />
                    {
                        paymentAmount <= 0 ?
                            <Button
                                className="invoice-btn invoice-btn-success"
                                onClick={() => processPayment(modalState.activeSaleId)}
                                disabled={true}
                            >
                                To'lovni amalga oshirish
                            </Button>
                            :
                            <Button
                                className="invoice-btn invoice-btn-success"
                                onClick={() => processPayment(modalState.activeSaleId)}
                                disabled={isLoading}
                                loading={isLoading}
                            >
                                To'lovni amalga oshirish
                            </Button>
                    }
                </div>
            ) : (
                <p>Sotuv topilmadi. Iltimos, qayta urinib ko'ring.</p>
            )
            }
        </Modal >
    )
}

export default IsPaymentModal
