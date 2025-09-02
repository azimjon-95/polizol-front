import React, { useCallback, useEffect, useState } from 'react';
import { Trash2, Edit } from 'react-feather';
import { Select, Input } from 'antd';
import { useUpdateCartSaleMutation } from '../../../../context/cartSaleApi';
import { useGetAllMaterialsQuery } from '../../../../context/materialApi';
import { useGetCompanysQuery } from '../../../../context/cartSaleApi';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
import './customModal.css';

const { Option } = Select;

const CustomInput = ({ label, value, onChange, placeholder, type = 'text', ...props }) => (
    <div className="invoice-edit-section">
        <label className="custom-modal-label">{label}</label>
        <Input
            className="invoice-form-input"
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            {...props}
        />
    </div>
);

const CustomModal = React.memo(({
    isOpen,
    onClose,
    title,
    editSaleData,
    setEditSaleData,
    modalState,
    refetch,
    formatNumber,
    parseNumber,
    NumberFormat,
}) => {
    const [updateCartSale] = useUpdateCartSaleMutation();
    const { data: materials = [] } = useGetAllMaterialsQuery();
    const { data: customers = [] } = useGetCompanysQuery();
    const [totalAmount, setTotalAmount] = useState(editSaleData.payment?.totalAmount || 0);

    // Calculate total amount whenever items change
    useEffect(() => {
        const newTotal = editSaleData.items?.reduce(
            (sum, item) => sum + (item.discountedPrice || 0) * (item.quantity || 0),
            0
        ) || 0;
        setTotalAmount(newTotal);
        setEditSaleData((prev) => ({
            ...prev,
            payment: {
                ...prev.payment,
                totalAmount: newTotal,
                debt: Math.max(0, newTotal - (prev.payment?.paidAmount || 0)),
                status: newTotal <= (prev.payment?.paidAmount || 0) ? 'paid' : 'partial',
            },
        }));
    }, [editSaleData.items, setEditSaleData]);

    // Debounced state update
    const debouncedSetEditSaleData = useCallback(
        debounce((newData) => {
            setEditSaleData(newData);
        }, 300),
        [setEditSaleData]
    );

    // Handler for customer selection
    const handleCustomerChange = (value) => {
        const selectedCustomer = customers?.innerData?.find(c => c._id === value);
        setEditSaleData(prev => ({
            ...prev,
            customerId: value,
            customer: selectedCustomer || null,
        }));
    };


    // Handler for sale field updates
    const handleSaleChange = useCallback(
        (field, value) => {
            debouncedSetEditSaleData((prev) => ({ ...prev, [field]: value }));
        },
        [debouncedSetEditSaleData]
    );

    // Handler for payment field updates
    const handlePaymentChange = useCallback(
        (field, value) => {
            const rawValue = field === 'paymentType' ? value : parseNumber(value);
            if (field !== 'paymentType' && isNaN(rawValue)) return;

            debouncedSetEditSaleData((prev) => {
                const paidAmount = field === 'paidAmount' ? rawValue : prev.payment?.paidAmount || 0;
                return {
                    ...prev,
                    payment: {
                        ...prev.payment,
                        [field]: rawValue,
                        debt: Math.max(0, totalAmount - paidAmount),
                        status: field === 'paidAmount' && totalAmount <= paidAmount ? 'paid' : prev.payment.status,
                    },
                };
            });
        },
        [debouncedSetEditSaleData, parseNumber, totalAmount]
    );

    // Handler for item field updates
    const handleItemChange = useCallback(
        (index, field, value) => {
            const newItems = [...(editSaleData.items || [])];
            let rawValue = value;

            if (field === 'productId') {
                const selectedMaterial = materials?.innerData?.find(m => m._id === value);
                if (selectedMaterial) {
                    newItems[index] = {
                        ...newItems[index],
                        productId: value,
                        productName: selectedMaterial.name,
                        category: selectedMaterial.category || 'Others',
                        discountedPrice: selectedMaterial.price || 0,
                        size: selectedMaterial.unit || 'dona',
                        ndsRate: newItems[index].ndsRate || 0,
                        ndsAmount: ((selectedMaterial.price || 0) * (newItems[index].quantity || 0) * (newItems[index].ndsRate || 0)) / 100,
                    };
                }
            } else if (field === 'quantity') {
                rawValue = parseFloat(value) || 0;
                if (isNaN(rawValue)) return;
                newItems[index] = {
                    ...newItems[index],
                    [field]: rawValue,
                    ndsAmount: (newItems[index].discountedPrice || 0) * rawValue * (newItems[index].ndsRate || 0) / 100,
                };
            }

            debouncedSetEditSaleData((prev) => ({ ...prev, items: newItems }));
        },
        [editSaleData.items, debouncedSetEditSaleData, materials]
    );

    // Handler for removing an item
    const handleRemoveItem = useCallback(
        (index) => {
            const newItems = editSaleData.items?.filter((_, i) => i !== index) || [];
            debouncedSetEditSaleData((prev) => ({ ...prev, items: newItems }));
        },
        [editSaleData.items, debouncedSetEditSaleData]
    );

    // Handler for updating sale
    const processUpdateSale = useCallback(async () => {
        if (!editSaleData.customerId) {
            toast.error('Mijoz tanlanmagan!');
            return;
        }

        try {
            await updateCartSale({ id: modalState.activeSaleId, body: editSaleData }).unwrap();
            toast.success('Sotuv muvaffaqiyatli yangilandi!');
            refetch();
            onClose();
        } catch (error) {
            toast.error('Sotuvni yangilashda xatolik yuz berdi.');
            console.error(error);
        }
    }, [editSaleData, modalState.activeSaleId, updateCartSale, refetch, onClose]);

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal">
                <div className="custom-modal-header">
                    <h3 className="custom-modal-title">{title}</h3>
                    <button
                        className="custom-modal-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="custom-modal-body">
                    <div className="invoice-edit-form">
                        {/* Customer Information */}
                        <div className="invoice-edit-section">
                            <h4>Mijoz ma'lumotlari:</h4>
                            <div className="invoice-edit-section">
                                <label className="custom-modal-label">Mijoz</label>
                                <Select
                                    value={editSaleData.customerId || undefined}
                                    onChange={handleCustomerChange}
                                    placeholder="Mijozni tanlang"
                                    style={{ width: '100%' }}
                                >
                                    {customers?.innerData?.map(customer => (
                                        <Option key={customer._id} value={customer._id}>
                                            {customer.name}
                                        </Option>
                                    ))}
                                </Select>

                            </div>
                        </div>

                        {/* Sale Information */}
                        <div className="invoice-edit-section">
                            <h4>Sotuv ma'lumotlari:</h4>
                            <CustomInput
                                label="Sotuvchi"
                                value={editSaleData.salesperson || ''}
                                onChange={(e) => handleSaleChange('salesperson', e.target.value)}
                                placeholder="Sotuvchi"
                            />
                        </div>

                        {/* Payment Information */}
                        <div className="invoice-edit-section">
                            <h4>To'lov ma'lumotlari:</h4>
                            <CustomInput
                                label="Jami summa"
                                value={formatNumber(totalAmount)}
                                disabled
                                placeholder="Jami summa"
                            />
                            <CustomInput
                                label="To'langan summa"
                                value={formatNumber(editSaleData.payment?.paidAmount || 0)}
                                onChange={(e) => handlePaymentChange('paidAmount', e.target.value)}
                                placeholder="To'langan summa"
                            />
                            <CustomInput
                                label="Qarz"
                                value={formatNumber(editSaleData.payment?.debt || 0)}
                                disabled
                                placeholder="Qarz"
                            />
                            <div className="invoice-edit-section">
                                <label className="custom-modal-label">To'lov turi</label>
                                <Select
                                    className="invoice-form-select"
                                    value={editSaleData.payment?.paymentType || 'naqt'}
                                    onChange={(value) => handlePaymentChange('paymentType', value)}
                                    style={{ width: '100%' }}
                                >
                                    <Option value="naqt">Naqt pul</Option>
                                    <Option value="bank">Bank o'tkazmasi</Option>
                                </Select>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="invoice-edit-section">
                            <h4>Mahsulotlar:</h4>
                            <div className="invoice-items-edit">
                                {editSaleData.items?.map((item, index) => (
                                    <div key={index} className="invoice-item-edit">
                                        <div className="invoice-item-edit-row">
                                            <div className="invoice-edit-section">
                                                <label className="custom-modal-label">Mahsulot</label>
                                                <Select
                                                    className="invoice-form-select"
                                                    value={item.productId || undefined}
                                                    onChange={(value) => handleItemChange(index, 'productId', value)}
                                                    placeholder="Mahsulotni tanlang"
                                                    style={{ width: '100%' }}
                                                >
                                                    {materials?.innerData?.map(material => (
                                                        <Option key={material._id} value={material._id}>
                                                            {material.name} ({material.unit})
                                                        </Option>
                                                    ))}
                                                </Select>


                                            </div>
                                            <CustomInput
                                                label="Miqdor"
                                                value={item.quantity || ''}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                placeholder="Miqdor"
                                                type="number"
                                            />
                                        </div>
                                        <div className="invoice-item-edit-row">
                                            <CustomInput
                                                label="Narx"
                                                value={formatNumber(item.discountedPrice || 0)}
                                                disabled
                                                placeholder="Narx"
                                            />
                                            <button
                                                className="invoice-btn invoice-btn-danger"
                                                onClick={() => handleRemoveItem(index)}
                                                aria-label="Remove item"
                                            >
                                                <Trash2 size={16} />
                                                O'chirish
                                            </button>
                                        </div>
                                        <div className="invoice-item-total">
                                            Jami: {NumberFormat((item.quantity || 0) * (item.discountedPrice || 0))} so'm
                                        </div>
                                    </div>
                                )) || <p>Mahsulotlar mavjud emas</p>}
                            </div>
                        </div>


                        <div className="invoice-edit-buttons">

                            <button
                                className="invoice-btn-success"
                                onClick={processUpdateSale}
                                disabled={!editSaleData.customerId}
                                aria-label="Save changes"
                            >
                                Saqlash
                            </button>
                            <button
                                className="invoice-btn invoice-btn-secondary"
                                onClick={onClose}
                                aria-label="Cancel"
                            >
                                Bekor qilish
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CustomModal;




