import React, { useCallback } from 'react';
import { toast } from 'react-toastify';

import { Select, Button } from 'antd';
import {
    useReturnProductsMutation
} from '../../../../context/cartSaleApi';
import { RotateCcw } from 'react-feather';

const { Option } = Select;

const ReturnProduct = ({
    modalState,
    closeModal,
    returnItems,
    customerName,
    handleReturnItemChange,
    Modal,
    setReturnReason,
    returnReason,
    paymentType,
    setPaymentType,
    refundAmount,
    setRefundAmount,
    NumberFormat,
    calculateTotalRefund
}) => {
    const [returnProducts, {
        isLoading
    }] = useReturnProductsMutation();

    const processReturn = useCallback(async () => {
        const refund = parseFloat(refundAmount);
        const totalRefund = calculateTotalRefund();

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
                    productName: item.productName,
                    category: item.category,
                    quantity: item.returnQuantity,
                    discountedPrice: item.discountedPrice,
                    warehouseId: item.warehouseId,
                })),
            totalRefund: refund,
            reason: returnReason,
            paymentType: paymentType,
            customerName
        };

        try {
            await returnProducts({ id: modalState.activeSaleId, body: returnData }).unwrap();
            toast.success("Qaytarish muvaffaqiyatli amalga oshirildi!");
            closeModal();
        } catch (error) {
            toast.error("Qaytarishda xatolik yuz berdi.");
        }
    }, [refundAmount, returnReason, paymentType, returnItems, modalState.activeSaleId, returnProducts]);



    return (
        <Modal
            isOpen={modalState.isReturnModalOpen}
            onClose={closeModal}
            title="Mahsulotni qaytarish"
        >
            <div className="invoice-return-form">
                <h4>Tanlangan mahsulotlar:</h4>
                {returnItems.map((item, index) => (
                    <div key={index} className="invoice-return-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={item.selected || false}
                                onChange={(e) => handleReturnItemChange(index, 'selected', e.target.checked)}
                            />
                            {item.productName || 'Noma\'lum'} ({item.category || 'Noma\'lum'})
                        </label>
                        {item.selected && (
                            <input
                                type="number"
                                min="1"
                                max={item.quantity || 1}
                                value={item.returnQuantity || ''}
                                placeholder={`Soni: ${item.quantity || 0}`}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= (item.quantity || 1))) {
                                        handleReturnItemChange(index, 'returnQuantity', value === '' ? '' : parseInt(value));
                                    }
                                }}
                            />
                        )}
                        <div>Jami: {NumberFormat((item.returnQuantity || 0) * (item.discountedPrice || 0))}</div>
                    </div>
                ))}
                <input
                    className="invoice-form-input"
                    type="text"
                    placeholder="Qaytarish sababi"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
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
                <div>Jami qaytarish summasi: {NumberFormat(refundAmount || calculateTotalRefund())}</div>
                {
                    refundAmount <= 0 ?
                        <Button
                            className="invoice-btn invoice-btn-success"
                            disabled={true}
                        >
                            <RotateCcw size={16} />
                            Qaytarishni tasdiqlash
                        </Button>
                        :
                        <Button
                            className="invoice-btn invoice-btn-success"
                            onClick={() => processReturn()}
                            disabled={isLoading}
                            loading={isLoading}
                        >
                            <RotateCcw size={16} />
                            Qaytarishni tasdiqlash
                        </Button>
                }
            </div>
        </Modal>
    )
}

export default ReturnProduct
