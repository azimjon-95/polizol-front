import React, { useState, useCallback } from 'react';
import { Select, Modal, Button, Input } from 'antd';
import { toast } from 'react-toastify';
import { usePayDebtMutation } from '../../../../context/cartSaleApi';

const { Option } = Select;

// Function to format number with thousand separators
const formatNumber = (value) => {
    if (!value) return '';
    const number = parseFloat(value.replace(/\D/g, '')); // Remove non-digits
    return number.toLocaleString('en-US', { minimumFractionDigits: 0 });
};

// Function to parse formatted number back to raw number
const parseNumber = (value) => {
    return value.replace(/,/g, ''); // Remove commas
};

const IsPaymentModal = ({
    modalState,
    closeModal,
    currentSale,
    paymentType,
    setPaymentType,
    paymentAmount,
    setPaymentAmount,
    salesData,
    setSalesData,
}) => {
    const [payDebt, { isLoading }] = usePayDebtMutation();
    const [paymentDescription, setPaymentDescription] = useState('');
    const paidBy = localStorage.getItem("admin_fullname");

    const processPayment = useCallback(async () => {
        const rawAmount = parseNumber(paymentAmount); // Get raw number
        const amount = parseFloat(rawAmount);
        if (!amount || amount <= 0) {
            toast.error("Iltimos, to'g'ri to'lov miqdorini kiriting");
            return;
        }

        const paymentData = {
            customerId: modalState.activeSaleId,
            amount, // Send raw number to server
            description: paymentDescription || "Qarz to‘lovi mijoz tomonidan qaytarildi",
            paidBy: paidBy || "Nomalum",
            paymentType: paymentType || "naqt",
        };
        try {
            const response = await payDebt(paymentData).unwrap();
            setSalesData(prev =>
                prev.map(sale => {
                    if (sale.customerId === currentSale.customerId) {
                        const newDebt = sale.payment?.debt || 0;
                        return {
                            ...sale,
                            payment: {
                                ...sale.payment,
                                debt: newDebt,
                                status: newDebt <= 0 ? 'paid' : 'partial',
                            },
                        };
                    }
                    return sale;
                })
            );
            closeModal();
            toast.success("To'lov muvaffaqiyatli amalga oshirildi!");
        } catch (err) {
            toast.error(err?.data?.message || "Xatolik yuz berdi!");
        }

        setPaymentAmount('');
        setPaymentDescription('');
    }, [paymentAmount, paymentDescription, paidBy, paymentType, payDebt, salesData, currentSale]);

    return (
        <Modal
            open={modalState.isPaymentModalOpen}
            onCancel={() => {
                closeModal();
                setPaymentAmount('');
                setPaymentDescription('');
            }}
            title="To'lov amalga oshirish"
            footer={null}
        >
            {currentSale ? (
                <div>
                    <Input
                        type="text"
                        placeholder="To'lov miqdori"
                        value={formatNumber(paymentAmount)} // Display formatted number
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, ''); // Allow only digits
                            setPaymentAmount(val); // Store raw number
                        }}
                        style={{ marginBottom: 10 }}
                    />
                    <Select
                        style={{ width: '100%', marginBottom: 10 }}
                        value={paymentType}
                        onChange={setPaymentType}
                        placeholder="To'lov turini tanlang"
                    >
                        <Option value="naqt">Naqt pul</Option>
                        <Option value="bank">Bank o'tkazmasi</Option>
                    </Select>
                    <Input
                        placeholder="Izoh (ixtiyoriy)"
                        value={paymentDescription}
                        onChange={(e) => setPaymentDescription(e.target.value)}
                        style={{ marginBottom: 15 }}
                    />
                    <Button
                        type="primary"
                        block
                        onClick={processPayment}
                        loading={isLoading}
                        disabled={!paymentAmount || parseFloat(parseNumber(paymentAmount)) <= 0 || !paidBy}
                    >
                        To'lovni amalga oshirish
                    </Button>
                </div>
            ) : (
                <p>Sotuv yoki mijoz ma'lumotlari topilmadi</p>
            )}
        </Modal>
    );
};

export default IsPaymentModal;