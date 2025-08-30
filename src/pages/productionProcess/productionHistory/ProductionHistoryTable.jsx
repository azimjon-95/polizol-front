import React from 'react';
import { useGetProductionHistoryQuery } from '../../../context/productionApi';
import './style.css';

const ProductionHistoryTable = ({ startDate, endDate }) => {
    const {
        data: productionHistory = [],
        isLoading: historyLoading,
        error: historyError,
    } = useGetProductionHistoryQuery({
        startDate,
        endDate,
    });

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('uz-Latn-UZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Format numbers with thousands separator
    const formatNumber = (num) => {
        return new Intl.NumberFormat('uz-Latn-UZ').format(num);
    };

    return (
        <div className="lib-table-container">
            {productionHistory?.map((batch, inx) => {
                // Jami daromad (potential revenue)
                const potentialRevenue = batch.products.reduce(
                    (sum, p) => sum + (p.totalSaleValue || 0),
                    0
                );

                return (
                    <table key={inx} className="lib-main-table">
                        <thead>
                            <tr>
                                <td className="lib-date-header" colSpan="7">
                                    {formatDate(batch.date)}
                                </td>
                            </tr>
                            <tr>
                                <td className="lib-column-header">Xajjatlar</td>
                                <td className="lib-column-header">Baxosi</td>
                                <td className="lib-column-header">Qiyati</td>
                                <td className="lib-column-header">Ishlab chiqarilgan maxsulot</td>
                                <td className="lib-column-header">Miqdori (dona)</td>
                                <td className="lib-column-header">Baxosi</td>
                                <td className="lib-column-header">Qiyati</td>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Materials + Products */}
                            {Array.from({ length: Math.max(batch.materialsUsed?.length || 0, batch.products?.length || 0) }).map((_, index) => {
                                const material = batch.materialsUsed?.[index];
                                const product = batch.products?.[index];

                                let rowClass = "lib-row-material";
                                if (material?.materialName?.toLowerCase().includes("scotch") ||
                                    material?.materialName?.toLowerCase().includes("skotch")) {
                                    rowClass = "lib-row-blue";
                                }

                                return (
                                    <tr key={index} className={rowClass}>
                                        {/* Material columns */}
                                        <td className="lib-cell-left">{material?.materialName || <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-right">{material?.unitPrice ? formatNumber(material.unitPrice) : <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-right">{material?.totalCost ? formatNumber(material.totalCost) : <span>&nbsp;</span>}</td>

                                        {/* Product columns */}
                                        <td className="lib-cell-left">{product?.productName || <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-right">{product?.quantityProduced || <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-right lib-cell-price">{product?.salePrice ? formatNumber(product.salePrice) : <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-right">{product?.totalSaleValue ? formatNumber(product.totalSaleValue) : <span>&nbsp;</span>}</td>
                                    </tr>
                                );
                            })}

                            {/* Special rows */}
                            <tr className="lib-row-gas">
                                <td className="lib-cell-left">Tabiiy gaz</td>
                                <td className="lib-cell-right">{formatNumber(Math.round(batch.gasCost / batch.gasConsumption))}</td>
                                <td className="lib-cell-right">{formatNumber(batch.gasCost)}</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                            </tr>

                            <tr className="lib-row-blue">
                                <td className="lib-cell-left">Elektr energiyasi</td>
                                <td className="lib-cell-right">{formatNumber(Math.round(batch.electricityCost / batch.electricityConsumption))}</td>
                                <td className="lib-cell-right">{formatNumber(batch.electricityCost)}</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                            </tr>

                            <tr className="lib-row-material">
                                <td className="lib-cell-left">Ishchi xarajatlari</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-right">{formatNumber(batch.workerExpenses)}</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                            </tr>

                            <tr className="lib-row-material">
                                <td className="lib-cell-left">Boshqa xarajatlari</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-right">{formatNumber(batch.otherExpenses)}</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                            </tr>

                            {/* Totals */}
                            <tr className="lib-total-row">
                                <td className="lib-cell-left">Ish/chiq.xarajatlari</td>
                                <td></td>
                                <td className="lib-cell-right">
                                    {formatNumber(
                                        batch.materialStatistics.totalMaterialCost +
                                        batch.electricityCost +
                                        batch.gasCost +
                                        batch.workerExpenses +
                                        batch.otherExpenses
                                    )}
                                </td>
                                <td className="lib-cell-right">{formatNumber((potentialRevenue / 1000000).toFixed(1))} mln</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                            </tr>

                            <tr className="lib-total-row">
                                <td className="lib-cell-left">Jami xarajatlari</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-right">{formatNumber(batch.totalBatchCost)}</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                            </tr>

                            <tr className="lib-row-foil">
                                <td className="lib-cell-left">Foyda</td>
                                <td className="lib-cell-right"></td>
                                <td className="lib-cell-right">{formatNumber(potentialRevenue - batch.totalBatchCost)}</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                            </tr>

                            <tr className="lib-total-row">
                                <td className="lib-cell-left">Tovar maxsulot</td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-right">
                                    {batch.products.reduce((sum, p) => sum + (p.quantityProduced || 0), 0)}
                                </td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-empty"></td>
                                <td className="lib-cell-right">{formatNumber(potentialRevenue)}</td>
                            </tr>
                        </tbody>
                    </table>
                );
            })}
        </div>
    );
};

export default ProductionHistoryTable;