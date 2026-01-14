import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './style/style.css';
import IsPaymentModal from './modal/IsPaymentModal';
import { NumberFormat } from '../../../hook/NumberFormat';
import { TbTruckDelivery } from "react-icons/tb";
import { TfiPrinter } from "react-icons/tfi";
import { LuChartColumnIncreasing } from "react-icons/lu";
import CustomModal from './salesPerson/CustomEditModal';
import { toast } from 'react-toastify';
import {
    useDeleteCartSaleMutation,
    useGetFilteredSalesQuery,
    cartSaleApi
} from '../../../context/cartSaleApi';
import ReturnProduct from './modal/ReturnProduct';
import { VscHistory } from "react-icons/vsc";
import DeliveryProduct from './modal/DeliveryProduct';
import PaymentChecklist from './modal/IsPaymentHistory';
import { Button, Modal, Popover } from 'antd';
import { RiFileList3Line } from "react-icons/ri";
import { HiDotsVertical } from "react-icons/hi";
import { Truck as DeliveryIcon, TrendingUp, RotateCcw, Trash2, Edit, ChevronDown, ChevronUp, User, Building2, Phone, Calendar, Package, DollarSign, Truck, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import DeliveryDisplayPrint from './modal/DeliveryDisplayPrintList';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; // Import Redux hooks

const SalesInvoiceDashboard = () => {
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Pagination states
    const [recentSales, setRecentSales] = useState([]);
    const [oldSales, setOldSales] = useState([]);
    const [oldPage, setOldPage] = useState(1);
    const [totalOldCount, setTotalOldCount] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Use RTK Query for initial load (page 1)
    const { data, isLoading: initialLoading } = useGetFilteredSalesQuery({ page: 1, limit: 15 });

    const dispatch = useDispatch(); // For manual RTK dispatches
    const [deleteCartSale, { isLoading: delLoading }] = useDeleteCartSaleMutation();
    const [paymentType, setPaymentType] = useState('naqt');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [editSaleData, setEditSaleData] = useState({});
    const [customerName, setCustomerName] = useState('');
    const [returnItems, setReturnItems] = useState([]);
    const [modalState, setModalState] = useState({
        isPaymentModalOpen: false,
        activeSaleId: null,
        isDeliveryModalOpen: false,
        isHistoryModalOpen: false,
        isDeliveryListOpen: false,
        isDeleteModalOpen: false,
        isEditModalOpen: false,
        activeHistory: [],
        deliveryItems: [],
        deliveryFirms: "",
        isReturnModalOpen: false,
    });

    const { searchQuery } = useSelector((state) => state.search);
    const allSalesData = useMemo(() => [...recentSales, ...oldSales], [recentSales, oldSales]);

    const filteredSalesData = useMemo(() => {
        if (!searchQuery) return allSalesData;
        return allSalesData.filter((customer) =>
            customer.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allSalesData, searchQuery]);

    // Initial data load
    useEffect(() => {
        if (data?.innerData) {
            setRecentSales(data.innerData.recentSales || []);
            setOldSales(data.innerData.oldSales || []);
            setTotalOldCount(data.innerData.totalOldSalesCount || 0);
            setOldPage(1);
        }
    }, [data]);
    setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, 100);
    // Load more bottom: append next page using RTK dispatch
    const loadMoreBottom = useCallback(async () => {
        if (isLoadingMore || oldSales.length >= totalOldCount) return;
        setIsLoadingMore(true);
        const nextPage = oldPage + 1;
        try {
            const result = await dispatch(
                cartSaleApi.endpoints.getFilteredSales.initiate({ page: nextPage, limit: 15 })
            ).unwrap();

            if (result.innerData) {
                setOldSales(prev => [...prev, ...result.innerData.oldSales]);
                setOldPage(nextPage);

                // Yangi ma'lumotlar qo'shilgandan keyin pastga yumshoq scroll
                setTimeout(() => {
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        } catch (error) {
            toast.error("Keyingi ma'lumotlarni yuklashda xatolik!");
        } finally {
            setIsLoadingMore(false);
        }
    }, [oldPage, oldSales.length, totalOldCount, isLoadingMore, dispatch]);
    // Load more top: replace with previous page using RTK dispatch
    const loadMoreTop = useCallback(async () => {
        if (isLoadingMore || oldPage <= 1) return;
        setIsLoadingMore(true);
        const previousPage = oldPage - 1;
        try {
            const result = await dispatch(
                cartSaleApi.endpoints.getFilteredSales.initiate({ page: previousPage, limit: 15 })
            ).unwrap();
            if (result.innerData) {
                setOldSales(result.innerData.oldSales);
                setOldPage(previousPage);
            }
        } catch (error) {
            toast.error("Oldingi ma'lumotlarni yuklashda xatolik!");
        } finally {
            setIsLoadingMore(false);
        }
    }, [oldPage, isLoadingMore, dispatch]);

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

    const formatNumber = (value) => {
        if (value == null || isNaN(value)) return '0';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const closeModal = useCallback(() => {
        setModalState({
            isPaymentModalOpen: false,
            isDeliveryModalOpen: false,
            isHistoryModalOpen: false,
            isDeliveryListOpen: false,
            isDeleteModalOpen: false,
            isEditModalOpen: false,
            isReturnModalOpen: false,
            activeSaleId: null,
            activeHistory: [],
            deliveryItems: [],
            deliveryFirms: "",
        });
        setPaymentAmount('');
        setPaymentType('naqt');
        setReturnItems([]);
        setRefundAmount('');
        setReturnReason('');
    }, []);

    const confirmDeleteSale = async (saleId) => {
        try {
            const sale = allSalesData
                ?.flatMap(sale => sale.history)
                ?.find(h => h._id === saleId)?._id;

            const res = await deleteCartSale(sale);

            if (res?.data?.state === true) {
                toast.success(res?.data?.message || "Sotuv muvaffaqiyatli o'chirildi!");
                // Refetch initial data after delete using RTK
                dispatch(cartSaleApi.util.invalidateTags(['Sale']));
            } else if (res?.data?.state === false) {
                toast.warning(res?.data?.message || "Sotuvni o'chirishda xatolik yuz berdi.");
            } else if (res?.error) {
                toast.error(res?.error?.data?.message || "Xatolik yuz berdi.");
            }

            closeModal();
        } catch (error) {
            console.log("Catch error:", error);
            toast.error(error?.data?.message || "Sotuvni o‘chirishda xatolik yuz berdi.");
        }
    };

    const openHistoryModal = (history) => {
        setModalState(prev => ({
            ...prev,
            isHistoryModalOpen: true,
            activeHistory: history,
        }));
    };

    const openDeliveredListModal = ({ customer, firms }) => {
        setModalState(prev => ({
            ...prev,
            isDeliveryListOpen: true,
            deliveryItems: customer,
            deliveryFirms: firms.name,
        }));
    };

    const openReturnModal = useCallback((saleId) => {
        const sale = allSalesData
            ?.flatMap(sale => sale.history)
            ?.find(h => h._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }

        setCustomerName(sale?.customerId?.name);
        setReturnItems(sale.items.map(item => ({
            ...item,
            returnQuantity: 0,
            selected: false,
        })));
        setRefundAmount('');
        setReturnReason('');
        setModalState(prev => ({ ...prev, isReturnModalOpen: true, activeSaleId: saleId }));
    }, [allSalesData]);

    const parseNumber = (value) => {
        if (!value) return 0;
        const parsed = parseFloat(value.replace(/\./g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    // Simplified: No local computation, just open modal. Data fetched in modal via API.
    const openDeliveryModal = useCallback((saleId) => {
        setModalState(prev => ({ ...prev, isDeliveryModalOpen: true, activeSaleId: saleId }));
    }, []);

    const calculateTotalRefund = useCallback(() => {
        return returnItems.reduce((total, item) => {
            if (item.selected && item.returnQuantity > 0) {
                return total + (item.returnQuantity * (item.discountedPrice || 0));
            }
            return total;
        }, 0);
    }, [returnItems]);

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
    };

    const openEditModal = useCallback((saleId) => {
        const sale = allSalesData
            ?.flatMap(sale => sale.history)
            ?.find(h => h._id === saleId);

        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }
        setEditSaleData(sale);
        setModalState(prev => ({ ...prev, isEditModalOpen: true, activeSaleId: saleId }));
    }, [allSalesData]);

    const getBalanceColor = (status) => {
        return status === 'Qarzdor' ? 'hip-text-red' : 'hip-text-green';
    };

    const currentSale = useMemo(() => {
        return allSalesData.find(s => s._id === modalState.activeSaleId) || null;
    }, [allSalesData, modalState.activeSaleId]);

    const openPaymentModal = useCallback((saleId) => {
        const sale = allSalesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }
        setModalState(prev => ({ ...prev, isPaymentModalOpen: true, activeSaleId: saleId }));
    }, [allSalesData]);

    const processDeleteSale = useCallback((saleId) => {
        setModalState((prev) => ({
            ...prev,
            isDeleteModalOpen: true,
            activeSaleId: saleId,
        }));
    }, []);

    const renderPopoverContent = useCallback((saleId) => (
        <div style={{ display: 'flex', alignItems: 'start', flexDirection: 'column', gap: '8px' }} className="renderPopover">
            <Button
                type="text"
                icon={<Edit size={16} />}
                onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(saleId);
                }}
            >
                Tahrirlash
            </Button>
            <Button
                type="text"
                icon={<Trash2 size={16} />}
                onClick={(e) => {
                    e.stopPropagation();
                    processDeleteSale(saleId);
                }}
            >
                O‘chirish
            </Button>
            <Button
                type="text"
                icon={<RotateCcw size={16} />}
                onClick={(e) => {
                    e.stopPropagation();
                    openReturnModal(saleId);
                }}
            >
                Vazvirat
            </Button>
        </div>
    ), [openEditModal, processDeleteSale, openReturnModal]);

    // Pagination buttons (two-button navigation)
    const renderPaginationButtons = () => (
        <div className="pagination-controls" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            margin: '20px 0' // ixtiyoriy: joy ajratish uchun
        }}>
            <Button
                type="text" // Muhim: "default" o'rniga "text" — fokus scroll qilmaydi
                icon={<ChevronLeft size={16} />}
                onClick={(e) => {
                    e.preventDefault(); // Scroll tepaga chiqmasin
                    loadMoreTop();
                }}
                disabled={oldPage <= 1 || isLoadingMore}
                loading={isLoadingMore && oldPage > 1}
                style={{ display: 'flex', alignItems: 'center' }}
            >
                Oldinga
            </Button>

            <span style={{ fontSize: '14px', color: '#666' }}>
                Sahifa {oldPage} / {Math.ceil(totalOldCount / 15)}
            </span>

            <Button
                type="text" // Muhim: "default" → "text"
                icon={<ChevronRight size={16} />}
                onClick={(e) => {
                    e.preventDefault(); // Scroll tepaga chiqmasin
                    loadMoreBottom();
                }}
                disabled={oldSales.length >= totalOldCount || isLoadingMore}
                loading={isLoadingMore && oldPage < Math.ceil(totalOldCount / 15)}
                style={{ display: 'flex', alignItems: 'center' }}
            >
                Keyingiga
            </Button>
        </div>
    );
    // Backend dan kelgan to'liq statistika (pagination va search ga qaramay)
    const totalCustomers = data?.innerData?.totalCustomers || 0;
    const totalQarzdorAmount = data?.innerData?.totalQarzdorAmount || 0;
    const totalHaqdorAmount = data?.innerData?.totalHaqdorAmount || 0;

    return (
        <div className="hip-container">
            <div className="invoice-stats-grid">
                <div className="invoice-stat-card">
                    <div className="invoice-stat-value">{filteredSalesData?.length}/{totalCustomers}</div>
                    <div className="invoice-stat-label">Jami Mijozlar</div>
                </div>
                <div className="invoice-stat-card">
                    <div className="invoice-stat-value">{NumberFormat(totalHaqdorAmount)}</div>
                    <div className="invoice-stat-label">Haqdor</div>
                </div>
                <div className="invoice-stat-card">
                    <div className="invoice-stat-value">{NumberFormat(totalQarzdorAmount)}</div>
                    <div className="invoice-stat-label">Qarzdor</div>
                </div>
            </div>



            <div className="hip-table-wrapper">
                <table className="hip-table" aria-label="Sales Invoice Table">
                    <thead>
                        <tr>
                            {/* <th className="hip-th" scope="col">№</th> */}
                            <th className="hip-th" scope="col"></th>
                            <th className="hip-th" scope="col">
                                <div className="hip-header-content">
                                    <User className="hip-icon-sm" aria-hidden="true" />
                                    Mijoz
                                </div>
                            </th>
                            <th className="hip-th" scope="col">
                                <div className="hip-header-content">
                                    <Phone className="hip-icon-sm" aria-hidden="true" />
                                    Telefon
                                </div>
                            </th>
                            <th className="hip-th" scope="col">
                                <div className="hip-header-content">
                                    <DollarSign className="hip-icon-sm" aria-hidden="true" />
                                    Balans
                                </div>
                            </th>
                            <th className="hip-th" scope="col">
                                <div className="hip-header-content">
                                    <DollarSign className="hip-icon-sm" aria-hidden="true" />
                                    To'lov / Tarix
                                </div>
                            </th>
                            <th className="hip-th" scope="col">
                                <div className="hip-header-content">
                                    <DeliveryIcon className="hip-icon-sm" aria-hidden="true" />
                                    Yuborish
                                </div>
                            </th>
                            <th className="hip-th" scope="col">
                                <div className="hip-header-content">
                                    <RiFileList3Line className="hip-icon-sm" aria-hidden="true" />
                                    Yuk xatlari
                                </div>
                            </th>
                            <th className="hip-th" scope="col">
                                <div className="hip-header-content">
                                    <Package className="hip-icon-sm" aria-hidden="true" />
                                    Savdolar
                                </div>
                            </th>
                            <th className="hip-th" scope="col">
                                <div className="hip-header-content">
                                    <TrendingUp className="hip-icon-sm" aria-hidden="true" />
                                    Ko‘rsatkich
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialLoading || isLoadingMore ? (
                            <tr>

                                <td colSpan="10" className="loading-hip-td">
                                    <div className="loading-container">
                                        <div className="loading-spinner-wrapper">
                                            <div className="loading-spinner"></div>
                                            <div className="loading-inner-circle"></div>
                                        </div>
                                        <div className="loading-dots">
                                            <div className="loading-dot loading-dot-1"></div>
                                            <div className="loading-dot loading-dot-2"></div>
                                            <div className="loading-dot loading-dot-3"></div>
                                        </div>
                                        <div>
                                            <p className="loading-text">Ma'lumotlar yuklanmoqda</p>
                                            <div className="loading-text-dots">
                                                <span className="loading-text-dot"></span>
                                                <span className="loading-text-dot"></span>
                                                <span className="loading-text-dot"></span>
                                            </div>
                                        </div>
                                        <div className="loading-progress">
                                            <div className="loading-progress-bar">
                                                <div className="loading-progress-shine"></div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredSalesData.length === 0 ? (
                            <tr>

                                <td colSpan="10" className="hip-td">
                                    <div className="empty-state-container">
                                        <div className="empty-state-icon-wrapper">
                                            <User className="empty-state-icon" />
                                            <div className="pulse-ring pulse-ring-1"></div>
                                            <div className="pulse-ring pulse-ring-2"></div>
                                        </div>
                                        <div className="empty-state-content">
                                            <h3 className="empty-state-title">Mijozlar topilmadi</h3>
                                            <p className="empty-state-description">
                                                Hozircha ro'yxatda mijozlar mavjud emas.
                                                Yangi mijozlar qo'shilgandan so'ng ular shu yerda ko'rinadi.
                                            </p>
                                        </div>
                                        <div className="empty-state-suggestion">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                            </svg>
                                            <span>Boshqa filtrlar bilan qidiring</span>
                                        </div>
                                        <div className="floating-elements">
                                            <div className="floating-dot floating-dot-1"></div>
                                            <div className="floating-dot floating-dot-2"></div>
                                            <div className="floating-dot floating-dot-3"></div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredSalesData.map((customer, inx) => {
                                const totalHistoryAmount = customer.history
                                    ? customer.history.reduce((sum, historyItem) => sum + (historyItem.payment?.totalAmount || 0), 0)
                                    : 0;

                                return (
                                    <React.Fragment key={inx}>
                                        <tr
                                            className="hip-tr"
                                            onClick={() => toggleRow(customer._id)}
                                            role="button"
                                            aria-expanded={expandedRows.has(customer._id)}
                                        >
                                            {/* <td className="hip-td hip-td-number"> {inx + 1}</td> */}
                                            <td className="hip-td-expand">
                                                {customer.history && customer.history.length > 0 ? (
                                                    expandedRows.has(customer._id) ? (
                                                        <ChevronUp className="hip-icon-sm hip-expand-icon" aria-label="Collapse row" />
                                                    ) : (
                                                        <ChevronDown className="hip-icon-sm hip-expand-icon" aria-label="Expand row" />
                                                    )
                                                ) : (
                                                    <div className="hip-icon-sm"></div>
                                                )}
                                            </td>
                                            <td className="hip-td">
                                                <div className="hip-customer-info">
                                                    <div className="hip-customer-header">
                                                        {customer.type === 'company' ? (
                                                            <Building2 className="hip-icon-xs hip-type-icon" aria-hidden="true" />
                                                        ) : (
                                                            <User className="hip-icon-xs hip-type-icon" aria-hidden="true" />
                                                        )}
                                                        <span className="hip-customer-name">{customer.name}</span>
                                                    </div>
                                                    <div className="hip-address">
                                                        <MapPin className="hip-icon-xs" aria-hidden="true" />
                                                        {customer.companyAddress}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hip-td">
                                                <span className="hip-phone">{customer.phone}</span>
                                            </td>
                                            <td className="hip-td">
                                                <div className="hip-balance-info">
                                                    <span className={`hip-balance ${getBalanceColor(customer.balansStatus)}`}>
                                                        {formatCurrency(Math.abs(customer.balans) || 0)}
                                                    </span>
                                                    <span className="hip-status">{customer.balansStatus}</span>
                                                </div>
                                            </td>
                                            <td className="hip-td">
                                                <div className="hip-td-box">
                                                    <button
                                                        className="invoice-btn-primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openPaymentModal(customer._id);
                                                        }}
                                                        aria-label={`To'lov qilish uchun ${customer.name}`}
                                                    >
                                                        To'lash
                                                    </button>
                                                    <button
                                                        type="primary"
                                                        disabled={customer.Expenses?.length === 0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openHistoryModal(customer.Expenses)
                                                        }}
                                                        aria-label={`Yetkazib berish uchun ${customer.name}`}
                                                        className="invoice-btn-VscHistory"
                                                    ><VscHistory />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="hip-td">
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <Button
                                                        type="primary"
                                                        icon={<DeliveryIcon size={16} />}
                                                        disabled={customer.totalUndelivered === 0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeliveryModal(customer._id) // Now fetches data in modal via API
                                                        }}
                                                        aria-label={`Yetkazib berish uchun ${customer.name}`}
                                                        className="invoice-btn-delivery"
                                                    >
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="hip-td">
                                                <div className="hip-td-box">
                                                    <button
                                                        type="primary"
                                                        disabled={customer.groupedDeliveredItems?.length === 0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeliveredListModal({ customer: customer.groupedDeliveredItems, firms: customer })
                                                        }}
                                                        aria-label={`Yetkazib berish uchun ${customer.name}`}
                                                        className="invoice-btn-VscPrint"
                                                    ><TfiPrinter />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="hip-td">
                                                <div className="hip-balance-info">
                                                    <span className="hip-history-count">
                                                        {customer.history ? customer.history.length : 0} ta savdo
                                                    </span>
                                                    <span className="hip-history-count">{customer.totalUndelivered} <TbTruckDelivery style={{ fontSize: "16px", marginLeft: "15px" }} /></span>
                                                </div>
                                            </td>
                                            <td className="hip-td">
                                                <div className="hip-td-box-chart">
                                                    <Link className="invoice-btn-Vsc-chart" to={`/customer/${customer._id}`}>
                                                        <LuChartColumnIncreasing />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRows.has(customer._id) && customer.history && (
                                            <>
                                                {customer.history.map((historyItem, inx) => (
                                                    <tr key={inx} className="hip-history-row">
                                                        <td colSpan="10" className="hip-history-td">
                                                            <div className="hip-history-content">
                                                                <div className="hip-history-header">
                                                                    <div>
                                                                        <div className="hip-history-date">
                                                                            <User className="hip-icon-xs" aria-hidden="true" />
                                                                            {historyItem.salesperson}
                                                                        </div>
                                                                        <div className="hip-history-date">
                                                                            <Calendar className="hip-icon-xs" aria-hidden="true" />
                                                                            {historyItem.date}
                                                                        </div>
                                                                    </div>
                                                                    <div className="hip-payment-summary">
                                                                        <div className="hip-payment-item">
                                                                            <span className="hip-label">Jami:</span>
                                                                            <span className="hip-value">{formatCurrency(historyItem.payment.totalAmount)}</span>
                                                                        </div>
                                                                        {/*   <div className="hip-payment-item">
                                                                            <span className="hip-label">Qarz:</span>
                                                                            <span className="hip-value hip-text-red">{formatCurrency(historyItem.payment.debt)}</span>
                                                                            </div>*/}
                                                                        <div className="hip-payment-item">
                                                                            <span className="hip-label">NDS (12%):</span>
                                                                            <span className="hip-value">{formatCurrency(historyItem.payment.ndsTotal)}</span>
                                                                        </div>
                                                                        {
                                                                            historyItem.payment.middlemanPayment > 0 &&
                                                                            <div className="hip-payment-item">
                                                                                <span className="hip-label">Broker hizmati:</span>
                                                                                <span className="hip-value  hip-text-red">{formatCurrency(historyItem.payment.middlemanPayment)}</span>
                                                                            </div>
                                                                        }
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <Popover
                                                                                content={renderPopoverContent(historyItem._id)}
                                                                                title="Amallar"
                                                                                trigger="click"
                                                                                placement="left"
                                                                            >
                                                                                <Button className="Popoverinrowbtn" type="text" icon={<HiDotsVertical size={19} />} />
                                                                            </Popover>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="hip-combined-section">
                                                                    <h4 className="hip-subsection-title">Buyurtma va Yetkazib berish</h4>
                                                                    {historyItem.items && historyItem.items.map((item, idx) => {
                                                                        const deliveredItem = historyItem.deliveredItems?.find(
                                                                            (delItem) => delItem.productId === item.productId
                                                                        ) || {};

                                                                        return (
                                                                            <div key={idx} className="hip-product-item">
                                                                                <div className="hip-product-header">
                                                                                    <Package className="hip-icon-xs" aria-hidden="true" />
                                                                                    <span className="hip-product-name">{item.productName}</span>
                                                                                </div>
                                                                                <div className="hip-detail">
                                                                                    <span className="hip-label">Miqdori:</span>
                                                                                    <span className="hip-value">{item.quantity} {item.size}</span>
                                                                                </div>
                                                                                <div className="hip-detail">
                                                                                    <span className="hip-label">Sotish narxi:</span>
                                                                                    <span className="hip-value">{formatCurrency(item.sellingPrice)}</span>
                                                                                </div>
                                                                                <div className="hip-detail">
                                                                                    <span className="hip-label">Yetkazilgan:</span>
                                                                                    <span className="hip-value">{deliveredItem.deliveredQuantity || 0} dona</span>
                                                                                </div>
                                                                                {deliveredItem.transport && (
                                                                                    <div className="hip-detail">
                                                                                        <Truck className="hip-icon-xs" aria-hidden="true" />
                                                                                        <span className="hip-value">{deliveredItem.transport}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="hip-history-footer">
                                                    <td colSpan="10" className="hip-history-td">
                                                        <div className="hip-footer-content">
                                                            <span className="hip-label">Barcha savdolar jami:</span>
                                                            <span className="hip-value hip-text-bold">{formatCurrency(totalHistoryAmount)}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
                {/* Pagination controls */}
                {totalOldCount > 0 && renderPaginationButtons()}
            </div>

            {/* Pagination controls (bottom) */}
            {totalOldCount > 0 && renderPaginationButtons()}

            {modalState.isDeliveryModalOpen && (
                <DeliveryProduct
                    // Removed: deliveryItems prop (now fetched inside modal)
                    // Removed: handleDeliveryItemChange prop (now local to modal)
                    closeModal={closeModal}
                    modalState={modalState}
                />
            )}
            {modalState.isHistoryModalOpen && (
                <PaymentChecklist
                    closeModal={closeModal}
                    modalState={modalState}
                />
            )}
            {modalState.isDeliveryListOpen && (
                <DeliveryDisplayPrint
                    closeModal={closeModal}
                    modalState={modalState}
                />
            )}
            {modalState.isPaymentModalOpen && (
                <IsPaymentModal
                    modalState={modalState}
                    closeModal={closeModal}
                    currentSale={currentSale}
                    paymentType={paymentType}
                    setPaymentType={setPaymentType}
                    paymentAmount={paymentAmount}
                    setPaymentAmount={setPaymentAmount}
                    salesData={allSalesData}
                    setSalesData={() => { }} // No longer needed, but kept for compatibility
                />
            )}
            {modalState.isReturnModalOpen && (
                <ReturnProduct
                    modalState={modalState}
                    customerName={customerName}
                    returnItems={returnItems}
                    handleReturnItemChange={handleReturnItemChange}
                    returnReason={returnReason}
                    setModalState={setModalState}
                    setReturnReason={setReturnReason}
                    paymentType={paymentType}
                    setPaymentType={setPaymentType}
                    NumberFormat={NumberFormat}
                    refundAmount={refundAmount}
                    setRefundAmount={setRefundAmount}
                    calculateTotalRefund={calculateTotalRefund}
                    onClose={closeModal}
                />
            )}
            <Modal
                open={modalState.isDeleteModalOpen}
                onCancel={closeModal}
                title="Sotuvni o‘chirish"
                footer={
                    <div className="invoice-modal-footer-buttons">
                        <Button
                            className="invoice-btn invoice-btn-danger"
                            onClick={() => confirmDeleteSale(modalState.activeSaleId)}
                            loading={delLoading}
                            disabled={delLoading}
                        >
                            O‘chirish
                        </Button>
                        <Button
                            className="invoice-btn invoice-btn-secondary"
                            onClick={closeModal}
                            aria-label="Cancel"
                        >
                            Bekor qilish
                        </Button>
                    </div>
                }
            >
                <p>Sotuvni o‘chirishni tasdiqlaysizmi? Bu amalni bekor qilib bo‘lmaydi!</p>
            </Modal>
            <CustomModal
                isOpen={modalState.isEditModalOpen}
                onClose={closeModal}
                refetch={() => { }} // Adapt if needed
                title="Sotuvni tahrirlash"
                editSaleData={editSaleData}
                setEditSaleData={setEditSaleData}
                modalState={modalState}
                formatNumber={formatNumber}
                parseNumber={parseNumber}
                NumberFormat={NumberFormat}
            />
        </div>
    );
};

export default SalesInvoiceDashboard;


