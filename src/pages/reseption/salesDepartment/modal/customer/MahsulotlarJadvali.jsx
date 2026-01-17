import React from 'react';
import './style.css';

const MahsulotlarJadvali = ({ allData, customer, tableRef }) => {
    const data = allData?.innerData?.sales || [];

    const allPaymentHistory = (data || [])
        .flatMap(sale => sale?.payment?.paymentHistory || []);


    // Jami qiymatlarni hisoblash
    const jamiQiymat = data.reduce((grandTotal, item) => {
        const deliveredSum = (item.deliveredItems || []).reduce(
            (sum, d) => sum + (Number(d?.totalAmount) || 0),
            0
        );
        return grandTotal + deliveredSum;
    }, 0);

    const formatDateDMY = (isoDate) => {
        if (!isoDate) return '';
        const d = new Date(isoDate);

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        return `${day}/${month}/${year}`;
    };


    const getUnitByProductName = (productName = "") => {
        const name = productName.toLowerCase();

        // kg bo'ladigan mahsulotlar (productName ichida uchrasa)
        const kgKeywords = [
            "bn-5 qop",
            "stakan kichik",
            "stakan katta",
            "bitum (5/m)",
            "melsiz",
        ];

        const isKg = kgKeywords.some(k => name.includes(k));
        return isKg ? "kg" : "dona";
    };
    const jamiTolov = allPaymentHistory?.reduce((total, chesloGuruhi) => total + chesloGuruhi.amount, 0);

    const qoldiq = jamiQiymat - jamiTolov;

    return (
        <div className="th-container" ref={tableRef}>
            <h1 className="th-title">JO'NATILGAN MAHSULOTLAR</h1>
            <h2 className="th-subtitle">{customer?.name}</h2>

            <table className="jadval">
                <thead>
                    <tr>
                        <th className="th-narrow">№</th>
                        <th className="th-narrow">Hisob-varaq №</th>
                        <th className="th-medium">Sana</th>
                        <th className="th-wide">Mahsulot nomi</th>
                        <th className="th-narrow">O'lcho v birl.</th>
                        <th className="th-medium">Miqdori</th>
                        <th className="th-medium">Narxi</th>
                        <th className="th-medium">Qiymati (so'm)</th>
                        <th className="th-medium">To'lov (so'm)</th>
                        <th className="th-medium">Qoldiq (so'm)</th>
                        <th className="th-wide">Eslatma</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((chesloGuruhi, grupIndex) => (
                        <React.Fragment key={grupIndex}>
                            {chesloGuruhi.deliveredItems ? (
                                <>
                                    {chesloGuruhi.deliveredItems.map((row, rowIndex) => (
                                        <tr key={rowIndex} className={row.highlight ? 'row-highlight' : ''}>
                                            <td></td>
                                            <td></td>
                                            <td>{rowIndex === 0 ? chesloGuruhi.date : ''}</td>
                                            <td className={row.highlight ? 'cell-highlight' : ''}>{row.productName}</td>
                                            <td>{getUnitByProductName(row.productName)}</td>
                                            <td className={row.highlight ? 'cell-highlight' : ''}>{row.deliveredQuantity}</td>
                                            <td className={row.highlight ? 'cell-highlight' : ''}>
                                                {(row.totalAmount / row.deliveredQuantity).toLocaleString()}
                                            </td>
                                            <td className={row.highlight ? 'cell-highlight' : ''}>  {row.totalAmount ? row.totalAmount.toLocaleString() : ''} </td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    ))}
                                    {allPaymentHistory && allPaymentHistory?.map((tolovItem, tolovIndex) => (
                                        <tr key={tolovIndex}>
                                            <td></td>
                                            <td></td>
                                            <td>{chesloGuruhi.date}</td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td>{tolovItem.amount.toLocaleString()}</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    ))}
                                </>
                            ) : (
                                <tr key={grupIndex}>
                                    <td></td>
                                    <td></td>
                                    <td>{formatDateDMY(chesloGuruhi.date)}</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td>{chesloGuruhi.amount ? chesloGuruhi.amount.toLocaleString() : ''}</td>
                                    <td></td>
                                    <td>{chesloGuruhi.note || ''}</td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                    <tr className="row-jami">
                        <td colSpan="7" className="cell-jami-label">Jami:</td>
                        <td className="cell-jami-value">{jamiQiymat.toLocaleString()}</td>
                        <td className="cell-jami-value">{jamiTolov.toLocaleString()}</td>
                        <td className="cell-jami-qoldiq">{qoldiq.toLocaleString()}</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default MahsulotlarJadvali;