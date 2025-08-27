import React, { useState } from 'react';
import {
    Package,
    Calendar,
    Zap,
    Flame,
    DollarSign,
    FileText,
    Plus,
    Truck,
    ChevronDown,
    ChevronRight,
    Factory,
    Weight,
    Box,
    Cable
} from 'lucide-react';
import { useGetInventoryQuery } from '../../../context/productionApi';
import './style.css';

const InventoryTable = ({ startDate, endDate }) => {
    const [expandedRows, setExpandedRows] = useState(new Set());
    const { data, error, isLoading } = useGetInventoryQuery({ startDate, endDate });
    const inventoryData = data?.innerData;

    // Calculate totals for BN-5, Mel, Electricity, Gas, and Selling Price
    const totals = inventoryData?.reduce(
        (acc, record) => ({
            bn5Amount: acc.bn5Amount + (record.bn5Amount || 0),
            melAmount: acc.melAmount + (record.melAmount || 0),
            electricity: acc.electricity + (record.electricity || 0),
            gasAmount: acc.gasAmount + (record.gasAmount || 0),
            sellingPrice: acc.sellingPrice + (record.sellingPrice || 0),
        }),
        { bn5Amount: 0, melAmount: 0, electricity: 0, gasAmount: 0, sellingPrice: 0 }
    ) || {};

    const toggleRowExpansion = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const datePart = date.toLocaleDateString('uz-UZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).split('.').join('.');
        const timePart = date.toLocaleTimeString('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        return `${datePart} ${timePart}`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ').format(amount);
    };

    const getProductionIcon = (productionName) => {
        return productionName.includes('Mel') ?
            <Factory className="inventory-prod-icon-dual" /> :
            <Package className="inventory-prod-icon-single" />;
    };

    const getItemIcon = (label) => {
        switch (label) {
            case 'Qop': return <Package className="inventory-item-icon-qop" />;
            case 'Stakan kichik': return <Box className="inventory-item-icon-small" />;
            case 'Stakan katta': return <Box className="inventory-item-icon-large" />;
            default: return <Box className="inventory-item-icon-default" />;
        }
    };

    return (
        <div className="inventory-table-container-premium">
            {/* Summary Cards Section */}
            <div className="inventory-summary-cards-grid">
                <div className="inventory-summary-card">
                    <Weight className="inventory-summary-icon" size={16} />
                    <div className="inventory-summary-content">
                        <span className="inventory-summary-label">BN-5 (kg)</span>
                        <span className="inventory-summary-value">{formatCurrency(totals.bn5Amount)}</span>
                    </div>
                </div>
                <div className="inventory-summary-card">
                    <Package className="inventory-summary-icon" size={16} />
                    <div className="inventory-summary-content">
                        <span className="inventory-summary-label">Mel (kg)</span>
                        <span className="inventory-summary-value">{formatCurrency(totals.melAmount)}</span>
                    </div>
                </div>
                <div className="inventory-summary-card">
                    <Zap className="inventory-summary-icon" size={16} />
                    <div className="inventory-summary-content">
                        <span className="inventory-summary-label">Elektr</span>
                        <span className="inventory-summary-value">{formatCurrency(totals.electricity)}</span>
                    </div>
                </div>
                <div className="inventory-summary-card">
                    <Flame className="inventory-summary-icon" size={16} />
                    <div className="inventory-summary-content">
                        <span className="inventory-summary-label">Gaz</span>
                        <span className="inventory-summary-value">{formatCurrency(totals.gasAmount)}</span>
                    </div>
                </div>
                <div className="inventory-summary-card">
                    <DollarSign className="inventory-summary-icon" size={16} />
                    <div className="inventory-summary-content">
                        <span className="inventory-summary-label">Narx</span>
                        <span className="inventory-summary-value">{formatCurrency(totals.sellingPrice)} so'm</span>
                    </div>
                </div>
            </div>

            <div className="inventory-table-wrapper-glassmorphism">
                <table className="inventory-table-advanced-design">
                    <thead className="inventory-thead-gradient-modern">
                        <tr className="inventory-header-row-premium">
                            <th className="inventory-th-expand-control"></th>
                            <th>
                                <span className="inventory-th-production-name">
                                    <Factory className="inventory-th-icon-factory" />
                                    Ishlab chiqarish
                                </span>
                            </th>
                            <th>
                                <span className="inventory-th-date-info">
                                    <Calendar className="inventory-th-icon-calendar" />
                                    Sana
                                </span>
                            </th>
                            <th>
                                <span className="inventory-th-bn5-amount">
                                    <Weight className="inventory-th-icon-weight" />
                                    BN-5 (kg)
                                </span>
                            </th>
                            <th>
                                <span className="inventory-th-mel-amount">
                                    <Package className="inventory-th-icon-package" />
                                    Mel (kg)
                                </span>
                            </th>
                            <th>
                                <span className="inventory-th-electricity">
                                    <Zap className="inventory-th-icon-electric" />
                                    Elektr
                                </span>
                            </th>
                            <th>
                                <span className="inventory-th-gas-amount">
                                    <Flame className="inventory-th-icon-flame" />
                                    Gaz
                                </span>
                            </th>
                            <th>
                                <span className="inventory-th-selling-price">
                                    <DollarSign className="inventory-th-icon-dollar" />
                                    Narx
                                </span>
                            </th>
                            <th>
                                <span className="inventory-th-extra-costs">
                                    <Plus className="inventory-th-icon-plus" />
                                    Qo'shimcha
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="inventory-tbody-modern-style">
                        {inventoryData?.map((record) => (
                            <React.Fragment key={record._id}>
                                <tr className="inventory-main-row-interactive">
                                    <td classNameName="inventory-td-expand-button">
                                        <button
                                            className="inventory-expand-btn-circular"
                                            onClick={() => toggleRowExpansion(record._id)}
                                        >
                                            {expandedRows.has(record._id) ?
                                                <ChevronDown className="inventory-chevron-icon-down" /> :
                                                <ChevronRight className="inventory-chevron-icon-right" />
                                            }
                                        </button>
                                    </td>
                                    <td className="inventory-td-production-badge">
                                        <div className="inventory-production-wrapper-modern">
                                            {getProductionIcon(record.productionName)}
                                            <span className={`inventory-production-text-${record.productionName.includes('Mel') ? 'dual' : 'single'}`}>
                                                {record.productionName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="inventory-td-date-formatted">
                                        <span className="inventory-date-display-elegant">
                                            {formatDate(record.date)}
                                        </span>
                                    </td>
                                    <td className="inventory-td-bn5-value">
                                        <span className="inventory-amount-text-bn5">
                                            {formatCurrency(record.bn5Amount)}
                                        </span>
                                    </td>
                                    <td className="inventory-td-mel-value">
                                        <span className="inventory-amount-text-mel">
                                            {formatCurrency(record.melAmount)}
                                        </span>
                                    </td>
                                    <td className="inventory-td-electricity-cost">
                                        <span className="inventory-cost-text-electric">
                                            {formatCurrency(record.electricity)}
                                        </span>
                                    </td>
                                    <td className="inventory-td-gas-cost">
                                        <span className="inventory-cost-text-gas">
                                            {formatCurrency(record.gasAmount)}
                                        </span>
                                    </td>
                                    <td className="inventory-td-price-highlight">
                                        <span className="inventory-price-text-premium">
                                            {formatCurrency(record.sellingPrice)}
                                        </span>
                                    </td>
                                    <td className="inventory-td-extra-amount">
                                        <span className="inventory-extra-text-secondary">
                                            {formatCurrency(record.extra)}
                                        </span>
                                    </td>
                                </tr>

                                {expandedRows.has(record._id) && (
                                    <tr className="inventory-expanded-row-detailed">
                                        <td colSpan="9" className="inventory-expanded-content-container">
                                            <div className="inventory-details-panel-advanced">
                                                <div className="inventory-additional-info-grid">
                                                    <div className="inventory-info-card-kraft">
                                                        <FileText className="inventory-info-icon-kraft" />
                                                        <div className="inventory-info-content-kraft">
                                                            <span className="inventory-info-label-kraft">Kraft Qog'oz</span>
                                                            <span className="inventory-info-value-kraft">{record.kraftPaper} dona</span>
                                                        </div>
                                                    </div>
                                                    <div className="inventory-info-card-qop">
                                                        <Package className="inventory-info-icon-qop" />
                                                        <div className="inventory-info-content-qop">
                                                            <span className="inventory-info-label-qop">Qop</span>
                                                            <span className="inventory-info-value-qop">{record.qop} dona</span>
                                                        </div>
                                                    </div>
                                                    <div className="inventory-info-card-price">
                                                        <DollarSign className="inventory-info-icon-price" />
                                                        <div className="inventory-info-content-price">
                                                            <span className="inventory-info-label-price">Birlik Narxi</span>
                                                            <span className="inventory-info-value-price">{formatCurrency(record.price)} so'm</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {record.items && record.items.length > 0 && (
                                                    <div className="inventory-items-section-detailed">
                                                        <h3 className="inventory-items-title-modern">
                                                            <Box className="inventory-items-icon-title" />
                                                            Mahsulot Tafsilotlari
                                                        </h3>
                                                        <div className="inventory-items-grid-responsive">
                                                            {record.items.map((item, index) => (
                                                                <div key={index} className="inventory-item-card-premium">
                                                                    <div className="inventory-item-header-stylish">
                                                                        {getItemIcon(item.label)}
                                                                        <span className="inventory-item-label-emphasized">{item.label}</span>
                                                                    </div>
                                                                    <div className="inventory-item-details-structured">
                                                                        <div className="inventory-item-detail-row-amount">
                                                                            <Weight className="inventory-item-detail-icon-weight" />
                                                                            <span className="inventory-item-detail-text-amount">
                                                                                {formatCurrency(item.bn5Amount)} kg BN-5
                                                                            </span>
                                                                        </div>
                                                                        <div className="inventory-item-detail-row-quantity">
                                                                            <Package className="inventory-item-detail-icon-package" />
                                                                            <span className="inventory-item-detail-text-quantity">
                                                                                {item.quantity} {item.unit}
                                                                            </span>
                                                                        </div>
                                                                        <div className="inventory-item-detail-row-rope">
                                                                            <Cable className="inventory-item-detail-icon-rope" />
                                                                            <span className="inventory-item-detail-text-rope">
                                                                                {item.rope} m ip
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {record.notes && (
                                                    <div className="inventory-notes-section-elegant">
                                                        <FileText className="inventory-notes-icon-file" />
                                                        <div className="inventory-notes-content-wrapper">
                                                            <span className="inventory-notes-label-header">Izohlar:</span>
                                                            <p className="inventory-notes-text-content">{record.notes}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;