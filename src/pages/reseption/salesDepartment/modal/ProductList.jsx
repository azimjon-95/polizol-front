import React from 'react'

const ProductList = ({
    currentSale,
    closeModal,
    modalState,
    NumberFormat,
    Modal
}) => {
    return (
        <div>
            <Modal
                isOpen={modalState.isItemsModalOpen}
                onClose={closeModal}
                title="Mahsulotlar ro'yxati"
            >
                <div className="invoice-items-grid">
                    {currentSale?.items?.length ? (
                        currentSale.items.map((item, index) => {
                            const quantity = item.quantity || 0;
                            const delivered = item.deliveredQuantity || 0;
                            const remaining = quantity - delivered;
                            const price = item.discountedPrice || 0;
                            const ndsRate = item.ndsRate || 0;
                            const total = quantity * price;
                            const ndsAmount = (total * ndsRate) / 100;
                            const totalAmountNds = total + ndsAmount;
                            return (
                                <div key={index} className="invoice-item-card">
                                    <div className="invoice-item-header">
                                        {item.productName || 'Noma\'lum'} ({item.category || 'Noma\'lum'})
                                    </div>
                                    <div className="invoice-item-details">
                                        <div>Miqdor: {(item.quantity || 0).toLocaleString()} {item.size || 'dona'}</div>
                                        <div>Yuborilgan: {(item.deliveredQuantity || 0).toLocaleString()} {item.size || 'dona'}</div>
                                        <div>Qoldiq: {remaining.toLocaleString()} {item.size || 'dona'}</div>
                                        <div>Narx: {NumberFormat(item.discountedPrice || 0)}</div>
                                        <div>QQS: {(item.ndsRate || 0)}%</div>
                                        <div>QQS summa: {NumberFormat(Math.floor(item.ndsAmount || 0))} so'm</div>
                                        <div>Jami QQS summa: {NumberFormat(Math.floor(item.quantity * item.ndsAmount || 0))} so'm</div>
                                    </div>
                                    <div className="invoice-item-total">
                                        Jami: {NumberFormat(totalAmountNds)}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p>Mahsulotlar topilmadi</p>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default ProductList
