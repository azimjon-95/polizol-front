import React, { useState, useCallback } from 'react';
import { Select, Modal, Button, Input, InputNumber } from "antd";
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
    salesData,
    setSalesData,
    refetch,
}) => {
    const [payDebt, { isLoading }] = usePayDebtMutation();
    const [paymentDescription, setPaymentDescription] = useState('');
    const paidBy = localStorage.getItem("admin_fullname");

    const processPayment = useCallback(async () => {
        const amount = paymentAmount;
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
            refetch();
            closeModal();
            toast.success("To'lov muvaffaqiyatli amalga oshirildi!");
        } catch (err) {
            toast.error(err?.data?.message || "Xatolik yuz berdi!");
        }

        setPaymentAmount('');
        setPaymentDescription('');
    }, [paymentAmount, paymentDescription, paidBy, paymentType, payDebt, salesData, currentSale]);


    const formatter = (val) => {
        if (!val && val !== 0) return "";
        const [start, end] = `${val}`.split(".") || [];
        const v = `${start}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return `${end ? `${v}.${end}` : `${v}`}`;
    };


    const parser = (val) => val?.replace(/\$\s?|(,*)/g, "");

    const onChange = (val) => {
        setPaymentAmount(val);
    };

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
                    <InputNumber
                        value={paymentAmount}
                        formatter={formatter}
                        parser={parser}
                        onChange={onChange}
                        style={{ width: "100%" }}
                    />
                    <Select
                        style={{ width: '100%', margin: "10px 0" }}
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
                        disabled={!paymentAmount || !paidBy}
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