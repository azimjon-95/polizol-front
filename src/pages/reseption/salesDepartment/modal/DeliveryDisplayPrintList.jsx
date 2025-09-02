import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeCanvas } from "qrcode.react";
import { NumberFormat } from "../../../../hook/NumberFormat";
import './DeliveryDisplay.css';
import { Modal } from 'antd';

const DeliveryDisplayPrint = ({
    modalState,
    closeModal,
}) => {
    const groupedDeliveredItems = modalState?.deliveryItems || {};

    const PrintableComponent = React.forwardRef(({ dateKey, items }, ref) => {
        const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
        const saleId = items[0]._id
        const transport = items[0].transport
        let fixedDateKey = dateKey.length === 13 ? dateKey + ":00" : dateKey;
        const date = new Date(fixedDateKey);
        const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with leading zero if needed
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-based, so +1) and pad
        const year = date.getFullYear();
        const formattedDate = `${day}.${month}.${year}`;

        return (
            <div ref={ref} className="card-doc-page">
                <h2 className="card-doc-title">
                    Yuk Xati (Sotuv №{saleId?.slice(-4) || 'N/A'})
                </h2>
                <p className="card-doc-date">{formattedDate}</p>

                <div className="card-doc-info">
                    <p>
                        <strong>Yuboruvchi:</strong> "SELEN BUNYODKOR" MCHJ
                    </p>
                    <p>
                        <strong>Manzil:</strong> Namangan viloyati, Pop tumani, Istiqilol N18
                    </p>
                    <p>
                        <strong>Mijoz:</strong>{" "}
                        {modalState.deliveryFirms || "Noma'lum"}
                    </p>
                    <p>
                        <strong>Avtotransport:</strong>{" "}
                        {transport || "Belgilanmagan"}
                    </p>
                </div>

                <table className="card-doc-table">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Mahsulot nomi</th>
                            <th>Miqdori</th>
                            <th>O'lchov</th>
                            <th>Narxi</th>
                            <th>Qiymat</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const price = item.totalAmount / item.deliveredQuantity;
                            return (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{item.productName || "Noma'lum"}</td>
                                    <td>{(item.deliveredQuantity || 0).toLocaleString()}</td>
                                    <td>
                                        {["BN-5 Qop", "Bitum (5/M) melsiz", "Stakan kichik", "Stakan katta"].includes(item.productName)
                                            ? "kg"
                                            : "dona"}
                                    </td>
                                    <td>{NumberFormat(price)}</td>
                                    <td>{NumberFormat(item.totalAmount)}</td>
                                </tr>
                            );
                        })}
                        <tr className="card-doc-total">
                            <td colSpan="5"><strong>Jami:</strong></td>
                            <td><strong>{NumberFormat(totalAmount)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                <p className="card-doc-contact">
                    Biz bilan ishlaganingizdan minnatdormiz! Taklif va shikoyatlar uchun
                    QR kodni skanerlang yoki quyidagi raqamlarga <br /> qo‘ng‘iroq qiling:  +998
                    94 184 10 00,
                </p>
                <div className="card-doc-sign">
                    <div>
                        <strong>Berdi:</strong> _____________________
                    </div>
                    <div className="card-doc-qr"><br />
                        <QRCodeCanvas
                            value={`${window.location.origin}/feedback`}
                            size={90}
                            level="M"
                        />
                    </div>
                    <div>
                        <strong>Oldim:</strong> _____________________
                    </div>
                </div>
            </div>
        )
    })


    return (
        <Modal
            open={modalState.isDeliveryListOpen}
            onCancel={closeModal}
            title="Yuk Xatlari"
            footer={null}
            width={700}
        >
            <div className="yul-delivery-container">

                {Object.entries(groupedDeliveredItems)
                    .sort(([a], [b]) => new Date(b.length === 13 ? b + ":00" : b) - new Date(a.length === 13 ? a + ":00" : a)) // so‘nggi sanalar tepada
                    .map(([dateKey, items]) => {
                        const printRef = useRef(null);
                        const handlePrint = useReactToPrint({
                            contentRef: printRef,
                            documentTitle: `Yetkazib berish hisoboti - ${dateKey}`,
                            onPrintError: (errorLocation, error) => {
                                console.error("Print error:", errorLocation, error);
                            },
                        });

                        let fixedDateKey = dateKey.length === 13 ? dateKey + ":00" : dateKey;
                        const date = new Date(fixedDateKey);
                        const day = String(date.getDate()).padStart(2, "0");
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const year = date.getFullYear();
                        const formattedDate = `${day}.${month}.${year}`;

                        return (
                            <div key={dateKey}>
                                <div className="yul-delivery-group">
                                    <div className="yul-date-header">
                                        <h2 className="yul-date-title">{formattedDate}</h2>
                                        <button
                                            className="yul-print-btn"
                                            onClick={handlePrint}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#1890ff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            📄 Hujjatni chop etish
                                        </button>
                                    </div>

                                    <div className="yul-items-grid">
                                        <table className="card-doc-table">
                                            <thead>
                                                <tr>
                                                    <th>№</th>
                                                    <th>Mahsulot nomi</th>
                                                    <th>Miqdori</th>
                                                    <th>O'lchov</th>
                                                    <th>Narxi</th>
                                                    <th>Qiymat</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, index) => {
                                                    const price = item.totalAmount / item.deliveredQuantity;
                                                    return (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td>{item.productName || "Noma'lum"}</td>
                                                            <td>{(item.deliveredQuantity || 0).toLocaleString()}</td>
                                                            <td>
                                                                {["BN-5 Qop", "Bitum (5/M) melsiz", "Stakan kichik", "Stakan katta"].includes(item.productName)
                                                                    ? "kg"
                                                                    : "dona"}
                                                            </td>
                                                            <td>{NumberFormat(price)}</td>
                                                            <td>{NumberFormat(item.totalAmount)}</td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr className="card-doc-total">
                                                    <td colSpan="5"><strong>Jami:</strong></td>
                                                    <td><strong>{NumberFormat(items.reduce((a, s) => a + s.totalAmount, 0))}</strong></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Print qilish uchun yashirin komponent */}
                                <div style={{ display: 'none' }}>
                                    <PrintableComponent
                                        ref={printRef}
                                        dateKey={dateKey}
                                        items={items}
                                    />
                                </div>
                            </div>
                        );
                    })}
            </div>
        </Modal>
    );
};

export default DeliveryDisplayPrint;