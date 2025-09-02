import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './style/style.css';
import IsPaymentModal from './modal/IsPaymentModal';
import { NumberFormat } from '../../../hook/NumberFormat';
import { TbTruckDelivery } from "react-icons/tb";
import { TfiPrinter } from "react-icons/tfi";
import CustomModal from './salesPerson/CustomEditModal';
import { toast } from 'react-toastify';
import {
    useDeleteCartSaleMutation,
    useGetFilteredSalesQuery
} from '../../../context/cartSaleApi';
import ReturnProduct from './modal/ReturnProduct';
import { VscHistory } from "react-icons/vsc";
import DeliveryProduct from './modal/DeliveryProduct';
import PaymentChecklist from './modal/IsPaymentHistory';
import { Button, Modal, Popover } from 'antd';
import { RiFileList3Line } from "react-icons/ri";
import { HiDotsVertical } from "react-icons/hi";
import { Truck as DeliveryIcon, RotateCcw, Trash2, Edit, ChevronDown, ChevronUp, User, Building2, Phone, Calendar, Package, DollarSign, Truck, MapPin } from 'lucide-react';
import DeliveryDisplayPrint from './modal/DeliveryDisplayPrintList';



const SalesInvoiceDashboard = () => {
    const [expandedRows, setExpandedRows] = useState(new Set());
    const { data, isLoading } = useGetFilteredSalesQuery();
    const [salesData, setSalesData] = useState([]);
    const [deleteCartSale, { isLoading: delLoading }] = useDeleteCartSaleMutation();
    const [paymentType, setPaymentType] = useState('naqt');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [editSaleData, setEditSaleData] = useState({});
    const [customerName, setCustomerName] = useState('');
    const [returnItems, setReturnItems] = useState([]);
    const [deliveryItems, setDeliveryItems] = useState([]);
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
    const { data: filteredSales, refetch } = useGetFilteredSalesQuery();
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
            const sale = salesData
                ?.flatMap(sale => sale.history)
                ?.find(h => h._id === saleId)?._id;

            const res = await deleteCartSale(sale);
            console.log("Delete response:", res);

            if (res?.data?.state === true) {
                toast.success(res?.data?.message || "Sotuv muvaffaqiyatli o'chirildi!");
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
    }


    const openDeliveredListModal = ({ customer, firms }) => {
        setModalState(prev => ({
            ...prev,
            isDeliveryListOpen: true,
            deliveryItems: customer,
            deliveryFirms: firms.name,
        }));
    }

    const openReturnModal = useCallback((saleId) => {
        const sale = salesData
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
    }, [salesData]);

    const parseNumber = (value) => {
        if (!value) return 0;
        const parsed = parseFloat(value.replace(/\./g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };
    const openDeliveryModal = useCallback((saleId) => {
        const sale = salesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }

        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Tashkent' };
        const defaultDate = new Intl.DateTimeFormat('uz-UZ', options).format(now);

        // 1) Aggregate all order items across all history entries
        const allOrderItems = sale.history.reduce((acc, hist, histIndex) => {
            if (!hist || !hist.items || !Array.isArray(hist.items)) {
                // console.warn(`History entry at index ${histIndex} (date: ${hist?.date || 'unknown'}) has no valid items array`);
                return acc;
            }
            hist.items.forEach((item, itemIndex) => {
                if (!item.productName || item.quantity === undefined) {
                    // console.warn(`Invalid item at history index ${histIndex}, item index ${itemIndex}:`, item);
                    return;
                }
                const pid = item.productId || `${item.productName}-${hist.date || defaultDate}-${histIndex}`;
                acc.push({
                    productId: pid,
                    productName: item.productName,
                    quantity: Number(item.quantity) || 0,
                    sellingPrice: Number(item.sellingPrice) || 0,
                    size: item.size || 'dona',
                    historyDate: hist.date || defaultDate,
                    discountedPrice: item.discountedPrice,
                    transport: hist.deliveredItems?.find(di =>
                        (di.productId || `${di.productName}-${hist.date || defaultDate}-${histIndex}`) === pid
                    )?.transport || '',
                });
            });
            return acc;
        }, []);

        // 2) Calculate total delivered quantities per product
        const deliveredMap = sale.history.reduce((acc, hist, histIndex) => {
            if (!hist || !hist.deliveredItems || !Array.isArray(hist.deliveredItems)) {
                return acc;
            }
            hist.deliveredItems.forEach((di, diIndex) => {
                if (!di.productName && !di.productId) {
                    return;
                }
                const pid = di.productId || `${di.productName}-${hist.date || defaultDate}-${histIndex}`;
                const qty = Number(di.deliveredQuantity) || 0;
                acc[pid] = (acc[pid] || 0) + qty;
            });
            return acc;
        }, {});

        // 3) Calculate remaining quantities and filter undelivered items
        const remainingItems = allOrderItems
            .map(item => {
                const pid = item.productId;
                const deliveredQty = deliveredMap[pid] || 0;
                const remainingQty = Math.max(0, item.quantity - deliveredQty);

                const result = {
                    productName: item.productName,
                    quantity: item.quantity,
                    deliveredQuantity: deliveredQty,
                    remainingQuantity: remainingQty,
                    sellingPrice: item.sellingPrice,
                    size: item.size,
                    discountedPrice: item.discountedPrice,
                    productId: item.productId,
                    pricePerUnit: item.sellingPrice,
                    historyDate: item.historyDate,
                    transport: item.transport,
                    deliveryQuantity: 0, // For UI
                    selected: false,
                };

                return result;
            })
            .filter(item => {
                if (item.remainingQuantity > 0) return true;
                return false;
            });

        setDeliveryItems(remainingItems);
        setModalState(prev => ({ ...prev, isDeliveryModalOpen: true, activeSaleId: saleId }));
    }, [salesData]);

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


    useEffect(() => {
        if (data?.innerData) {
            setSalesData(data.innerData);
        }
    }, [data]);

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
        // History ichidan mos keladigan sale topish
        const sale = salesData
            ?.flatMap(sale => sale.history)
            ?.find(h => h._id === saleId);

        if (!sale) {
            toast.error("Sotuv topilmadi!");
            return;
        }
        setEditSaleData(sale);
        setModalState(prev => ({ ...prev, isEditModalOpen: true, activeSaleId: saleId }));
    }, [salesData]);

    const getBalanceColor = (status) => {
        return status === 'Qarzdor' ? 'hip-text-red' : 'hip-text-green';
    };

    const currentSale = useMemo(() => {
        return salesData.find(s => s._id === modalState.activeSaleId) || null;
    }, [salesData, modalState.activeSaleId]);

    const openPaymentModal = useCallback((saleId) => {
        const sale = salesData.find(s => s._id === saleId);
        if (!sale) {
            toast.error("Sotuv topilmadsssi!");
            return;
        }
        setModalState(prev => ({ ...prev, isPaymentModalOpen: true, activeSaleId: saleId }));
    }, [salesData]);
    const totalDebtAmount = salesData?.filter((i) => i.balansStatus === "Qarzdor")?.reduce((sum, sale) => sum + (sale.balans || 0), 0);
    const totalHaqdorAmount = salesData?.filter((i) => i.balansStatus === "Haqdor")?.reduce((sum, sale) => sum + (sale.balans || 0), 0);


    // Ensure processDeleteSale is correctly setting the modal state
    const processDeleteSale = useCallback((saleId) => {
        setModalState((prev) => ({
            ...prev,
            isDeleteModalOpen: true,
            activeSaleId: saleId,
        }));
    }, []); // No dependencies since setModalState is stable

    // Memoize the renderPopoverContent function to prevent unnecessary re-renders
    const renderPopoverContent = useCallback((saleId) => (
        <div style={{ display: 'flex', alignItems: 'start', flexDirection: 'column', gap: '8px' }} className="renderPopover">
            <Button
                type="text"
                icon={<Edit size={16} />}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    openEditModal(saleId);
                }}
            >
                Tahrirlash
            </Button>
            <Button
                type="text"
                icon={<Trash2 size={16} />}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    processDeleteSale(saleId);
                }}
            >
                O‘chirish
            </Button>
            <Button
                type="text"
                icon={<RotateCcw size={16} />}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    openReturnModal(saleId);
                }}
            >
                Vazvirat
            </Button>
        </div>
    ), [openEditModal, processDeleteSale, openReturnModal]); // Dependencies for useCallback


    return (
        <div className="hip-container">
            <div className="invoice-stats-grid">
                <div className="invoice-stat-card">
                    <div className="invoice-stat-value">{salesData.length}</div>
                    <div className="invoice-stat-label">Jami Mijozlar</div>
                </div>
                <div className="invoice-stat-card">
                    <div className="invoice-stat-value">{NumberFormat(totalHaqdorAmount)}</div>
                    <div className="invoice-stat-label">Haqdor</div>
                </div>
                <div className="invoice-stat-card">
                    <div className="invoice-stat-value">{NumberFormat(totalDebtAmount)}</div>
                    <div className="invoice-stat-label">Qarzdor</div>
                </div>
            </div>

            <div className="hip-table-wrapper">
                <table className="hip-table" aria-label="Sales Invoice Table">
                    <thead>
                        <tr>
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

                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="5" className="hip-td">Yuklanmoqda...</td>
                            </tr>
                        ) : salesData.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="hip-td">Ma'lumotlar topilmadi.</td>
                            </tr>
                        ) : (
                            salesData.map((customer) => {
                                const totalHistoryAmount = customer.history
                                    ? customer.history.reduce((sum, historyItem) => sum + (historyItem.payment?.totalAmount || 0), 0)
                                    : 0;

                                return (
                                    <React.Fragment key={customer._id}>
                                        <tr
                                            className="hip-tr"
                                            onClick={() => toggleRow(customer._id)}
                                            role="button"
                                            aria-expanded={expandedRows.has(customer._id)}
                                        >
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
                                                    {/* {customer.companyAddress && ( */}
                                                    <div className="hip-address">
                                                        <MapPin className="hip-icon-xs" aria-hidden="true" />
                                                        {customer.companyAddress}
                                                    </div>
                                                    {/* )} */}
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
                                                            openDeliveryModal(customer._id)
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

                                        </tr>
                                        {expandedRows.has(customer._id) && customer.history && (
                                            <>
                                                {customer.history.map((historyItem, inx) => (
                                                    <tr key={inx} className="hip-history-row">
                                                        <td colSpan="8" className="hip-history-td">
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
                                                                        <div className="hip-payment-item">
                                                                            <span className="hip-label">To'langan:</span>
                                                                            <span className="hip-value hip-text-green">{formatCurrency(historyItem.payment.paidAmount)}</span>
                                                                        </div>
                                                                        <div className="hip-payment-item">
                                                                            <span className="hip-label">Qarz:</span>
                                                                            <span className="hip-value hip-text-red">{formatCurrency(historyItem.payment.debt)}</span>
                                                                        </div>
                                                                        <div className="hip-payment-item">
                                                                            <span className="hip-label">NDS (12%):</span>
                                                                            <span className="hip-value">{formatCurrency(historyItem.payment.ndsTotal)}</span>
                                                                        </div>
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
                                                    <td colSpan="8" className="hip-history-td">
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
            </div>
            {modalState.isDeliveryModalOpen && (
                <DeliveryProduct
                    deliveryItems={deliveryItems}
                    handleDeliveryItemChange={handleDeliveryItemChange}
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
                    salesData={salesData}
                    setSalesData={setSalesData}
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
                open={modalState.isDeleteModalOpen} // Use 'open' instead of 'isOpen' for antd Modal
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
                refetch={refetch}
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