import React, { useState } from 'react';
import { FiMoreHorizontal, FiEye, FiDownload } from "react-icons/fi";
import { useGetProductionHistoryQuery } from '../../../context/productionApi';
import * as XLSX from 'xlsx';
import './style.css';

const ProductionHistoryTable = ({ startDate, endDate }) => {
    const {
        data: productionHistory = []
    } = useGetProductionHistoryQuery({ startDate, endDate });

    const [merged, setMerged] = useState(false);

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
        return new Intl.NumberFormat('uz-Latn-UZ').format(num || 0);
    };

    // --- Merge logic ---
    const mergeData = () => {
        const mergedMaterials = {};
        const mergedProducts = {};
        let totalGas = 0, totalGasCost = 0;
        let totalElectricity = 0, totalElectricityCost = 0;
        let totalWorker = 0, totalOther = 0;

        productionHistory.forEach(batch => {
            // materials
            batch.materialsUsed?.forEach(m => {
                if (!mergedMaterials[m.materialName]) {
                    mergedMaterials[m.materialName] = { ...m };
                } else {
                    mergedMaterials[m.materialName].quantityUsed += m.quantityUsed || 0;
                    mergedMaterials[m.materialName].totalCost += m.totalCost || 0;
                }
            });

            // products
            batch.products?.forEach(p => {
                if (!mergedProducts[p.productName]) {
                    mergedProducts[p.productName] = { ...p };
                } else {
                    mergedProducts[p.productName].quantityProduced += p.quantityProduced || 0;
                    mergedProducts[p.productName].totalSaleValue += p.totalSaleValue || 0;
                }
            });

            totalGas += batch.gasConsumption || 0;
            totalGasCost += batch.gasCost || 0;
            totalElectricity += batch.electricityConsumption || 0;
            totalElectricityCost += batch.electricityCost || 0;
            totalWorker += batch.workerExpenses || 0;
            totalOther += batch.otherExpenses || 0;
        });

        const mergedBatch = {
            date: "Barchasi",
            materialsUsed: Object.values(mergedMaterials),
            products: Object.values(mergedProducts),
            gasConsumption: totalGas,
            gasCost: totalGasCost,
            electricityConsumption: totalElectricity,
            electricityCost: totalElectricityCost,
            workerExpenses: totalWorker,
            otherExpenses: totalOther,
            totalBatchCost: Object.values(mergedMaterials).reduce((s, m) => s + (m.totalCost || 0), 0)
                + totalGasCost + totalElectricityCost + totalWorker + totalOther,
        };

        mergedBatch.materialStatistics = {
            totalMaterialCost: Object.values(mergedMaterials).reduce((s, m) => s + (m.totalCost || 0), 0),
        };

        return [mergedBatch];
    };

    // --- Export to Excel ---
    const exportToExcel = () => {
        const tableData = merged ? mergeData() : productionHistory;
        const excelData = [];

        tableData.forEach(batch => {
            const potentialRevenue = batch.products.reduce(
                (sum, p) => sum + (p.totalSaleValue || 0), 0
            );

            // Add batch header
            excelData.push([`Sana: ${startDate} — ${endDate}`]);
            excelData.push([
                "Xom ashyo",
                "Miqdori",
                "Narxi",
                "Qiymati",
                "Ishlab chiqarilgan mahsulot",
                "Miqdori (dona)",
                "Narxi",
                "Qiymati"
            ]);

            // Add materials and products
            const maxRows = Math.max(batch.materialsUsed?.length || 0, batch.products?.length || 0);
            for (let i = 0; i < maxRows; i++) {
                const material = batch.materialsUsed?.[i] || {};
                const product = batch.products?.[i] || {};
                excelData.push([
                    material.materialName || "",
                    material.quantityUsed ? formatNumber(material.quantityUsed) : "",
                    material.unitPrice ? formatNumber(material.unitPrice) : "",
                    material.totalCost ? formatNumber(material.totalCost) : "",
                    product.productName || "",
                    product.quantityProduced ? formatNumber(product.quantityProduced) : "",
                    product.salePrice ? formatNumber(product.salePrice) : "",
                    product.totalSaleValue ? formatNumber(product.totalSaleValue) : "",
                ]);
            }

            // Add additional rows
            excelData.push([
                "Tabiiy gaz",
                "",
                batch.gasConsumption ? formatNumber(Math.round(batch.gasCost / batch.gasConsumption)) : "-",
                formatNumber(batch.gasCost),
                "", "", "", ""
            ]);

            excelData.push([
                "Elektr energiyasi",
                "",
                batch.electricityConsumption ? formatNumber(Math.round(batch.electricityCost / batch.electricityConsumption)) : "-",
                formatNumber(batch.electricityCost),
                "", "", "", ""
            ]);

            excelData.push([
                "Ishchi xarajatlari", "", "",
                formatNumber(batch.workerExpenses),
                "", "", "", ""
            ]);

            excelData.push([
                "Boshqa xarajatlari", "", "",
                formatNumber(batch.otherExpenses),
                "", "", "", ""
            ]);

            excelData.push([
                "Ishlab chiqarish xarajatlari", "", "",
                formatNumber(
                    (batch.materialStatistics?.totalMaterialCost || 0) +
                    batch.electricityCost +
                    batch.gasCost +
                    batch.workerExpenses +
                    batch.otherExpenses
                ),
                formatNumber((potentialRevenue / 1000000).toFixed(1)) + " mln",
                "", "", ""
            ]);

            excelData.push([
                "Jami xarajatlari", "", "",
                formatNumber(batch.totalBatchCost),
                "", "", "", ""
            ]);

            excelData.push([
                "Foyda", "", "",
                formatNumber(potentialRevenue - batch.totalBatchCost),
                "", "", "", ""
            ]);

            excelData.push([
                "Tovar mahsulot", "", "",
                "",
                batch.products.reduce((sum, p) => sum + (p.quantityProduced || 0), 0),
                "", "",
                formatNumber(potentialRevenue)
            ]);

            // Add empty row
            excelData.push([]);
        });

        // Create worksheet and workbook
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // 🔥 Avtomatik ustun kengligini hisoblash
        const colWidths = excelData[0].map((_, colIndex) => {
            let maxLength = 10; // minimal kenglik
            excelData.forEach(row => {
                const value = row[colIndex] ? row[colIndex].toString() : "";
                maxLength = Math.max(maxLength, value.length);
            });
            return { wch: maxLength + 2 }; // biroz bo‘sh joy qo‘shamiz
        });

        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ProductionHistory");

        // Download the Excel file
        XLSX.writeFile(wb, `Production_History_${new Date().toISOString().split('T')[0]}.xlsx`);
    };


    const tableData = merged ? mergeData() : productionHistory;

    return (
        <div className="lib-table-container">
            <div className="lib-button-container">
                {merged &&
                    <button className="lib-aggregate-btn" onClick={exportToExcel}>
                        <FiDownload size={22} style={{ cursor: "pointer" }} />
                    </button>
                }
                <button className="lib-aggregate-btn" onClick={() => setMerged(!merged)}>
                    {merged ? <FiEye size={22} style={{ cursor: "pointer" }} /> : <FiMoreHorizontal size={22} style={{ cursor: "pointer" }} />}
                </button>
            </div>

            {tableData?.map((batch, inx) => {
                const potentialRevenue = batch.products.reduce(
                    (sum, p) => sum + (p.totalSaleValue || 0), 0
                );

                return (
                    <table key={inx} className="lib-main-table">
                        <thead>
                            <tr>
                                <td className="lib-date-header" colSpan="8">
                                    {merged ? (
                                        <p>{startDate} — {endDate}</p>
                                    ) : (
                                        formatDate(batch.date)
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="lib-column-header">Xom ashyo</td>
                                <td className="lib-column-header">Miqdori</td>
                                <td className="lib-column-header">Narxi</td>
                                <td className="lib-column-header">Qiymati</td>
                                <td className="lib-column-header">Ishlab chiqarilgan mahsulot</td>
                                <td className="lib-column-header">Miqdori (dona)</td>
                                <td className="lib-column-header">Narxi</td>
                                <td className="lib-column-header">Qiymati</td>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: Math.max(batch.materialsUsed?.length || 0, batch.products?.length || 0) }).map((_, index) => {
                                const material = batch.materialsUsed?.[index];
                                const product = batch.products?.[index];

                                return (
                                    <tr key={index} className="lib-row-material">
                                        <td className="lib-cell-left">{material?.materialName || <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-left">{material ? formatNumber(material.quantityUsed) : <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-right">{material?.unitPrice ? formatNumber(material.unitPrice) : <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-right">{material?.totalCost ? formatNumber(material.totalCost) : <span>&nbsp;</span>}</td>

                                        <td className="lib-cell-left">{product?.productName || <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-right">{product?.quantityProduced || <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-right lib-cell-price">{product?.salePrice ? formatNumber(product.salePrice) : <span>&nbsp;</span>}</td>
                                        <td className="lib-cell-right">{product?.totalSaleValue ? formatNumber(product.totalSaleValue) : <span>&nbsp;</span>}</td>
                                    </tr>
                                );
                            })}

                            <tr className="lib-row-gas">
                                <td className="lib-cell-left">Tabiiy gaz</td>
                                <td></td>
                                <td className="lib-cell-right">{batch.gasConsumption ? formatNumber(Math.round(batch.gasCost / batch.gasConsumption)) : "-"}</td>
                                <td className="lib-cell-right">{formatNumber(batch.gasCost)}</td>
                                <td colSpan={4}></td>
                            </tr>

                            <tr className="lib-row-blue">
                                <td className="lib-cell-left">Elektr energiyasi</td>
                                <td></td>
                                <td className="lib-cell-right">{batch.electricityConsumption ? formatNumber(Math.round(batch.electricityCost / batch.electricityConsumption)) : "-"}</td>
                                <td className="lib-cell-right">{formatNumber(batch.electricityCost)}</td>
                                <td colSpan={4}></td>
                            </tr>

                            <tr className='lib-total-row'>
                                <td className="lib-cell-left">Ishchi xarajatlari</td>
                                <td colSpan={2}></td>
                                <td className="lib-cell-right">{formatNumber(batch.workerExpenses)}</td>
                                <td colSpan={4}></td>
                            </tr>

                            <tr className='lib-total-row'>

                                <td className="lib-cell-left">Boshqa xarajatlari</td>
                                <td colSpan={2}></td>
                                <td className="lib-cell-right">{formatNumber(batch.otherExpenses)}</td>
                                <td colSpan={4}></td>
                            </tr>
                            <tr className='lib-total-row'>
                                <td className="lib-cell-left">Davr harajatlari</td>
                                <td colSpan={2}></td>
                                <td className="lib-cell-right">{formatNumber(batch.periodExpense)}</td>
                                <td colSpan={5}></td>
                            </tr>
                            <tr className="lib-total-row">
                                <td className="lib-cell-left">Ishlab chiqarish xarajatlari</td>
                                <td></td><td></td>
                                <td className="lib-cell-right">
                                    {formatNumber(
                                        (batch.materialStatistics?.totalMaterialCost || 0) +
                                        batch.electricityCost +
                                        batch.gasCost +
                                        batch.workerExpenses +
                                        batch.otherExpenses
                                    )}
                                </td>
                                <td className="lib-cell-right">{formatNumber((potentialRevenue / 1000000).toFixed(1))} mln</td>
                                <td colSpan={3}></td>
                            </tr>

                            <tr className="lib-total-row">
                                <td className="lib-cell-left">Jami xarajatlari</td>
                                <td colSpan={2}></td>
                                <td className="lib-cell-right">{formatNumber(batch.totalBatchCost)}</td>
                                <td colSpan={4}></td>
                            </tr>

                            <tr className="lib-row-foil">
                                <td className="lib-cell-left">Foyda</td>
                                <td colSpan={2}></td>
                                <td className="lib-cell-right">{formatNumber(potentialRevenue - batch.totalBatchCost)}</td>
                                <td colSpan={4}></td>
                            </tr>

                            <tr className="lib-total-row">
                                <td className="lib-cell-left">Tovar mahsulot</td>
                                <td colSpan={2}></td>
                                <td></td>
                                <td className="lib-cell-right">
                                    {batch.products.reduce((sum, p) => sum + (p.quantityProduced || 0), 0)}
                                </td>
                                <td></td>
                                <td></td>
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