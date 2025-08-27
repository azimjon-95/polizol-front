import React, { useState } from 'react';
import { Package, Calendar, Zap, Flame, DollarSign, Hash, Factory, Eye, X, History } from 'lucide-react';
import { HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp, HiOutlineArrowsRightLeft } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import { useGetProductionHistoryQuery } from '../../../context/productionApi';
import './style.css';

const ProductionHistoryTable = ({ startDate, endDate }) => {
    const [selectedData, setSelectedData] = useState([]);
    const [modalType, setModalType] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduction, setSelectedProduction] = useState(null);

    const {
        data: productionHistory = [],
        isLoading: historyLoading,
        error: historyError,
    } = useGetProductionHistoryQuery({
        startDate,
        endDate,
    });

    const calculateMaterialsCost = (materials = []) => {
        return materials.reduce((total, material) => {
            const quantity = material?.quantityUsed ?? 0;
            const price = material?.unitPrice ?? 0;
            return total + quantity * price;
        }, 0);
    };

    // Calculate totals for Quantity, Utilities, and Total Cost
    const totals = productionHistory.reduce(
        (acc, production) => ({
            quantityProduced: acc.quantityProduced + (production.quantityProduced || 0),
            electricity: acc.electricity + (production.electricity || 0),
            gasAmount: acc.gasAmount + (production.gasAmount || 0),
            totalCost:
                acc.totalCost +
                (production?.productNormaId?.cost?.totalCost || 0) +
                calculateMaterialsCost(production.materialsUsed),
        }),
        { quantityProduced: 0, electricity: 0, gasAmount: 0, totalCost: 0 }
    );

    const openModal = (materialsUsed, materialStatistics, production) => {
        // Merge materialsUsed and materialStatistics by materialName
        const mergedData = [
            ...new Set([
                ...materialsUsed.map((m) => m.materialName),
                ...materialStatistics.map((s) => s.materialName),
            ]),
        ]
            .map((materialName) => {
                const material = materialsUsed.find((m) => m.materialName === materialName) || {};
                const stat = materialStatistics.find((s) => s.materialName === materialName) || {};
                const quantityUsed = material.quantityUsed || 0;
                const unitPrice = material.unitPrice || 0;
                const totalCost = quantityUsed * unitPrice;
                const requiredQuantity = stat.requiredQuantity || 0;
                const plannedCost = requiredQuantity * unitPrice;
                const costDifference = totalCost - plannedCost;
                return {
                    materialName,
                    quantityUsed,
                    unitPrice,
                    totalCost,
                    unit: stat.unit || 'N/A',
                    requiredQuantity,
                    consumedQuantity: stat.consumedQuantity || 0,
                    difference: stat.difference || 0,
                    statId: stat._id || null,
                    costDifference: costDifference, // Positive: overspent, Negative: saved
                };
            })
            .sort((a, b) => a.materialName.localeCompare(b.materialName)); // Sort alphabetically

        setSelectedData(mergedData);
        setModalType('combined');
        setSelectedProduction(production);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedData([]);
        setModalType(null);
        setSelectedProduction(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'N/A';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hour}:${minute}`;
    };

    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '0 so\'m';
        return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
    };

    const getIconStatus = (statId) => {
        const stat = selectedData.find((s) => s.statId === statId);
        if (!stat) return 'equal';
        const consumed = stat.consumedQuantity ?? 0;
        const required = stat.requiredQuantity ?? 0;

        if (consumed > required) return 'exceed';
        if (consumed < required) return 'insufficient';
        return 'equal';
    };

    const getStatusIcon = (status) => {
        const icons = {
            insufficient: <HiOutlineArrowTrendingDown className="status-icon active insufficient" />,
            exceed: <HiOutlineArrowTrendingUp className="status-icon active exceed" />,
            equal: <HiOutlineArrowsRightLeft className="status-icon active equal" />,
        };
        return icons[status] || null;
    };


    return (
        <>
            <div className="mvb-history-list">
                {historyLoading ? (
                    <div className="mvb-loading-state">
                        <div className="mvb-loading-spinner"></div>
                        <p>Ma'lumotlar yuklanmoqda...</p>
                    </div>
                ) : productionHistory.length > 0 ? (
                    <div className="mvb-table-wrapper">
                        {/* Summary Cards Section */}
                        <div className="mvb-summary-cards-grid">
                            <div className="mvb-summary-card">
                                <Hash className="mvb-summary-icon" size={16} />
                                <div className="mvb-summary-content">
                                    <span className="mvb-summary-label">Miqdor</span>
                                    <span className="mvb-summary-value">{totals.quantityProduced} dona</span>
                                </div>
                            </div>
                            <div className="mvb-summary-card">
                                <Zap className="mvb-summary-icon" size={16} />
                                <div className="mvb-summary-content">
                                    <span className="mvb-summary-label">Kommunal (Elektr)</span>
                                    <span className="mvb-summary-value">{totals.electricity} kWt</span>
                                </div>
                            </div>
                            <div className="mvb-summary-card">
                                <Flame className="mvb-summary-icon" size={16} />
                                <div className="mvb-summary-content">
                                    <span className="mvb-summary-label">Kommunal (Gaz)</span>
                                    <span className="mvb-summary-value">{totals.gasAmount} m³</span>
                                </div>
                            </div>
                            <div className="mvb-summary-card">
                                <DollarSign className="mvb-summary-icon" size={16} />
                                <div className="mvb-summary-content">
                                    <span className="mvb-summary-label">Jami</span>
                                    <span className="mvb-summary-value">{formatCurrency(Math.floor(totals.totalCost))}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mvb-table-container">
                            <table className="mvb-production-table">
                                <thead className="mvb-table-header">
                                    <tr>
                                        <th className="mvb-th mvb-th-product">
                                            <Package className="mvb-header-icon" />
                                            Mahsulot
                                        </th>
                                        <th className="mvb-th mvb-th-quantity">
                                            <Hash className="mvb-header-icon" />
                                            Miqdor
                                        </th>
                                        <th className="mvb-th mvb-th-date">
                                            <Calendar className="mvb-header-icon" />
                                            Sana
                                        </th>
                                        <th className="mvb-th mvb-th-utilities">
                                            <Zap className="mvb-header-icon" />
                                            Kommunal
                                        </th>
                                        <th className="mvb-th mvb-th-cost">
                                            <DollarSign className="mvb-header-icon" />
                                            Xarajat
                                        </th>
                                        <th className="mvb-th mvb-th-cost">
                                            <DollarSign className="mvb-header-icon" />
                                            Jami
                                        </th>
                                        <th className="mvb-th mvb-th-statistics">
                                            <Factory className="mvb-header-icon" />
                                            Xom ashyo Statistikasi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="mvb-table-body">
                                    {productionHistory.map((production) => (
                                        <tr key={production._id} className="mvb-table-row">
                                            <td className="mvb-td mvb-product-cell">
                                                <div className="mvb-product-info">
                                                    <div className="mvb-product-badge">
                                                        <Package className="mvb-product-icon" />
                                                        <span className="mvb-product-name">{production.productName || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="mvb-td mvb-quantity-cell">
                                                <div className="mvb-quantity-badge">
                                                    {production.quantityProduced || 0} dona
                                                </div>
                                            </td>
                                            <td>
                                                <div className="mvb-dateinfo">
                                                    <div className="mvb-date-created">{formatDate(production.createdAt)}</div>
                                                </div>
                                            </td>
                                            <td className="mvb-td mvb-utilities-cell">
                                                <div className="mvb-utilities-grid">
                                                    <div className="mvb-utility-item mvb-electricity">
                                                        <Zap className="mvb-utility-icon" />
                                                        <span>{production.electricity || 0} kWt</span>
                                                    </div>
                                                    <div className="mvb-utility-item mvb-gas">
                                                        <Flame className="mvb-utility-icon" />
                                                        <span>{production.gasAmount || 0} m³</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="mvb-td mvb-cost-cell">
                                                <div className="mvb-cost-info">
                                                    <div className="mvb-materials-cost">
                                                        Xom ashyo: {formatCurrency(Math.floor(calculateMaterialsCost(production.materialsUsed)))}
                                                    </div>
                                                    <div className="mvb-materials-cost">
                                                        Qo'shimcha xarajatlar: {formatCurrency(Math.floor(production?.totalCost))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="mvb-td mvb-cost-cell">
                                                <div className="mvb-cost-info">
                                                    <div className="mvb-total-cost">
                                                        {formatCurrency(
                                                            Math.floor(production?.totalCost || 0) +
                                                            Math.floor(calculateMaterialsCost(production.materialsUsed))
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className="mvb-materials-btn"
                                                    onClick={() => openModal(production.materialsUsed, production.materialStatistics, production)}
                                                >
                                                    <Eye className="mvb-materials-btn-icon" />
                                                    Statistikani ko'rish ({production.materialStatistics?.length || 0})
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="mvb-empty-state">
                        <div className="mvb-empty-icon">
                            <History size={64} />
                        </div>
                        <div className="mvb-empty-content">
                            <h3 className="mvb-empty-title">Hozircha ishlab chiqarish tarixi yo'q</h3>
                            <p className="mvb-empty-description">
                                Birinchi ruberoid partiyasini ishlab chiqaring va bu yerda ko'ring
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for Combined Materials and Statistics */}
            {isModalOpen && selectedData && (
                <div className="mvb-modal-overlay" onClick={closeModal}>
                    <div className="mvb-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="mvb-modal-header">
                            <h2 className="mvb-modal-title">
                                <Package className="mvb-modal-title-icon" />
                                Xom ashyo va Statistikasi
                            </h2>
                            <button className="mvb-modal-close-btn" onClick={closeModal}>
                                <X className="mvb-modal-close-icon" />
                            </button>
                        </div>

                        <div className="mvb-modal-content">
                            <div className="mvb-modal-stats">
                                <div className="mvb-modal-stat">
                                    <span className="mvb-modal-stat-label">Mahsulot:</span>
                                    <span className="mvb-modal-stat-value">{selectedProduction?.productName || 'N/A'}</span>
                                </div>
                                <div className="mvb-modal-stat">
                                    <span className="mvb-modal-stat-label">Miqdor:</span>
                                    <span className="mvb-modal-stat-value">{selectedProduction?.quantityProduced || 0} dona</span>
                                </div>
                            </div>

                            <div className="mvb-modal-table-wrapper">
                                <table className="mvb-modal-table">
                                    <thead className="mvb-modal-table-header">
                                        <tr>
                                            <th className="mvb-modal-th mvb-modal-th-number">#</th>
                                            <th className="mvb-modal-th mvb-modal-th-name">
                                                <Package className="mvb-modal-header-icon" />
                                                Material nomi
                                            </th>
                                            <th className="mvb-modal-th mvb-modal-th-unit">Birlik</th>
                                            <th className="mvb-modal-th mvb-modal-th-required">
                                                <Hash className="mvb-modal-header-icon" />
                                                Talab qilingan
                                            </th>
                                            <th className="mvb-modal-th mvb-modal-th-consumed">
                                                <Hash className="mvb-modal-header-icon" />
                                                Ishlatilgan
                                            </th>
                                            <th className="mvb-modal-th mvb-modal-th-difference">
                                                <Hash className="mvb-modal-header-icon" />
                                                Farq
                                            </th>
                                            <th className="mvb-modal-th mvb-modal-th-price">
                                                <DollarSign className="mvb-modal-header-icon" />
                                                Birlik narxi
                                            </th>
                                            <th className="mvb-modal-th mvb-modal-th-total">
                                                <DollarSign className="mvb-modal-header-icon" />
                                                Jami
                                            </th>
                                            <th className="mvb-modal-th mvb-modal-th-cost-difference">
                                                <DollarSign className="mvb-modal-header-icon" />
                                                Xarajat farqi
                                            </th>
                                            <th className="mvb-modal-th mvb-modal-th-status">
                                                <Factory className="mvb-modal-header-icon" />
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="mvb-modal-table-body">
                                        {selectedData.map((item, index) => {
                                            const isMissingData =
                                                item.totalCost === 0 ||
                                                (item.requiredQuantity === 0 && item.consumedQuantity === 0 && item.difference === 0);
                                            const costDifferenceText =
                                                item.costDifference > 0
                                                    ? `Oshib ketgan: ${formatCurrency(item.costDifference)}`
                                                    : item.costDifference < 0
                                                        ? `Tejab qolindi: ${formatCurrency(Math.abs(item.costDifference))}`
                                                        : 'Bir xil';
                                            return (
                                                <tr
                                                    key={item.materialName + index}
                                                    className={`mvb-modal-table-row ${isMissingData ? 'missing-data' : ''}`}
                                                >
                                                    <td className="mvb-modal-td mvb-modal-number-cell">
                                                        <div className="mvb-modal-number-badge">{index + 1}</div>
                                                    </td>
                                                    <td className="mvb-modal-td mvb-modal-name-cell">
                                                        <div className="mvb-modal-name-info">
                                                            <Package className="mvb-modal-material-icon" />
                                                            <span className="mvb-modal-material-name">{item.materialName || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="mvb-modal-td mvb-modal-unit-cell">
                                                        <div className="mvb-modal-unit-badge">{item.unit || 'N/A'}</div>
                                                    </td>
                                                    <td className="mvb-modal-td mvb-modal-required-cell">
                                                        <div className="mvb-modal-quantity-badge mvb-required">{item.requiredQuantity || 0}</div>
                                                    </td>
                                                    <td className="mvb-modal-td mvb-modal-consumed-cell">
                                                        <div className="mvb-modal-quantity-badge mvb-consumed">{item.consumedQuantity || 0}</div>
                                                    </td>
                                                    <td className="mvb-modal-td mvb-modal-difference-cell">
                                                        <div className="mvb-modal-quantity-badge mvb-difference">{item.difference || 0}</div>
                                                    </td>
                                                    <td className="mvb-modal-td mvb-modal-price-cell">
                                                        <div className="mvb-modal-price-info">{formatCurrency(item.unitPrice)}</div>
                                                    </td>
                                                    <td className="mvb-modal-td mvb-modal-total-cell">
                                                        <div className="mvb-modal-total-info">{formatCurrency(item.totalCost)}</div>
                                                    </td>
                                                    <td className="mvb-modal-td mvb-modal-cost-difference-cell">
                                                        <div className={`mvb-modal-cost-difference ${item.costDifference > 0 ? 'overspent' : item.costDifference < 0 ? 'saved' : ''}`}>
                                                            {costDifferenceText}
                                                        </div>
                                                    </td>
                                                    <td className="mvb-modal-td mvb-modal-status-cell">
                                                        <span className="material-status-icons" style={{ width: '120px' }}>
                                                            {item.statId ? getStatusIcon(getIconStatus(item.statId)) : 'N/A'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="mvb-modal-table-footer">
                                        <tr>
                                            <td className="mvb-modal-td mvb-modal-number-cell"></td>
                                            <td className="mvb-modal-td mvb-modal-name-cell">
                                                <div className="mvb-modal-name-info">Jami</div>
                                            </td>
                                            <td className="mvb-modal-td mvb-modal-quantity-cell"></td>
                                            <td className="mvb-modal-td mvb-modal-price-cell"></td>
                                            <td className="mvb-modal-td mvb-modal-required-cell"></td>
                                            <td className="mvb-modal-td mvb-modal-consumed-cell"></td>
                                            <td className="mvb-modal-td mvb-modal-difference-cell"></td>
                                            <td className="mvb-modal-td mvb-modal-total-cell">
                                                <div className="mvb-modal-total-info">
                                                    {formatCurrency(selectedData.reduce((sum, item) => sum + (item.totalCost || 0), 0))}
                                                </div>
                                            </td>
                                            <td className="mvb-modal-td mvb-modal-status-cell"></td>
                                            <td className="mvb-modal-td mvb-modal-cost-difference-cell"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductionHistoryTable;


