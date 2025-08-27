import React, {
  useCallback,
  useRef,
  useState,
  useMemo,
  useEffect,
} from "react";
import { useDeliverProductMutation } from "../../../../context/cartSaleApi";
import { Truck as DeliveryIcon } from "lucide-react";
import {
  Package,
  Calendar,
  Truck,
  DollarSign,
  Hash,
  Printer,
} from "lucide-react";
import { toast } from "react-toastify";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "antd";
import {
  useGetTransportQuery,
  useGetSaleCartByIdQuery,
} from "../../../../context/cartSaleApi";
import { useReactToPrint } from "react-to-print";
import { NumberFormat } from "../../../../hook/NumberFormat";
import "./style.css";

const DeliveryProduct = ({
  deliveryItems,
  handleDeliveryItemChange,
  Modal,
  closeModal,
  modalState,
}) => {
  const [deliverProduct, { isLoading }] = useDeliverProductMutation();
  const role = localStorage.getItem("role");
  const inputRef = useRef(null);
  const [transportCost, setTransportCost] = useState(0);
  const formatNumber = (num) =>
    num || num === 0
      ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : "";
  const dropdownRef = useRef(null);
  const { data: transport = { innerData: [] } } = useGetTransportQuery();
  const { data: saleCar = { innerData: [] } } = useGetSaleCartByIdQuery(
    modalState.activeSaleId
  );

  const contentRef = useRef();
  const [printData, setPrintData] = useState(null);
  const [isTransportDropdownOpen, setIsTransportDropdownOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    transport: "",
    transportCost: 0,
  });

  const [deliveredGroups, setDeliveredGroups] = useState(["polizol"]);
  const handleGroupChange = (group) => {
    setDeliveredGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const handleTransportCostChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const numberValue = Number(raw) || 0;
    setTransportCost(numberValue);
    setCustomerInfo((prev) => ({ ...prev, transportCost: numberValue }));
  }, []);

  const handleCustomerInfoChange = useCallback((field, value) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleTransportSelect = useCallback((transport) => {
    setCustomerInfo((prev) => ({ ...prev, transport }));
    setIsTransportDropdownOpen(false);
  }, []);

  const reactToPrintFn = useReactToPrint({
    contentRef,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body { margin: 0; }
        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        .card-doc-table th, .card-doc-table td { display: table-cell !important; }
      }`,
    onPrintError: () => {
      toast.error("Chop etishda xatolik yuz berdi. Iltimos, qayta urining.", {
        position: "top-right",
        autoClose: 3000,
      });
    },
  });

  useEffect(() => {
    if (printData) {
      const timeout = setTimeout(() => {
        reactToPrintFn();
        setPrintData(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [printData, reactToPrintFn]);

  const validItems = useMemo(
    () =>
      deliveryItems
        .filter((item) => item.selected && item.deliveryQuantity > 0)
        .map((item) => ({
          productId: item._id,
          quantity: item.deliveryQuantity,
          productName: item.productName,
          size: item.size,
          pricePerUnit: item.pricePerUnit,
          discountedPrice: item.discountedPrice,
        })),
    [deliveryItems]
  );

  const processDelivery = useCallback(async () => {
    if (validItems.length === 0) {
      toast.error("Iltimos, yuborish uchun mahsulot va miqdor tanlang");
      return;
    }
    if (!customerInfo.transport) {
      toast.error("Iltimos, avtotransportni tanlang");
      return;
    }
    try {
      const payload = {
        saleId: modalState.activeSaleId,
        items: validItems,
        transport: customerInfo.transport,
        transportCost: customerInfo.transportCost || 0,
        deliveredGroups: deliveredGroups,
      };
      const updatedSale = await deliverProduct(payload).unwrap();
      setPrintData({
        saleId: modalState.activeSaleId,
        items: validItems,
        createdAt: new Date(),
        transport: customerInfo.transport,
        transportCost: customerInfo.transportCost || 0,
      });
      toast.success(updatedSale.message || "Mahsulotlar yuborildi!");
      closeModal();
    } catch {
      toast.error("Mahsulotlarni yuborishda xatolik yuz berdi!");
    }
  }, [
    validItems,
    modalState.activeSaleId,
    customerInfo.transport,
    customerInfo.transportCost,
    deliverProduct,
    closeModal,
    deliveredGroups,
  ]);

  const calculateItemTotal = (item) => {
    const price = item.discountedPrice ?? item.pricePerUnit ?? 0;
    return price * item.quantity;
  };

  const formattedTransportCost = useMemo(
    () => formatNumber(transportCost),
    [transportCost]
  );

  const totalAmount = (printData?.items || []).reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );

  const toggleTransportDropdown = useCallback(() => {
    setIsTransportDropdownOpen((prev) => !prev);
  }, []);

  const handlePrintDeliveredItem = useCallback((item) => {
    setPrintData({
      saleId: item._id,
      items: [
        {
          productId: item._id,
          quantity: item.deliveredQuantity,
          productName: item.productName,
          size: item.size,
          pricePerUnit: item.totalAmount / item.deliveredQuantity,
          discountedPrice: item.discountedPrice,
        },
      ],
      createdAt: item.deliveryDate,
      transport: item.transport,
      transportCost: item.transportCost || 0,
    });
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  return (
    <>
      <Modal
        isOpen={modalState.isDeliveryModalOpen}
        onClose={closeModal}
        title="Mahsulot yuborish"
      >
        <div className="modaldiliver">
          <div className="invoice-delivery-form">
            <div className="invoice-delivery-box">
              <div className="card-summary-row relative">
                <span>Avtotransport:</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={customerInfo.transport}
                  onChange={(e) =>
                    handleCustomerInfoChange("transport", e.target.value)
                  }
                  onClick={toggleTransportDropdown}
                  className="card-price-input"
                  style={{ width: "100%", border: "1px solid #d9d9d9" }}
                  aria-label="Transport details"
                  placeholder="50ZZ500Z Fura..."
                  required
                />
                {isTransportDropdownOpen && (
                  <div ref={dropdownRef} className="isTransportDropdownOpen">
                    {transport.innerData.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleTransportSelect(item.transport)}
                        className="card-transport-option"
                      >
                        {item.transport}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="card-summary-row">
                <span>Transport harajati: (so'm)</span>
                <span>
                  <input
                    type="text"
                    value={formattedTransportCost}
                    onChange={handleTransportCostChange}
                    className="card-price-input"
                    style={{ width: "100%", border: "1px solid #d9d9d9" }}
                    aria-label="Transport cost"
                    placeholder="0"
                  />
                </span>
              </div>
            </div>
            <h4>Tanlangan mahsulotlar:</h4>
            {deliveryItems.map((item, index) => {
              const remaining =
                (item.quantity || 0) - (item.deliveredQuantity || 0);
              return (
                <div key={item._id || index} className="invoice-delivery-item">
                  <label>
                    {role !== "direktor" && (
                      <>
                        {remaining > 0 && (
                          <input
                            type="checkbox"
                            checked={item.selected || false}
                            onChange={(e) =>
                              handleDeliveryItemChange(
                                index,
                                "selected",
                                e.target.checked
                              )
                            }
                          />
                        )}
                      </>
                    )}
                    {item.productName || "Noma'lum"} (
                    {item.category || "Noma'lum"})
                  </label>
                  <div>
                    Buyurtma qilingan: {(item.quantity || 0).toLocaleString()}{" "}
                    {item.size || "dona"}
                  </div>
                  <div>
                    Yuborilgan: {(item.deliveredQuantity || 0).toLocaleString()}{" "}
                    {item.size || "dona"}
                  </div>
                  <div>
                    Qoldiq: {remaining.toLocaleString()} {item.size || "dona"}
                  </div>
                  {item.selected && (
                    <input
                      type="number"
                      min="1"
                      max={remaining}
                      value={item.deliveryQuantity || ""}
                      placeholder={`Yuborish miqdori: ${remaining}`}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (
                          val === "" ||
                          (parseInt(val) >= 1 && parseInt(val) <= remaining)
                        ) {
                          handleDeliveryItemChange(
                            index,
                            "deliveryQuantity",
                            val === "" ? "" : parseInt(val)
                          );
                        }
                      }}
                    />
                  )}
                </div>
              );
            })}
            {/* ["polizol", "Okisleniya", "ruberoid"]*/}
            <div className="invoice-delivery-form-radio">
              <span>Ishchi guruh:</span>
              <label>
                <input
                  type="checkbox"
                  name="deliveredGroup"
                  value="polizol"
                  checked={deliveredGroups.includes("polizol")}
                  onChange={() => handleGroupChange("polizol")}
                />
                Polizol
              </label>
              <label>
                <input
                  type="checkbox"
                  name="deliveredGroup"
                  value="Okisleniya"
                  checked={deliveredGroups.includes("Okisleniya")}
                  onChange={() => handleGroupChange("Okisleniya")}
                />
                Okisleniya
              </label>
              <label>
                <input
                  type="checkbox"
                  name="deliveredGroup"
                  value="ruberoid"
                  checked={deliveredGroups.includes("ruberoid")}
                  onChange={() => handleGroupChange("ruberoid")}
                />
                Ruberoid
              </label>
            </div>

            {role !== "direktor" && (
              <Button
                className="invoice-btn invoice-btn-success"
                onClick={processDelivery}
                disabled={isLoading}
                aria-label="Save changes"
                loading={isLoading}
              >
                Yuborishni tasdiqlash
              </Button>
            )}
          </div>
          {saleCar?.innerData?.deliveredItems?.length > 0 && (
            <div className="liu-deliveredItemsbox">
              <div className="liu-header">
                <Package className="liu-header-icon" />
                <h2 className="liu-title">Yetkazib berilgan mahsulotlar</h2>
              </div>

              <div className="liu-items-grid">
                {saleCar?.innerData?.deliveredItems &&
                  [...saleCar.innerData.deliveredItems]
                    .sort(
                      (a, b) =>
                        new Date(b.deliveryDate) - new Date(a.deliveryDate)
                    )
                    .map((item, index) => (
                      <div key={item._id} className="liu-item-card">
                        <div className="liu-card-header">
                          <div className="liu-product-info">
                            <h3 className="liu-product-name">
                              {item.productName}
                            </h3>
                            <span className="liu-product-id">
                              {" "}
                              Yuk Xati № {item?._id?.slice(-4)}
                            </span>
                          </div>
                          <div className="liu-quantity-badge">
                            <Hash className="liu-icon" />
                            {item.deliveredQuantity}
                          </div>
                        </div>

                        <div className="liu-card-body">
                          <div className="liu-info-row">
                            <div className="liu-info-item">
                              <Calendar className="liu-icon" />
                              <div>
                                <span className="liu-label">
                                  Yetkazib berish sanasi
                                </span>
                                <span className="liu-value">
                                  {formatDate(item.deliveryDate)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="liu-info-row">
                            <div className="liu-info-item">
                              <Truck className="liu-icon" />
                              <div>
                                <span className="liu-label">Transport</span>
                                <span className="liu-value">
                                  {item.transport}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="liu-amounts-section">
                            <div className="liu-amount-item">
                              <DollarSign className="liu-icon liu-icon-primary" />
                              <div>
                                <span className="liu-label">Umumiy summa</span>
                                <span className="liu-amount-primary">
                                  {formatCurrency(item.totalAmount)}
                                </span>
                              </div>
                            </div>

                            <div className="liu-amount-item">
                              <Truck className="liu-icon liu-icon-secondary" />
                              <div>
                                <span className="liu-label">
                                  Transport xarajati
                                </span>
                                <span className="liu-amount-secondary">
                                  {formatCurrency(item.transportCost)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="liu-card-footer">
                          <span className="liu-order-number">#{index + 1}</span>
                          <button
                            style={{ marginLeft: "4px" }}
                            className="invoice-btn invoice-btn-primary"
                            onClick={() => handlePrintDeliveredItem(item)}
                            title="Yuk Xatini chop etish"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {printData && (
        <div ref={contentRef} className="card-doc-wrapper">
          <h2 className="card-doc-title">
            Yuk Xati №{printData.saleId?.slice(-4)}
          </h2>
          <p className="card-doc-date">
            {new Date(printData.createdAt).toLocaleDateString("uz-UZ")} yil
          </p>
          <div className="card-doc-info">
            <p>
              <strong>Yuboruvchi:</strong> "SELEN BUNYODKOR" MCHJ
            </p>
            <p>
              <strong>Manzil:</strong> Namangan viloyati, Pop tumani, Gilkor
              MFY, Istiqbol
            </p>
            <p>
              <strong>Mijoz:</strong> {modalState?.customerName || "Noma'lum"}
            </p>
            <p>
              <strong>Avtotransport:</strong>{" "}
              {printData.transport || "Belgilanmagan"}
            </p>
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
              {printData.items.map((item, index) => {
                const price = item.discountedPrice ?? item.pricePerUnit ?? 0;
                const total = calculateItemTotal(item);
                return (
                  <tr key={item.productId + "-" + index}>
                    <td>{index + 1}</td>
                    <td>{item.productName || "Noma'lum"}</td>
                    <td>{item.quantity || 0}</td>
                    <td>{item.size || "dona"}</td>
                    <td>{NumberFormat(price)}</td>
                    <td>{NumberFormat(total)}</td>
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
            Biz bilan ishlaganingizdan minnatdormiz! Taklif va shikoyatlar uchun
            QR kodni skanerlang yoki quyidagi raqamlarga qo‘ng‘iroq qiling: +998
            94 184 10 00, +998 33 184 10 00
          </p>
          <div className="card-doc-sign">
            <div>
              <strong>Berdi:</strong> _____________________
            </div>
            <div className="card-doc-qr">
              <QRCodeCanvas
                value={window.location.origin + "/feedback"}
                size={100}
              />
            </div>
            <div>
              <strong>Oldim:</strong> _____________________
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeliveryProduct;
