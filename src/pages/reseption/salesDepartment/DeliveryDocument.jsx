import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { NumberFormat } from '../../../hook/NumberFormat';

const DeliveryDocument = ({ sale, contentRef, deliveryItems }) => {
    const calculateItemTotal = (item) => {
        const price = item.discountedPrice ?? item.pricePerUnit ?? 0;
        return price * item.quantity;
    };

    const totalAmount = deliveryItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);

    return (
        <div ref={contentRef} className="card-doc-wrapper">
            <h2 className="card-doc-title">Yuk Xati №{sale?._id?.slice(-4)}</h2>
            <p className="card-doc-date">{new Date(sale?.createdAt || Date.now()).toLocaleDateString('uz-UZ')} yil</p>
            <div className="card-doc-info">
                <p><strong>Yuboruvchi:</strong> "SELEN BUNYODKOR" MCHJ</p>
                <p><strong>Manzil:</strong> Namangan viloyati, Pop tumani, Gilkor MFY, Istiqbol</p>
                <p><strong>Mijoz:</strong> {sale?.customerId?.name || 'Noma\'lum'}</p>
                <p><strong>Avtotransport:</strong> {sale?.transport || 'Belgilanmagan'}</p>
            </div>
            <table className="card-doc-table">
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Mahsulot nomi</th>
                        <th>Miqdori</th>
                        <th>O‘lchov</th>
                        <th>Narxi</th>
                        <th>Qiymat</th>
                    </tr>
                </thead>
                <tbody>
                    {deliveryItems.map((item, index) => {
                        const price = item.discountedPrice ?? item.pricePerUnit ?? 0;
                        return (
                            <tr key={item.productId + '-' + index}>
                                <td>{index + 1}</td>
                                <td>{item.productName}</td>
                                <td>{item.quantity}</td>
                                <td>{item.size}</td>
                                <td>{NumberFormat(price)}</td>
                                <td>{NumberFormat(calculateItemTotal(item))}</td>
                            </tr>
                        );
                    })}
                    <tr className="card-doc-total">
                        <td colSpan="5">Jami:</td>
                        <td>{NumberFormat(totalAmount)}</td>
                    </tr>
                </tbody>
            </table>
            <p className="card-doc-contact">
                Biz bilan ishlaganingizdan minnatdormiz! Taklif va shikoyatlar uchun QR kodni skanerlang yoki quyidagi
                raqamlarga qo'ng'iroq qiling: +998 94 184 10 00, +998 33 184 10 00
            </p>
            <div className="card-doc-sign">
                <div><strong>Berdi:</strong> _____________________</div>
                <div className="card-doc-qr">
                    <QRCodeCanvas value={window.location.origin + '/feedback'} size={100} />
                </div>
                <div><strong>Oldim:</strong> _____________________</div>
            </div>
        </div>
    );
};

export default DeliveryDocument;
