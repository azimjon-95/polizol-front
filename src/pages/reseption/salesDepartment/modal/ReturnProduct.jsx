import React, { useCallback } from 'react';
import { toast } from 'react-toastify';
import { Select, Modal, Button, Input } from 'antd';
import { useReturnProductsMutation } from '../../../../context/cartSaleApi';
import { RotateCcw, Package, DollarSign, MessageSquare, CreditCard, CheckCircle, X } from 'react-feather';
import './css/return.css'
const { Option } = Select;

const ReturnProduct = ({
    modalState,
    closeModal,
    returnItems,
    customerName,
    handleReturnItemChange,
    setReturnReason,
    returnReason,
    paymentType,
    setPaymentType,
    refundAmount,
    setModalState,
    setRefundAmount,
    NumberFormat,
    calculateTotalRefund,
}) => {
    const [returnProducts, { isLoading }] = useReturnProductsMutation();

    const processReturn = useCallback(async () => {
        const refund = parseFloat(refundAmount);
        const totalRefund = calculateTotalRefund();
        try {
            if (!refund || refund <= 0) {
                toast.error("Iltimos, to'g'ri qaytarish summasini kiriting");
                return;
            }
            if (!returnReason) {
                toast.error("Iltimos, qaytarish sababini kiriting");
                return;
            }
            if (refund > totalRefund) {
                toast.error("Qaytariladigan summa tanlangan mahsulotlar summasidan oshib ketdi!");
                return;
            }

            const returnData = {
                items: returnItems
                    .filter(item => item.selected && item.returnQuantity > 0)
                    .map(item => ({
                        productId: item._id,
                        productName: item.productName || 'Unknown Product',
                        category: item.category || 'Unknown Category',
                        quantity: item.returnQuantity,
                        discountedPrice: item.discountedPrice || 0,
                        warehouseId: item.warehouseId || null,
                    })),
                totalRefund: refund,
                reason: returnReason,
                paymentType: paymentType,
                customerName: customerName || 'Unknown Customer',
            };


            await returnProducts({ id: modalState.activeSaleId, body: returnData }).unwrap();
            toast.success("Qaytarish muvaffaqiyatli amalga oshirildi!");
            setModalState(
                prev => ({
                    ...prev,
                    isReturnModalOpen: false,
                    activeSaleId: null,
                })
            )
        } catch (error) {
            console.log(error);
            toast.error(error?.data?.message || "Qaytarishda xatolik yuz berdi.");
        }
    }, [refundAmount, returnReason, paymentType, returnItems, modalState.activeSaleId, returnProducts, customerName, closeModal]);

    return (
        <>
            <Modal
                open={modalState.isReturnModalOpen}
                onCancel={() => {
                    setModalState(
                        prev => ({
                            ...prev,
                            isReturnModalOpen: false,
                            activeSaleId: null,
                        })
                    )
                }}
                title={
                    <div className="chipi-modal-header">
                        <RotateCcw size={20} />
                        Mahsulotni qaytarish - {customerName || 'Mijoz'}
                    </div>
                }
                footer={[
                    <Button key="cancel" onClick={() => {
                        setModalState(
                            prev => ({
                                ...prev,
                                isReturnModalOpen: false,
                                activeSaleId: null,
                            })
                        )
                    }} className="chipi-button-cancel">
                        <X size={16} />
                        Bekor qilish
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={processReturn}
                        disabled={isLoading || refundAmount <= 0}
                        loading={isLoading}
                        className="chipi-button-submit"
                    >
                        <CheckCircle size={16} />
                        Qaytarishni tasdiqlash
                    </Button>,
                ]}
            >
                <div className="chipi-invoice-return-form">
                    {returnItems.length === 0 ? (
                        <div className="chipi-no-products">
                            <Package size={20} />
                            Mahsulotlar topilmadi.
                        </div>
                    ) : (
                        returnItems.map((item, index) => (
                            <div key={index} className="chipi-invoice-return-item">
                                <label className="chipi-item-label">
                                    <input
                                        type="checkbox"
                                        className="chipi-item-checkbox"
                                        checked={item.selected || false}
                                        onChange={(e) => handleReturnItemChange(index, 'selected', e.target.checked)}
                                    />
                                    <Package size={16} />
                                    {item.productName || 'Noma\'lum'} ({item.category || 'Noma\'lum'})
                                </label>
                                {item.selected && (
                                    <Input
                                        type="number"
                                        min="1"
                                        max={item.quantity || 1}
                                        value={item.returnQuantity || ''}
                                        placeholder={`Soni: ${item.quantity || 0}`}
                                        className="chipi-quantity-input"
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= (item.quantity || 1))) {
                                                handleReturnItemChange(index, 'returnQuantity', value === '' ? '' : parseInt(value));
                                            }
                                        }}
                                        style={{ width: '150px' }}
                                    />
                                )}
                                <div className="chipi-item-total">
                                    <DollarSign size={14} />
                                    Jami: {NumberFormat((item.returnQuantity || 0) * (item.discountedPrice || 0))}
                                </div>
                            </div>
                        ))
                    )}

                    <div className="chipi-input-group">
                        <MessageSquare className="chipi-input-icon" size={16} />
                        <Input
                            className="chipi-invoice-form-input chipi-input-with-icon"
                            placeholder="Qaytarish sababi"
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                        />
                    </div>

                    <div className="chipi-input-group">
                        <Select
                            className="chipi-invoice-form-select"
                            value={paymentType}
                            onChange={setPaymentType}
                            style={{ width: '100%' }}
                        >
                            <Option value="naqt">💵 Naqt pul</Option>
                            <Option value="bank">🏦 Bank o'tkazmasi</Option>
                        </Select>
                    </div>

                    <div className="chipi-input-group">
                        <DollarSign className="chipi-input-icon" size={16} />
                        <Input
                            className="chipi-invoice-form-input chipi-input-with-icon"
                            type="number"
                            value={refundAmount}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || (parseFloat(value) >= 0 && !isNaN(value))) {
                                    setRefundAmount(value);
                                }
                            }}
                            min="0"
                            placeholder={`Qaytariladigan summa ${NumberFormat(refundAmount || calculateTotalRefund())}`}
                        />
                    </div>

                    <div className="chipi-total-summary">
                        <span>Jami qaytarish summasi:</span>
                        <div className="chipi-total-amount">
                            <DollarSign size={20} />
                            {NumberFormat(refundAmount || calculateTotalRefund())}
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ReturnProduct;


