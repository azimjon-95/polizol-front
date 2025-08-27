import React, { useCallback } from 'react';
import { Trash2, Edit } from 'react-feather';
import { Select, Input } from 'antd';
import { useUpdateCartSaleMutation } from '../../../../context/cartSaleApi';
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

    // Debounced state update
    const debouncedSetEditSaleData = useCallback(
        debounce((newData) => {
            setEditSaleData(newData);
        }, 300),
        [setEditSaleData]
    );

    // Handler for customer field updates
    const handleCustomerChange = useCallback(
        (field, value) => {
            debouncedSetEditSaleData((prev) => ({
                ...prev,
                customer: { ...prev.customer, [field]: value },
            }));
        },
        [debouncedSetEditSaleData]
    );

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
                const totalAmount = prev.payment?.totalAmount || 0;
                const paidAmount = field === 'paidAmount' ? rawValue : prev.payment?.paidAmount || 0;
                const newDebt = totalAmount - paidAmount;
                return {
                    ...prev,
                    payment: {
                        ...prev.payment,
                        [field]: rawValue,
                        debt: field === 'totalAmount' || field === 'paidAmount' ? Math.max(0, newDebt) : prev.payment.debt,
                        status: field === 'paidAmount' && newDebt <= 0 ? 'paid' : prev.payment.status,
                    },
                };
            });
        },
        [debouncedSetEditSaleData, parseNumber]
    );

    // Handler for item field updates
    const handleItemChange = useCallback(
        (index, field, value) => {
            const newItems = [...(editSaleData.items || [])];
            const rawValue = field === 'discountedPrice' ? parseNumber(value) : parseFloat(value) || value;
            if ((field === 'discountedPrice' || field === 'quantity' || field === 'ndsRate') && isNaN(rawValue)) return;

            newItems[index] = {
                ...newItems[index],
                [field]: rawValue,
                ndsAmount:
                    field === 'ndsRate' || field === 'discountedPrice' || field === 'quantity'
                        ? (newItems[index].discountedPrice || 0) * (newItems[index].quantity || 0) * (field === 'ndsRate' ? rawValue : newItems[index].ndsRate || 0) / 100
                        : newItems[index].ndsAmount,
            };

            debouncedSetEditSaleData((prev) => ({ ...prev, items: newItems }));
        },
        [editSaleData.items, debouncedSetEditSaleData, parseNumber]
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
        if (!editSaleData.customerId?.name && !editSaleData.customerId?.company) {
            toast.error('Mijoz ismi yoki kompaniya nomi kiritilishi shart!');
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
                            <CustomInput
                                label="Mijoz ismi"
                                value={editSaleData.customerId?.name || ''}
                                onChange={(e) => handleCustomerChange('name', e.target.value)}
                                placeholder="Mijoz ismi"
                            />
                            <CustomInput
                                label="Kompaniya"
                                value={editSaleData.customerId?.company || ''}
                                onChange={(e) => handleCustomerChange('company', e.target.value)}
                                placeholder="Mijoz kompaniyasi"
                            />
                            <CustomInput
                                label="Telefon raqami"
                                value={editSaleData.customerId?.phone || ''}
                                onChange={(e) => handleCustomerChange('phone', e.target.value)}
                                placeholder="Telefon raqami"
                                type="tel"
                            />
                            <CustomInput
                                label="Manzil"
                                value={editSaleData.customerId?.address || ''}
                                onChange={(e) => handleCustomerChange('address', e.target.value)}
                                placeholder="Manzil"
                            />
                        </div>

                        {/* Sale Information */}
                        <div className="invoice-edit-section">
                            <h4>Sotuv ma'lumotlari:</h4>
                            <CustomInput
                                label="Transport"
                                value={editSaleData.transport || ''}
                                onChange={(e) => handleSaleChange('transport', e.target.value)}
                                placeholder="Transport"
                            />
                            <CustomInput
                                label="Sotuvchi"
                                value={editSaleData.salesperson || ''}
                                onChange={(e) => handleSaleChange('salesperson', e.target.value)}
                                placeholder="Sotuvchi"
                            />
                            <CustomInput
                                label="Sana"
                                value={editSaleData.createdAt ? new Date(editSaleData.createdAt).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleSaleChange('createdAt', e.target.value)}
                                placeholder="Sana"
                                type="date"
                            />
                            <CustomInput
                                label="Vaqt"
                                value={editSaleData.time || ''}
                                onChange={(e) => handleSaleChange('time', e.target.value)}
                                placeholder="Vaqt"
                                type="time"
                            />
                        </div>

                        {/* Payment Information */}
                        <div className="invoice-edit-section">
                            <h4>To'lov ma'lumotlari:</h4>
                            <CustomInput
                                label="Jami summa"
                                value={formatNumber(editSaleData.payment?.totalAmount || 0)}
                                onChange={(e) => handlePaymentChange('totalAmount', e.target.value)}
                                placeholder="Jami summa"
                            />
                            <CustomInput
                                label="To'langan summa"
                                value={formatNumber(editSaleData.payment?.paidAmount || 0)}
                                onChange={(e) => handlePaymentChange('paidAmount', e.target.value)}
                                placeholder="To'langan summa"
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
                                            <CustomInput
                                                label="Mahsulot nomi"
                                                value={item.productName || ''}
                                                onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                                placeholder="Mahsulot nomi"
                                            />
                                            <CustomInput
                                                label="Kategoriya"
                                                value={item.category || ''}
                                                onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                                                placeholder="Kategoriya"
                                            />
                                        </div>
                                        <div className="invoice-item-edit-row">
                                            <CustomInput
                                                label="Miqdor"
                                                value={item.quantity || ''}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                placeholder="Miqdor"
                                                type="number"
                                            />
                                            <CustomInput
                                                label="Narx"
                                                value={formatNumber(item.discountedPrice || 0)}
                                                onChange={(e) => handleItemChange(index, 'discountedPrice', e.target.value)}
                                                placeholder="Narx"
                                            />
                                            <CustomInput
                                                label="QQS %"
                                                value={item.ndsRate || ''}
                                                onChange={(e) => handleItemChange(index, 'ndsRate', e.target.value)}
                                                placeholder="QQS %"
                                                type="number"
                                            />
                                        </div>
                                        <div className="invoice-item-edit-row">
                                            <CustomInput
                                                label="O'lchov birligi"
                                                value={item.size || ''}
                                                onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                                                placeholder="O'lchov birligi"
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

                        {/* Notes Section */}
                        <div className="invoice-edit-section">
                            <h4>Qo'shimcha ma'lumotlar:</h4>
                            <Input.TextArea
                                className="invoice-form-input"
                                placeholder="Izoh yoki qo'shimcha ma'lumotlar"
                                value={editSaleData.notes || ''}
                                onChange={(e) => handleSaleChange('notes', e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="invoice-edit-buttons">
                            <button
                                className="invoice-btn invoice-btn-success"
                                onClick={processUpdateSale}
                                disabled={!editSaleData.customerId?.name && !editSaleData.customerId?.company}
                                aria-label="Save changes"
                            >
                                <Edit size={16} />
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