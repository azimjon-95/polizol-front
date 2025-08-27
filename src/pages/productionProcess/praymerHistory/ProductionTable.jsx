import React, { useState } from 'react';
import {
    Package,
    Calendar,
    TrendingUp,
    DollarSign,
    Hash,
    BarChart3,
    Calculator,
    Box,
    Tag,
    Layers,
    Eye,
    X,
    FileText,
    Wrench,
    ShoppingBag
} from 'lucide-react';
import { useGetOneMonthDataQuery } from '../../../context/praymerApi';
import './style.css';

const ProductionTable = ({ startDate, endDate }) => {
    const { data: productions, isLoading, error } = useGetOneMonthDataQuery({ startDate, endDate });
    const [selectedProduction, setSelectedProduction] = useState(null);
    const [modalType, setModalType] = useState(null); // 'items' or 'totals'

    if (isLoading || error) {
        return (
            <div className="pry-loading-container">
                <div className="pry-loading-spinner"></div>
                <p className="pry-loading-text">Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ', {
            style: 'currency',
            currency: 'UZS',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const openModal = (production, type) => {
        setSelectedProduction(production);
        setModalType(type);
    };

    const closeModal = () => {
        setSelectedProduction(null);
        setModalType(null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, '0'); // 2 xonali kun
        const time = date.toLocaleTimeString('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `${day} , ${time}`;
    };

    return (
        <div className="pry-table-wrapper">
            <div className="pry-table-container">
                <table className="pry-table">
                    <thead className="pry-table-head">
                        <tr>
                            <th>
                                <span className="pry-th">
                                    <Calendar className="pry-th-icon" />
                                    Sana
                                </span>
                            </th>
                            <th>
                                <span className="pry-th">
                                    <Hash className="pry-th-icon" />
                                    Nomi
                                </span>
                            </th>
                            <th>
                                <span className="pry-th">
                                    <Package className="pry-th-icon" />
                                    Miqdor
                                </span>
                            </th>
                            <th>
                                <span className="pry-th">
                                    <TrendingUp className="pry-th-icon" />
                                    Foyda %
                                </span>
                            </th>
                            <th>
                                <span className="pry-th">
                                    <DollarSign className="pry-th-icon" />
                                    Sotuv narxi
                                </span>
                            </th>
                            <th>
                                <span className="pry-th">
                                    <Calculator className="pry-th-icon" />
                                    Umumiy xarajat
                                </span>
                            </th>
                            <th>
                                <span className="pry-th">
                                    <Box className="pry-th-icon" />
                                    Umumiy foyda
                                </span>
                            </th>

                            <th>
                                <span className="pry-th">
                                    <Eye className="pry-th-icon" />
                                    Amallar
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="pry-table-body">
                        {productions?.innerData?.map((production) => (
                            <tr key={production._id} className="pry-table-row">
                                <td className="pry-td">
                                    <div className="pry-date-cell">
                                        <Calendar className="pry-cell-icon" />
                                        <span className="pry-date-text">
                                            {formatDate(production.createdAt)}
                                        </span>
                                    </div>
                                </td>
                                <td className="pry-td pry-td-id">
                                    <div className="pry-id-cell">
                                        <Tag className="pry-cell-icon" />
                                        <span className="pry-id-text">
                                            {production.productionName || "Praymer - BIPRO"}
                                        </span>
                                    </div>
                                </td>
                                <td className="pry-td">
                                    <div className="pry-quantity-cell">
                                        <Layers className="pry-cell-icon" />
                                        <span className="pry-quantity-text">
                                            {production.productionQuantity}
                                        </span>
                                    </div>
                                </td>
                                <td className="pry-td">
                                    <div className="pry-profit-cell">
                                        <TrendingUp className="pry-cell-icon pry-profit-icon" />
                                        <span className="pry-profit-text">
                                            {production.profitPercent.toFixed(2)}%
                                        </span>
                                    </div>
                                </td>
                                <td className="pry-td">
                                    <div className="pry-price-cell">
                                        <DollarSign className="pry-cell-icon" />
                                        <span className="pry-price-text">
                                            {formatCurrency(production.salePricePerBucket)}
                                        </span>
                                    </div>
                                </td>
                                <td className="pry-td">
                                    <div className="pry-cost-cell">
                                        <Calculator className="pry-cell-icon" />
                                        <span className="pry-cost-text">
                                            {formatCurrency(production.totals.costAll)}
                                        </span>
                                    </div>
                                </td>
                                <td className="pry-td">
                                    <div className="pry-total-profit-cell">
                                        <Box className="pry-cell-icon pry-profit-icon" />
                                        <span className="pry-total-profit-text">
                                            {formatCurrency(production.totals.profitAll)}
                                        </span>
                                    </div>
                                </td>
                                <td className="pry-td">
                                    <div className="pry-actions-cell">
                                        <button
                                            className="pry-action-btn pry-items-btn"
                                            onClick={() => openModal(production, 'items')}
                                            title="Mahsulotlar ro'yxati"
                                        >
                                            <FileText className="pry-btn-icon" />
                                            Items ({production.items?.length || 0})
                                        </button>
                                        <button
                                            className="pry-action-btn pry-totals-btn"
                                            onClick={() => openModal(production, 'totals')}
                                            title="Umumiy hisoblar"
                                        >
                                            <Calculator className="pry-btn-icon" />
                                            Totals
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selectedProduction && modalType && (
                <div className="pry-modal-overlay" onClick={closeModal}>
                    <div className="pry-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="pry-modal-header">
                            <h3 className="pry-modal-title">
                                {modalType === 'items' ? (
                                    <>
                                        <FileText className="pry-modal-icon" />
                                        Mahsulotlar ro'yxati
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="pry-modal-icon" />
                                        Umumiy hisoblar
                                    </>
                                )}
                            </h3>
                            <button className="pry-modal-close" onClick={closeModal}>
                                <X className="pry-close-icon" />
                            </button>
                        </div>

                        <div className="pry-modal-body">
                            {modalType === 'items' && (
                                <div className="pry-items-grid">
                                    {selectedProduction.items?.map((item, index) => (
                                        <div key={item._id || index} className="pry-item-card">
                                            <div className="pry-item-header">
                                                <div className="pry-item-name">
                                                    {item.isMaterial ? (
                                                        <Wrench className="pry-item-type-icon pry-material-icon" />
                                                    ) : (
                                                        <ShoppingBag className="pry-item-type-icon pry-product-icon" />
                                                    )}
                                                    <span className="pry-item-title">{item.name}</span>
                                                </div>
                                                <div className="pry-item-id">#{item.id}</div>
                                            </div>

                                            <div className="pry-item-details">
                                                <div className="pry-item-row">
                                                    <span className="pry-item-label">Birlik:</span>
                                                    <span className="pry-item-value">{item.unit}</span>
                                                </div>
                                                <div className="pry-item-row">
                                                    <span className="pry-item-label">Miqdor:</span>
                                                    <span className="pry-item-value">{item.baseQty}</span>
                                                </div>
                                                <div className="pry-item-row">
                                                    <span className="pry-item-label">Narx:</span>
                                                    <span className="pry-item-value pry-price-highlight">
                                                        {formatCurrency(item.baseQiymat)}
                                                    </span>
                                                </div>
                                                <div className="pry-item-row">
                                                    <span className="pry-item-label">Turi:</span>
                                                    <span className={`pry-item-badge ${item.isMaterial ? 'pry-material-badge' : 'pry-product-badge'}`}>
                                                        {item.isMaterial ? 'Material' : 'Mahsulot'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {modalType === 'totals' && selectedProduction.totals && (
                                <div className="pry-totals-grid">
                                    <div className="pry-total-card">
                                        <div className="pry-total-icon-wrapper pry-cost-bg">
                                            <Calculator className="pry-total-icon" />
                                        </div>
                                        <div className="pry-total-info">
                                            <div className="pry-total-label">Umumiy xarajat</div>
                                            <div className="pry-total-value">{formatCurrency(selectedProduction.totals.costAll)}</div>
                                        </div>
                                    </div>

                                    <div className="pry-total-card">
                                        <div className="pry-total-icon-wrapper pry-margin-bg">
                                            <TrendingUp className="pry-total-icon" />
                                        </div>
                                        <div className="pry-total-info">
                                            <div className="pry-total-label">Foyda (birlik)</div>
                                            <div className="pry-total-value">{formatCurrency(selectedProduction.totals.marginPerBucket)}</div>
                                        </div>
                                    </div>

                                    <div className="pry-total-card">
                                        <div className="pry-total-icon-wrapper pry-profit-bg">
                                            <Box className="pry-total-icon" />
                                        </div>
                                        <div className="pry-total-info">
                                            <div className="pry-total-label">Umumiy foyda</div>
                                            <div className="pry-total-value pry-profit-highlight">{formatCurrency(selectedProduction.totals.profitAll)}</div>
                                        </div>
                                    </div>

                                    <div className="pry-total-card">
                                        <div className="pry-total-icon-wrapper pry-sale-bg">
                                            <DollarSign className="pry-total-icon" />
                                        </div>
                                        <div className="pry-total-info">
                                            <div className="pry-total-label">Umumiy sotuv</div>
                                            <div className="pry-total-value">{formatCurrency(selectedProduction.totals.saleAll)}</div>
                                        </div>
                                    </div>

                                    <div className="pry-total-card">
                                        <div className="pry-total-icon-wrapper pry-tannarx-bg">
                                            <Package className="pry-total-icon" />
                                        </div>
                                        <div className="pry-total-info">
                                            <div className="pry-total-label">Tannarx (umumiy)</div>
                                            <div className="pry-total-value">{formatCurrency(selectedProduction.totals.tannarxAll)}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionTable;
