import React, {
  useCallback,
  useRef,
  useState,
  useMemo,
  useEffect,
} from "react";
import { useDeliverProductMutation } from "../../../../context/cartSaleApi";
import { useGetUndeliveredItemsByCustomerQuery } from "../../../../context/cartSaleApi";
import { toast } from "react-toastify";
import { QRCodeCanvas } from "qrcode.react";
import { Button, Modal } from "antd";
import {
  useGetTransportQuery,
  useGetSaleCartByIdQuery,
} from "../../../../context/cartSaleApi";
import { useReactToPrint } from "react-to-print";
import { NumberFormat } from "../../../../hook/NumberFormat";
import { capitalizeFirstLetter } from "../../../../hook/CapitalizeFirstLitter";
import "./style.css";

const DeliveryProduct = ({ closeModal, modalState }) => {
  const [deliverProduct, { isLoading }] = useDeliverProductMutation();
  const { data: undeliveredData } = useGetUndeliveredItemsByCustomerQuery(
    modalState.activeSaleId,
    {
      skip: !modalState.activeSaleId,
    }
  );

  const role = localStorage.getItem("role");
  const contentRef = useRef();
  const dropdownRef = useRef();
  const inputRef = useRef();

  const [transportCost, setTransportCost] = useState(0);
  const [printData, setPrintData] = useState(null);
  const [isTransportDropdownOpen, setIsTransportDropdownOpen] = useState(false);
  const [deliveredGroups, setDeliveredGroups] = useState(["polizol"]);
  const [customerInfo, setCustomerInfo] = useState({
    transport: "",
    transportCost: 0,
  });

  const { data: transport = { innerData: [] } } = useGetTransportQuery();
  const { data: saleCar = { innerData: [] } } = useGetSaleCartByIdQuery(
    modalState.activeSaleId
  );

  const groups = ["polizol", "Okisleniya", "ruberoid"];

  // Mahsulotlarni API dan olib, avtomatik to'liq miqdorda tanlab qo'yamiz
  const [deliveryItems, setDeliveryItems] = useState([]);

  useEffect(() => {
    if (undeliveredData?.innerData?.overallResult) {
      const items = undeliveredData.innerData.overallResult.map((item) => ({
        ...item,
        selected: item.remaining > 0, // Faqat qoldig'i bo'lsa tanlaymiz
        deliveryQuantity: item.remaining > 0 ? item.remaining : 0, // To'liq qoldiq miqdor
      }));
      setDeliveryItems(items);
    }
  }, [undeliveredData]);

  // Format funksiyalari
  const formatNumber = (num) =>
    num || num === 0
      ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : "";

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

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

  const calculateItemTotal = (item) => {
    const price = item.discountedPrice ?? item.pricePerUnit ?? 0;
    return price * item.quantity;
  };

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

  const toggleTransportDropdown = useCallback(() => {
    setIsTransportDropdownOpen((prev) => !prev);
  }, []);

  const formattedTransportCost = useMemo(
    () => formatNumber(transportCost),
    [transportCost]
  );

  // Yuboriladigan mahsulotlar — faqat selected va miqdori > 0 bo'lganlar
  const validItems = useMemo(
    () =>
      deliveryItems
        .filter((item) => item.selected && item.deliveryQuantity > 0)
        .map((item) => ({
          _id: item._id,
          productId: item.productId,
          quantity: Number(item.deliveryQuantity),
          productName: item.productName,
          size: item.size,
          pricePerUnit: item.discountedPrice,
          discountedPrice: item.discountedPrice,
        })),
    [deliveryItems]
  );

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
        .card-doc-page { page-break-after: always; }
      }`,
    onPrintError: () => {
      toast.error("Chop etishda xatolik yuz berdi. Iltimos, qayta urining.");
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

  const processDelivery = useCallback(async () => {
    if (validItems.length === 0) {
      toast.error("Yuborish uchun mahsulot topilmadi");
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
      console.log(updatedSale);

      toast.success(updatedSale.message || "Mahsulotlar muvaffaqiyatli yuborildi!");
      setPrintData([
        {
          saleId: modalState.activeSaleId,
          items: validItems,
          createdAt: new Date(),
          transport: customerInfo.transport,
          transportCost: customerInfo.transportCost || 0,
        },
      ]);

      closeModal();
    } catch (error) {
      toast.error(
        error.data?.message || "Mahsulotlarni yuborishda xatolik yuz berdi!"
      );
    }
  }, [
    validItems,
    modalState.activeSaleId,
    customerInfo,
    deliveredGroups,
    deliverProduct,
    closeModal,
  ]);

  return (
    <div>
      <Modal
        className="modaldiliver-box"
        open={modalState.isDeliveryModalOpen}
        onCancel={closeModal}
        footer={null}
        title="Mahsulot yuborish"
        destroyOnClose
      >
        <div className="modaldiliver">
          <div className="invoice-delivery-form">
            <div className="invoice-delivery-box">
              {/* Transport Selection */}
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

              {/* Transport Cost */}
              <div className="card-summary-row">
                <span>Transport harajati: (so'm)</span>
                <input
                  type="text"
                  value={formattedTransportCost}
                  onChange={handleTransportCostChange}
                  className="card-price-input"
                  style={{ width: "100%", border: "1px solid #d9d9d9" }}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Mahsulotlar ro'yxati — faqat ko'rsatish uchun */}
            <h4>Yuboriladigan mahsulotlar:</h4>
            {deliveryItems
              .filter((item) => item.remaining > 0)
              .map((item, index) => (
                <div key={index} className="invoice-delivery-item">
                  <div>
                    <strong>{item.productName || "Noma'lum"}</strong>
                  </div>
                  {/* <div>Buyurtma: {item.ordered?.toLocaleString()} {item.size}</div> */}
                  <div>
                    <strong>Yuborilmoqda: {item.remaining?.toLocaleString()} {item.size}</strong>
                  </div>
                </div>
              ))}

            {/* Ishchi guruh */}
            <div className="invoice-delivery-form-radio">
              <span>Ishchi guruh:</span>
              <div className="delivery-form-radio-box">
                {groups.map((group) => (
                  <Button
                    className="delivery-form-radio-box-button"
                    key={group}
                    type={deliveredGroups.includes(group) ? "primary" : "default"}
                    onClick={() => handleGroupChange(group)}
                  >
                    {capitalizeFirstLetter(group)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tasdiqlash tugmasi */}
            {role !== "direktor" && (
              <Button
                className="invoice-btn invoice-btn-success"
                onClick={processDelivery}
                disabled={isLoading}
                loading={isLoading}
                type="primary"
              >
                Yuborishni tasdiqlash
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Chop etish qismi */}
      {printData && Array.isArray(printData) && (
        <div ref={contentRef} className="card-doc-wrapper">
          {printData.map((doc, docIndex) => {
            const totalAmount = (doc.items || []).reduce(
              (sum, item) => sum + calculateItemTotal(item),
              0
            );
            return (
              <div key={docIndex} className="card-doc-page">
                <h2 className="card-doc-title">
                  Yuk Xati (Sotuv №{doc.saleId?.slice(-4) || "N/A"})
                </h2>
                <p className="card-doc-date">{formatDate(doc.createdAt)}</p>
                <div className="card-doc-info">
                  <p>
                    <strong>Mijoz:</strong>{" "}
                    {saleCar?.innerData?.customerId?.name || "Noma'lum"}
                  </p>
                  <p>
                    <strong>Avtotransport:</strong> {doc.transport || "Belgilanmagan"}
                  </p>
                  <p>
                    <strong>Transport xarajati:</strong>{" "}
                    {formatCurrency(doc.transportCost || 0)}
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
                    {doc.items.map((item, index) => {
                      const price = item.discountedPrice ?? item.pricePerUnit ?? 0;
                      const total = price * item.quantity;
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{item.productName || "Noma'lum"}</td>
                          <td>{item.quantity?.toLocaleString()}</td>
                          <td>{item.size || "dona"}</td>
                          <td>{NumberFormat(price)}</td>
                          <td>{NumberFormat(total)}</td>
                        </tr>
                      );
                    })}
                    <tr className="card-doc-total">
                      <td colSpan="5">
                        <strong>Jami:</strong>
                      </td>
                      <td>
                        <strong>{NumberFormat(totalAmount)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="card-doc-sign">
                  <div>
                    <strong>Berdi:</strong> _____________________
                  </div>
                  <div className="card-doc-qr">
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeliveryProduct;