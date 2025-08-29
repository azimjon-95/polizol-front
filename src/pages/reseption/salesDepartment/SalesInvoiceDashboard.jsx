import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    Package, Truck, User, Calendar, Clock, CheckCircle2, XCircle,
    Receipt, RotateCcw, Edit, Trash2, RefreshCw, MoreHorizontal, Truck as DeliveryIcon
} from 'lucide-react';
import { NumberFormat } from '../../../hook/NumberFormat';
import {
    useGetFilteredSalesQuery,
    useDeleteCartSaleMutation,
    useGetCompanysQuery,
} from '../../../context/cartSaleApi';
import { setFilteredSalesLength } from '../../../context/actions/lengthSlice';
import { useDispatch } from 'react-redux';
import { Button, Input, Popover, Select } from 'antd';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomModal from './salesPerson/CustomEditModal';
import './style/style.css';
import ProductList from './modal/ProductList';
import IsPaymentModal from './modal/IsPaymentModal';
import ReturnProduct from './modal/ReturnProduct';
import { RiExchange2Line } from "react-icons/ri";
import DeliveryProduct from './modal/DeliveryProduct';

const { Option } = Select;

const Modal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;
    return (
        <div className="invoice-modal-backdrop">
            <div className="invoice-modal-content">
                <div className="invoice-modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="invoice-modal-close">×</button>
                </div>
                <div className="invoice-modal-body">{children}</div>
                {footer && <div className="invoice-modal-footer">{footer}</div>}
            </div>
        </div>
    );
};

const customerTypeOption = {
    "internal": "Ichki Bozor",
    'export': "Eksport",
    'exchange': "Birja",
}

const SalesInvoiceDashboard = () => {
    const dispatch = useDispatch();
    const [deleteCartSale] = useDeleteCartSaleMutation();
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState('naqt');
    const [paymentDescription, setPaymentDescription] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [deliveryItems, setDeliveryItems] = useState([]);
    const [modalState, setModalState] = useState({
        isPaymentModalOpen: false,
        isItemsModalOpen: false,
        isReturnModalOpen: false,
        isEditModalOpen: false,
        isDeleteModalOpen: false,
        isCustomerModalOpen: false,
        isCustomerPaymentModalOpen: false,
        isDeliveryModalOpen: false,
        activeSaleId: null,
        activeCustomer: null,
    });
    const [returnItems, setReturnItems] = useState([]);
    const [editSaleData, setEditSaleData] = useState({});
    const [selectedSalesperson, setSelectedSalesperson] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState('all');
    const [selectedCustomerType, setSelectedCustomerType] = useState('all');
    const [salesData, setSalesData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const date = new Date();
        return `${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    });
    const { data: companys = { innerData: [] } } = useGetCompanysQuery();
    const { data: filteredSales, refetch, isLoading } = useGetFilteredSalesQuery(selectedMonth, {
        skip: !selectedMonth,
    });

    useEffect(() => {
        if (filteredSales?.innerData) {
            setSalesData(filteredSales.innerData);
        }
    }, [filteredSales]);

    useEffect(() => {
        if (selectedMonth) {
            refetch();
        }
    }, [selectedMonth, refetch]);

    const salespeople = useMemo(() => {
        const uniqueSalespeople = [...new Set(salesData?.map(sale => sale.salesperson).filter(Boolean))];
        return ['all', ...uniqueSalespeople];
    }, [salesData]);

    const currentSale = useMemo(() => {
        return salesData.find(s => s._id === modalState.activeSaleId) || null;
    }, [salesData, modalState.activeSaleId]);

    const role = localStorage.getItem("role");
    const workerId = localStorage.getItem("workerId");

    const filteredSalesData = useMemo(() => {
        return salesData.filter(sale => {
            const matchesSalesperson = role === "sotuvchi" || role === "sotuvchi eksport"
                ? sale.salerId === workerId
                : selectedSalesperson === 'all' || sale.salesperson === selectedSalesperson;

            const matchesCompany = selectedCompany === 'all' || (sale.customerId?._id === selectedCompany);

            const matchesCustomerType = selectedCustomerType === 'all' || sale.customerType === selectedCustomerType;

            return matchesSalesperson && matchesCompany && matchesCustomerType;
        });
    }, [salesData, selectedSalesperson, selectedCompany, selectedCustomerType, role, workerId]);


    const processDeleteSale = useCallback((saleId) => {
        setModalState(prev => ({ ...prev, isDeleteModalOpen: true, activeSaleId: saleId }));
    }, []);

    const confirmDeleteSale = async (saleId) => {

        try {
            const res = await deleteCartSale(saleId);

            if (res.data.state === true) {
                toast.success(res.data.state.message || "Sotuv muvaffaqiyatli o'chirildi!");
            } else {
                toast.warning(res.error.data.message || "Sotuvni o'chirishda xatolik yuz berdi.");
            }
            closeModal();
        } catch (error) {
            toast.error("Sotuvni o‘chirishda xatolik yuz berdi.");
        }
    };

    const openPaymentModal = useCallback((saleId) => {
        const sale = salesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }
        setModalState(prev => ({ ...prev, isPaymentModalOpen: true, activeSaleId: saleId }));
    }, [salesData]);

    const openItemsModal = useCallback((saleId) => {
        const sale = salesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }
        setModalState(prev => ({ ...prev, isItemsModalOpen: true, activeSaleId: saleId }));
    }, [salesData]);

    const openEditModal = useCallback((saleId) => {
        const sale = salesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }
        setEditSaleData(sale);
        setModalState(prev => ({ ...prev, isEditModalOpen: true, activeSaleId: saleId }));
    }, [salesData]);

    const openReturnModal = useCallback((saleId) => {
        const sale = salesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }

        setCustomerName(sale?.customerId?.name)
        setReturnItems(sale.items.map(item => ({
            ...item,
            returnQuantity: 0,
            selected: false,
        })));
        setRefundAmount('');
        setReturnReason('');
        setModalState(prev => ({ ...prev, isReturnModalOpen: true, activeSaleId: saleId }));
    }, [salesData]);

    const openDeliveryModal = useCallback((saleId) => {
        const sale = salesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }

        setDeliveryItems(sale.items.map(item => ({
            ...item,
            deliveryQuantity: 0,
            selected: false,
        })));
        setModalState(prev => ({ ...prev, isDeliveryModalOpen: true, activeSaleId: saleId }));
    }, [salesData]);

    const openCustomerModal = useCallback((saleId) => {
        const sale = salesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }
        setModalState(prev => ({
            ...prev,
            isCustomerModalOpen: true,
            activeSaleId: saleId,
            activeCustomer: sale.customerId,
        }));
    }, [salesData]);

    const openCustomerPaymentModal = useCallback((saleId) => {
        const sale = salesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }
        setModalState(prev => ({
            ...prev,
            isCustomerPaymentModalOpen: true,
            activeSaleId: saleId,
            activeCustomer: sale.customerId,
        }));
    }, [salesData]);

    const closeModal = useCallback(() => {
        setModalState({
            isPaymentModalOpen: false,
            isItemsModalOpen: false,
            isReturnModalOpen: false,
            isEditModalOpen: false,
            isDeleteModalOpen: false,
            isCustomerModalOpen: false,
            isCustomerPaymentModalOpen: false,
            isDeliveryModalOpen: false,
            activeSaleId: null,
            activeCustomer: null,
        });

        setReturnItems([]);
        setRefundAmount('');
        setReturnReason('');
        setDeliveryItems([]);
        setEditSaleData({});
    }, []);

    const handleReturnItemChange = useCallback((index, field, value) => {
        setReturnItems(prev => prev.map((item, i) => {
            if (i === index) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'selected' && !value) {
                    updatedItem.returnQuantity = 0;
                }
                return updatedItem;
            }
            return item;
        }));
    }, []);

    const handleDeliveryItemChange = useCallback((index, field, value) => {
        setDeliveryItems(prev => prev.map((item, i) => {
            if (i === index) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'selected' && !value) {
                    updatedItem.deliveryQuantity = 0;
                }
                return updatedItem;
            }
            return item;
        }));
    }, []);

    const calculateTotalRefund = useCallback(() => {
        return returnItems.reduce((total, item) => {
            if (item.selected && item.returnQuantity > 0) {
                return total + (item.returnQuantity * (item.discountedPrice || 0));
            }
            return total;
        }, 0);
    }, [returnItems]);

    const getTotalSales = useCallback(() => filteredSalesData.reduce((total, sale) => total + (sale.payment?.totalAmount || 0), 0), [filteredSalesData]);
    const getTotalDebt = () =>
        filteredSalesData.reduce((total, sale) => total + sale.payment?.debt || 0, 0);


    const handleInputChange = (e) => {
        const value = e.target.value;
        if (/^[0-1]?\d?(\.\d{0,4})?$/.test(value)) {
            setSelectedMonth(value);
        }
    };

    const handleBlur = () => {
        if (selectedMonth && !/^(0[1-9]|1[0-2])\.\d{4}$/.test(selectedMonth)) {
            setSelectedMonth('');
        }
    };

    const formatNumber = (value) => {
        if (value == null || isNaN(value)) return '0';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        const parsed = parseFloat(value.replace(/\./g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    const renderPopoverContent = (saleId) => (
        <div style={{ display: 'flex', alignItems: 'start', flexDirection: 'column', gap: '8px' }} className="renderPopover">
            <Button
                type="text"
                icon={<Edit size={16} />}
                onClick={() => openEditModal(saleId)}
            >
                Tahrirlash
            </Button>
            <Button
                type="text"
                icon={<Trash2 size={16} />}
                onClick={() => processDeleteSale(saleId)}
            >
                O‘chirish
            </Button>
            <Button
                type="text"
                icon={<RotateCcw size={16} />}
                onClick={() => openReturnModal(saleId)}
            >
                Vazvirat
            </Button>
        </div>
    );

    useEffect(() => {
        if (filteredSalesData) {
            dispatch(setFilteredSalesLength(filteredSalesData.length));
        }
    }, [filteredSalesData, dispatch]);

    const totalNds = filteredSalesData.reduce((sum, sale) => sum + (sale.payment.ndsTotal || 0), 0);
    const totalPaidAmount = filteredSalesData.reduce((sum, sale) => sum + (sale.payment.paidAmount || 0), 0);


    return (
        <div className="invoice-dashboard">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <div className="invoice-header">
                <div className="invoice-header-logo">
                    <h1 className="invoice-header-title">
                        <Receipt />
                        Savdo Hisob-fakturalari
                    </h1>
                    <div className="invoice-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="invoice-filter-group">
                            <Select
                                id="company-filter"
                                style={{ width: 150 }}
                                value={selectedCompany}
                                onChange={setSelectedCompany}
                            >
                                <Option value="all">Barchasi</Option>
                                {companys.innerData?.map((company) => (
                                    <Option key={company._id} value={company._id}>
                                        {company.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        {role !== "sotuvchi" || role !== "sotuvchi eksport" && (
                            <div className="invoice-filter-group">
                                <Select
                                    id="salesperson-filter"
                                    style={{ width: 155 }}
                                    value={selectedSalesperson}
                                    onChange={setSelectedSalesperson}
                                >
                                    {salespeople.map((person, index) => (
                                        <Option key={index} value={person}>
                                            {person === 'all' ? 'Barchasi' : person}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                        )}
                        <div className="invoice-filter-group">
                            <Select
                                id="customer-type-filter"
                                style={{ width: 155 }}
                                value={selectedCustomerType}
                                onChange={setSelectedCustomerType}
                            >
                                <Option value="all">Barchasi</Option>
                                <Option value="internal">Ichki</Option>
                                <Option value="export">Eksport</Option>
                                <Option value="exchange">Birja</Option>
                            </Select>
                        </div>
                        <div className="invoice-filter-group">
                            <Input
                                id="month-filter"
                                style={{ width: 75 }}
                                value={selectedMonth}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                placeholder="MM.YYYY"
                                maxLength={7}
                            />
                        </div>
                    </div>
                </div>
                <div className="invoice-stats-grid">
                    <div className="invoice-stat-card">
                        <div className="invoice-stat-value">{filteredSalesData.length}</div>
                        <div className="invoice-stat-label">Jami Savdolar</div>
                    </div>
                    <div className="invoice-stat-card">
                        <div className="invoice-stat-value">{NumberFormat(getTotalSales())}</div>
                        <div className="invoice-stat-label">Jami Summa</div>
                    </div>
                    <div className="invoice-stat-card">
                        <div className="invoice-stat-value">{NumberFormat(getTotalDebt())}</div>
                        <div className="invoice-stat-label">Jami Qarz</div>
                    </div>
                    <div className="invoice-stat-card">
                        <div className="invoice-stat-value">{NumberFormat(totalPaidAmount)}</div>
                        <div className="invoice-stat-label">To'langan</div>
                    </div>
                    <div className="invoice-stat-card">
                        <div className="invoice-stat-value">{NumberFormat(Math.floor(totalNds))}</div>
                        <div className="invoice-stat-label">Jami QQS</div>
                    </div>
                </div>
            </div>

            <div className="invoice-table-container">
                {isLoading ? (
                    <div className="sdash-loading-wrapper">
                        <RefreshCw className="sdash-loading-icon animate-spin" />
                        <p>Ma'lumotlar yuklanmoqda...</p>
                    </div>
                ) : filteredSalesData.length === 0 ? (
                    <p>Hech qanday savdo topilmadi.</p>
                ) : (
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>Sana/Vaqt</th>
                                <th style={{ textWrap: "nowrap" }}>Mijoz / Transport</th>
                                <th>Sotuvchi / Bozor</th>
                                <th>Mahsulotlar</th>
                                <th>Jami Summa</th>
                                <th>To'lov</th>
                                <th>To'lov holat</th>
                                <th>Yuborish</th>
                                {
                                    role !== "direktor" && <>
                                        <th>Amallar</th>
                                    </>
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSalesData.map((sale, inx) => (
                                <tr key={inx}>
                                    <td>
                                        <div style={{ gap: "2px", display: "flex", flexDirection: "column" }} className="invoice-card">
                                            <div className="invoice-card-header">
                                                <Calendar size={16} />
                                                {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' }) : 'Nomalum'}
                                            </div>
                                            <div className="invoice-card-content">
                                                <Clock size={16} className="invoice-icon" />
                                                {sale.time || 'Nomalum'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ gap: "2px", display: "flex", flexDirection: "column" }} className="invoice-card">
                                            <div className="invoice-card-header">
                                                <User size={16} />
                                                {sale?.customerId?.name}
                                            </div>
                                            <div className="invoice-card-content">
                                                <Truck size={16} className="invoice-icon" />
                                                {sale?.transport || 'Belgilanmagan'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ gap: "2px", display: "flex", flexDirection: "column" }} className="invoice-card">
                                            <div className="invoice-card-header">
                                                <User size={16} />
                                                {sale?.salesperson || 'Belgilanmagan'}
                                            </div>
                                            <div className="invoice-card-content">
                                                <RiExchange2Line size={16} className="invoice-icon" />
                                                {customerTypeOption[sale?.customerType] || 'Belgilanmagan'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ background: "dodgerblue", cursor: "pointer" }} className="invoice-card">
                                            <div className="invoice-card-header invoice-items-preview" onClick={() => openItemsModal(sale._id)}>
                                                <Package size={16} />
                                                Mahsulotlar ({sale?.items?.length || 0})
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="invoice-card">
                                            <div className="invoice-card-header invoice-amount-display">
                                                {NumberFormat(sale?.payment?.totalAmount || 0)} so'm
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="invoice-card">
                                            <div className="invoice-card-pay">
                                                <div>
                                                    <div className="invoice-card-content">
                                                        <div className="invoice-amount-display">
                                                            To'langan: {NumberFormat(Math.floor(sale?.payment?.paidAmount) || 0)} so'm
                                                        </div>
                                                    </div>
                                                    <div className="invoice-card-content">
                                                        <div className="invoice-debt-display">
                                                            Qarz: {NumberFormat(Math.floor(sale?.payment?.debt) || 0)} so'm
                                                        </div>
                                                    </div>
                                                </div>
                                                {
                                                    role !== "direktor" && <>

                                                        {(sale.payment?.debt || 0) > 0 && (
                                                            <button
                                                                className="invoice-btn invoice-btn-primary"
                                                                onClick={() => openPaymentModal(sale._id)}
                                                            >
                                                                To'lash
                                                            </button>
                                                        )}
                                                    </>
                                                }
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={`invoice-badge ${sale.payment?.status || 'partial'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => openCustomerPaymentModal(sale._id)}
                                        >
                                            {sale.payment?.status === 'paid' ? (
                                                <>
                                                    <CheckCircle2 size={16} />
                                                    To'langan
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle size={16} />
                                                    Qisman
                                                </>
                                            )}
                                        </span>
                                    </td>

                                    <td>
                                        <Button
                                            type="text"
                                            icon={<DeliveryIcon size={16} />}
                                            onClick={() => openDeliveryModal(sale._id)}
                                            className="invoice-btn-delivery"
                                        >
                                        </Button>
                                    </td>
                                    {
                                        role !== "direktor" && <>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Popover
                                                        content={renderPopoverContent(sale._id)}
                                                        title="Amallar"
                                                        trigger="click"
                                                        placement="left"
                                                    >
                                                        <Button className="Popoverinrowbtn" type="text" icon={<MoreHorizontal size={19} />} />
                                                    </Popover>
                                                </div>
                                            </td>
                                        </>
                                    }
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ProductList
                currentSale={currentSale}
                closeModal={closeModal}
                modalState={modalState}
                Modal={Modal}
                NumberFormat={NumberFormat}
            />

            <IsPaymentModal
                modalState={modalState}
                closeModal={closeModal}
                currentSale={currentSale}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                paymentAmount={paymentAmount}
                setPaymentAmount={setPaymentAmount}
                Modal={Modal}
                salesData={salesData}
                setSalesData={setSalesData}
                paymentDescription={paymentDescription}
            />
            <ReturnProduct
                modalState={modalState}
                closeModal={closeModal}
                customerName={customerName}
                returnItems={returnItems}
                handleReturnItemChange={handleReturnItemChange}
                Modal={Modal}
                returnReason={returnReason}
                setReturnReason={setReturnReason}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                NumberFormat={NumberFormat}
                refundAmount={refundAmount}
                setRefundAmount={setRefundAmount}
                calculateTotalRefund={calculateTotalRefund}
            />
            <DeliveryProduct
                deliveryItems={deliveryItems}
                handleDeliveryItemChange={handleDeliveryItemChange}
                Modal={Modal}
                closeModal={closeModal}
                modalState={modalState}
            />

            <Modal
                isOpen={modalState.isCustomerModalOpen}
                onClose={closeModal}
                title="Mijoz ma'lumotlari"
            >
                {modalState.activeCustomer ? (
                    <div className="invoice-customer-details">
                        <div className="invoice-customer-detail">
                            <strong>Ism:</strong> {modalState.activeCustomer.name || 'Noma\'lum'}
                        </div>
                        <div className="invoice-customer-detail">
                            <strong>Telefon:</strong> {modalState.activeCustomer.phone || 'Noma\'lum'}
                        </div>
                        <div className="invoice-customer-detail">
                            <strong>Turi:</strong> {modalState.activeCustomer.type === 'individual' ? 'Jismoniy shaxs' : 'Yuridik shaxs'}
                        </div>
                    </div>
                ) : (
                    <p>Mijoz ma'lumotlari topilmadi.</p>
                )}
            </Modal>

            <Modal
                isOpen={modalState.isCustomerPaymentModalOpen}
                onClose={closeModal}
                title="Mijoz va To'lov ma'lumotlari"
            >
                {currentSale ? (
                    <div className="invoice-customer-payment-details">
                        <h4>Mijoz ma'lumotlari</h4>
                        <div className="invoice-customer-detail">
                            <strong>Ism:</strong> {currentSale.customerId?.name || 'Noma\'lum'}
                        </div>
                        <div className="invoice-customer-detail">
                            <strong>Telefon:</strong> {currentSale.customerId?.phone || 'Noma\'lum'}
                        </div>
                        <div className="invoice-customer-detail">
                            <strong>Turi:</strong> {currentSale.customerId?.type === 'individual' ? 'Jismoniy shaxs' : 'Yuridik shaxs'}
                        </div>
                        <div className="invoice-customer-detail">
                            <strong>Manzil:</strong> {currentSale.customerId?.companyAddress || 'Noma\'lum'}
                        </div>
                        <h4 style={{ marginTop: '1rem' }}>To'lov ma'lumotlari</h4>
                        <div className="invoice-customer-detail">
                            <strong>Jami summa:</strong> {isNaN(currentSale.payment?.totalAmount) ? '0' : NumberFormat(currentSale.payment?.totalAmount || 0)} so'm
                        </div>
                        <div className="invoice-customer-detail">
                            <strong>To'langan:</strong> {isNaN(currentSale.payment?.paidAmount) ? '0' : NumberFormat(currentSale.payment?.paidAmount || 0)} so'm
                        </div>
                        <div className="invoice-customer-detail">
                            <strong>Qarz:</strong> {isNaN(currentSale.payment?.debt) ? '0' : NumberFormat(currentSale.payment?.debt || 0)} so'm
                        </div>
                        <div className="invoice-customer-detail">
                            <strong>QQS summasi:</strong> {isNaN(currentSale.payment?.ndsTotal) ? '0' : NumberFormat(Math.floor(currentSale.payment?.ndsTotal || 0))} so'm
                        </div>
                        <div className="invoice-customer-detail">
                            <strong>To'lov turi:</strong> {currentSale.payment?.paymentType === 'naqt' ? 'Naqt pul' : 'Bank o\'tkazmasi'}
                        </div>
                        <div className="invoice-customer-detail">
                            <strong>Holati:</strong> {currentSale.payment?.status === 'paid' ? 'To\'langan' : 'Qisman'}
                        </div>
                        {currentSale.payment?.discountReason && (
                            <div className="invoice-customer-detail">
                                <strong>Chegirma sababi:</strong> {currentSale.payment?.discountReason}
                            </div>
                        )}
                        {currentSale.payment?.paymentHistory?.length > 0 && (
                            <div className="invoice-payment-history">
                                <h4 style={{ marginTop: '1rem' }}>To'lov tarixi</h4>
                                {currentSale.payment.paymentHistory.map((history, index) => (
                                    <div key={index} className="invoice-customer-detail">
                                        <strong>To'lov {index + 1}:</strong> {NumberFormat(history.amount)} so'm, {new Date(history.date).toLocaleDateString('uz-UZ')} ({history.paymentType === 'naqt' ? 'Naqt pul' : 'Bank o\'tkazmasi'}, {history.description})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <p>Sotuv ma'lumotlari topilmadi.</p>
                )}
            </Modal>

            <CustomModal
                isOpen={modalState.isEditModalOpen}
                onClose={closeModal}
                refetch={refetch}
                title="Sotuvni tahrirlash"
                editSaleData={editSaleData}
                setEditSaleData={setEditSaleData}
                modalState={modalState}
                formatNumber={formatNumber}
                parseNumber={parseNumber}
                NumberFormat={NumberFormat}
            />

            <Modal
                isOpen={modalState.isDeleteModalOpen}
                onClose={closeModal}
                title="Sotuvni o‘chirish"
                footer={
                    <div className="invoice-modal-footer-buttons">
                        <button
                            className="invoice-btn invoice-btn-danger"
                            onClick={() => confirmDeleteSale(modalState.activeSaleId)}
                        >
                            <Trash2 size={16} />
                            O‘chirish
                        </button>
                        <button
                            className="invoice-btn invoice-btn-secondary"
                            onClick={closeModal}
                        >
                            Bekor qilish
                        </button>
                    </div>
                }
            >
                <p>Sotuvni o‘chirishni tasdiqlaysizmi? Bu amalni bekor qilib bo‘lmaydi!</p>
            </Modal>
        </div>
    );
};

export default SalesInvoiceDashboard;


