import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { LeftOutlined } from '@ant-design/icons';
import { useGetReportsQuery } from '../../../context/expenseApi';
import { Modal } from 'antd';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import './style/salesTable.css';

moment.locale('uz-latn'); // O'zbek lotin alifbosi sozlamasi

const ExpensesSalesTable = ({ setActiveTab }) => {
    const [data, setData] = useState([]);
    const [month, setMonth] = useState(moment().format('YYYY-MM'));
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    // Oy boshidan oxirigacha sanalarni olish
    const startDate = moment(month).startOf('month').format('YYYY-MM-DD');
    const endDate = moment(month).endOf('month').format('YYYY-MM-DD');

    // Hisobotlarni olish
    const { data: reports, isLoading, error } = useGetReportsQuery({ startDate, endDate });
    const handleChange = (e) => setMonth(e.target.value);
    const sampleData = reports?.innerData?.expenses || [];

    // Ishlab chiqarish ma'lumotlari
    const calcPrice = (prod) => {
        if (prod?.items?.length) {
            return prod.items.reduce(
                (sum, i) => sum + (i.quantityProduced * i.salePrice),
                0
            );
        }
        return (prod?.quantity || 0) * (prod?.sellingPrice || 0);
    };
    const productionData = [
        {
            product: reports?.innerData?.productionHistory?.[0]?.name || 'Polizol',
            quantity: reports?.innerData?.productionHistory?.[0]?.quantity || 0,
            price: calcPrice(reports?.innerData?.productionHistory?.[0]),
            items: reports?.innerData?.productionHistory?.[0]?.items || [],
        },
        {
            product: reports?.innerData?.productionHistory?.[1]?.name || 'Ruberoid',
            quantity: reports?.innerData?.productionHistory?.[1]?.quantity || 0,
            price: calcPrice(reports?.innerData?.productionHistory?.[1]),
            items: reports?.innerData?.productionHistory?.[1]?.items || [],
        },
        {
            product: `Bitum ${reports?.innerData?.inventory?.[1]?.name || 'BN-5 (20% mel)'}`,
            quantity: reports?.innerData?.inventory?.[1]?.quantity || 0,
            price: calcPrice(reports?.innerData?.inventory?.[1]),
        },
        {
            product: `Bitum ${reports?.innerData?.inventory?.[0]?.name || 'BN-5'}`,
            quantity: reports?.innerData?.inventory?.[0]?.quantity || 0,
            price: calcPrice(reports?.innerData?.inventory?.[0]),
        },
        {
            product: reports?.innerData?.praymer?.[0]?.name || 'Praymer - BIPRO',
            quantity: reports?.innerData?.praymer?.[0]?.quantity || 0,
            price: calcPrice(reports?.innerData?.praymer?.[0]),
        },
    ];

    const totalQuantity = productionData.reduce((total, item) => total + (item.quantity || 0), 0);
    const totalPrice = productionData.reduce((total, item) => total + (item.price || 0), 0);



    const formatNumber = (num) => num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';

    const getRowClass = (item) => {
        return item.isSubtotal ? 'sam-subtotal-row' :
            item.isProfit ? 'sam-profit-row' :
                item.isNote ? 'sam-note-row' :
                    item.isTotal ? 'sam-total-row' : 'sam-data-row';
    };

    const handleRowClick = (items) => {
        if (items?.length) {
            setSelectedItems(items);
            setIsModalVisible(true);
        }
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setSelectedItems([]);
    };

    // Skeleton komponentlari
    const ExpensesSkeleton = () => (
        <table className="sam-expenses-table">
            <thead>
                <tr>
                    <th>Xarajatlar</th>
                    <th>Xarajatlar (%)</th>
                    <th>Qiymati</th>
                </tr>
            </thead>
            <tbody>
                {[...Array(10)].map((_, index) => (
                    <tr key={index}>
                        <td><div className="sum-skeleton sum-skeleton-text"></div></td>
                        <td><div className="sum-skeleton sum-skeleton-number"></div></td>
                        <td><div className="sum-skeleton sum-skeleton-number"></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const ProductionSkeleton = () => (
        <table className="sam-expenses-table">
            <thead>
                <tr>
                    <th>Ishlab chiqarilgan mahsulot</th>
                    <th>Miqdori (dona)</th>
                    <th>Bahosi</th>
                    <th>Qiymati</th>
                </tr>
            </thead>
            <tbody>
                {[...Array(10)].map((_, index) => (
                    <tr key={index}>
                        <td><div className="sum-skeleton sum-skeleton-text"></div></td>
                        <td><div className="sum-skeleton sum-skeleton-number"></div></td>
                        <td><div className="sum-skeleton sum-skeleton-empty"></div></td>
                        <td><div className="sum-skeleton sum-skeleton-number"></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const handleDownloadExcel = () => {
        const expensesTable = document.querySelectorAll('.sam-expenses-table')[0];
        const productionTable = document.querySelectorAll('.sam-expenses-table')[1];

        const parseTable = (table) => {
            const rows = Array.from(table.querySelectorAll('tr'));
            return rows.map(row => {
                const cells = Array.from(row.querySelectorAll('th, td'));
                return cells.map(cell => cell.innerText);
            });
        };

        const expensesData = parseTable(expensesTable);
        const productionData = parseTable(productionTable);

        // Combine data with a separator column
        const maxRows = Math.max(expensesData.length, productionData.length);
        const combinedData = [];

        // Add headers for both tables with a separator column
        const expenseHeader = expensesData[0] || ['', '', ''];
        const productionHeader = productionData[0] || ['', '', '', ''];
        combinedData.push([...expenseHeader, '', ...productionHeader]); // Header row

        // Add data rows
        for (let i = 1; i < maxRows; i++) {
            const expenseRow = expensesData[i] || ['', '', ''];
            const productionRow = productionData[i] || ['', '', '', ''];
            combinedData.push([...expenseRow, '', ...productionRow]);
        }

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(combinedData);

        // Apply styles
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = { c: C, r: R };
                const cellRef = XLSX.utils.encode_cell(cellAddress);

                if (!worksheet[cellRef]) continue;

                // Initialize cell style
                worksheet[cellRef].s = {
                    font: { name: 'Arial', sz: 12 },
                    alignment: { vertical: 'center', horizontal: R === 0 ? 'center' : 'left' },
                    border: {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } }
                    }
                };

                // Bold and larger font for headers
                if (R === 0) {
                    worksheet[cellRef].s.font = { name: 'Arial', sz: 14, bold: true };
                    worksheet[cellRef].s.fill = { fgColor: { rgb: 'D3D3D3' } }; // Light gray background
                }
            }
        }

        // Set column widths (in characters)
        worksheet['!cols'] = [
            { wch: 20 }, // Expense column 1
            { wch: 15 }, // Expense column 2
            { wch: 15 }, // Expense column 3
            { wch: 5 },  // Separator column
            { wch: 20 }, // Production column 1
            { wch: 15 }, // Production column 2
            { wch: 15 }, // Production column 3
            { wch: 15 }  // Production column 4
        ];

        // Create workbook and append worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Xarajat va Ishlab chiqarish');

        // Generate Excel file and trigger download
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `hisobot-${month}.xlsx`);
    };

    const handleDownloadPDF = async () => {
        const container = document.querySelector('.sam-expenses-box');
        const canvas = await html2canvas(container, {
            scale: 2, // yuqori sifat
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'pt', [canvas.width, canvas.height]); // landscape
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`hisobot-${month}.pdf`);
    };
    // isLoading skeleton animation
    if (isLoading) {
        return (
            <div className="sam-table-container">
                <div className="sam-table-title">
                    <button
                        onClick={() => setActiveTab('Expenses')}
                        style={{ background: '#ffffff', color: '#000000', border: 'none', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                    >
                        <LeftOutlined /> Orqaga
                    </button>
                    <h2>Xarajatlar va foyda tahlili</h2>
                    <input
                        type="month"
                        value={month}
                        onChange={handleChange}
                        style={{ padding: '4px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc', width: '155px', outline: 'none' }}
                    />
                </div>

                <div className="sam-expenses-box">
                    <ExpensesSkeleton />
                    <ProductionSkeleton />
                </div>
            </div>
        );
    }
    return (
        <div className="sam-table-container">
            <div className="sam-table-title">
                <button
                    onClick={() => setActiveTab('Expenses')}
                    style={{ background: '#ffffff', color: '#000000', border: 'none', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                >
                    <LeftOutlined /> Orqaga
                </button>
                <h2>Xarajatlar va foyda tahlili</h2>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                }}>
                    <button
                        onClick={handleDownloadPDF}
                        style={{
                            padding: '7px 10px',
                            backgroundColor: '#ffffff',
                            color: '#000000',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        PDF
                    </button>
                    <button
                        onClick={handleDownloadExcel}
                        style={{
                            padding: '7px 10px',
                            color: '#000000',
                            backgroundColor: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Excel
                    </button>
                    <input
                        type="month"
                        value={month}
                        onChange={handleChange}
                        style={{ padding: '4px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc', width: '155px', outline: 'none' }}
                    />
                </div>
            </div>

            <div className="sam-expenses-box">
                {/* Xarajatlar jadvali */}
                <table className="sam-expenses-table">
                    <thead>
                        <tr>
                            <th>Xarajatlar</th>
                            <th>Xarajatlar (%)</th>
                            <th>Qiymati</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData?.map((item, index) => (
                            <tr key={index} className={getRowClass(item)}>
                                <td className="sam-category-cell">{item.category}</td>
                                <td className="sam-percentage-cell">{item.percentage || ''}</td>
                                <td className="sam-amount-cell">{formatNumber(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Ishlab chiqarish jadvali */}
                <table className="sam-expenses-table">
                    <thead>
                        <tr>
                            <th>Ishlab chiqarilgan mahsulot</th>
                            <th>Miqdori (dona)</th>
                            <th>Bahosi</th>
                            <th>Qiymati</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ...productionData,
                            ...Array(Math.max(0, sampleData.length - productionData.length - 1)).fill({ product: '', quantity: '', price: '', isDataRow: true }),
                        ].map((item, index) => (
                            <tr
                                key={index}
                                className={getRowClass(item)}
                                onClick={() => handleRowClick(item.items)}
                                style={{ cursor: item.items?.length ? 'pointer' : 'default' }}
                            >
                                <td className={`sam-category-cell ${item.items?.length ? 'sam-category-cellarrow' : ''}`}>{item.product}</td>
                                <td className="sam-quantity-cell">{formatNumber(item.quantity)}</td>
                                <td className="sam-price-cell"></td>
                                <td className="sam-amount-cell">{formatNumber(item.price)}</td>
                            </tr>
                        ))}
                        <tr className="sam-total-row">
                            <td className="sam-category-cell"></td>
                            <td className="sam-quantity-cell">{formatNumber(totalQuantity)}</td>
                            <td className="sam-price-cell"></td>
                            <td className="sam-amount-cell">{formatNumber(totalPrice)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Modal oynasi */}
            <Modal
                title="Mahsulot tavsifi"
                open={isModalVisible}
                onCancel={handleModalClose}
                footer={null}
                width={650}
            >
                <table className="sam-items-table">
                    <thead>
                        <tr>
                            <th>Mahsulot nomi</th>
                            <th>Miqdori (dona)</th>
                            <th>Sotuv narxi</th>
                            <th>Jami</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedItems.map((item, index) => (
                            <tr key={index}>
                                <td>{item.productName}</td>
                                <td>{formatNumber(item.quantityProduced)}</td>
                                <td>{formatNumber(item.salePrice)}</td>
                                <td>{formatNumber(item.quantityProduced * item.salePrice)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Modal>
        </div>
    );
};

export default ExpensesSalesTable;


