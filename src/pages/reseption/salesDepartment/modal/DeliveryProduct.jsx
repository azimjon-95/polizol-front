import React, { useCallback, useRef, useState, useMemo, useEffect } from "react";
import { useDeliverProductMutation } from "../../../../context/cartSaleApi";
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

const DeliveryProduct = ({
  deliveryItems,
  handleDeliveryItemChange,
  closeModal,
  modalState,
}) => {
  const [deliverProduct, { isLoading }] = useDeliverProductMutation();
  const role = localStorage.getItem("role");
  const inputRef = useRef(null);
  const contentRef = useRef();
  const dropdownRef = useRef(null);

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

  // Format number function
  const formatNumber = (num) =>
    num || num === 0
      ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : "";

  // Format currency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  // Format date function
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

  // Calculate item total
  const calculateItemTotal = (item) => {
    const price = item.discountedPrice ?? item.pricePerUnit ?? 0;
    return price * item.quantity;
  };

  // Handle group change
  const handleGroupChange = (group) => {
    setDeliveredGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  // Handle transport cost change
  const handleTransportCostChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const numberValue = Number(raw) || 0;
    setTransportCost(numberValue);
    setCustomerInfo((prev) => ({ ...prev, transportCost: numberValue }));
  }, []);

  // Handle customer info change
  const handleCustomerInfoChange = useCallback((field, value) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Handle transport select
  const handleTransportSelect = useCallback((transport) => {
    setCustomerInfo((prev) => ({ ...prev, transport }));
    setIsTransportDropdownOpen(false);
  }, []);

  // Toggle transport dropdown
  const toggleTransportDropdown = useCallback(() => {
    setIsTransportDropdownOpen((prev) => !prev);
  }, []);

  // Formatted transport cost
  const formattedTransportCost = useMemo(
    () => formatNumber(transportCost),
    [transportCost]
  );

  // Valid items for delivery
  const validItems = useMemo(
    () =>
      deliveryItems
        .filter((item) => item.selected && item.deliveryQuantity !== "")
        .map((item) => ({
          _id: item._id,
          productId: item.productId,
          quantity: Number(item.deliveryQuantity), // Convert string to number for server
          productName: item.productName,
          size: item.size,
          pricePerUnit: item.discountedPrice,
          discountedPrice: item.discountedPrice,
        })),
    [deliveryItems]
  );

  // React to print configuration
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
      toast.error("Chop etishda xatolik yuz berdi. Iltimos, qayta urining.", {
        position: "top-right",
        autoClose: 3000,
      });
    },
  });

  // Effect for printing when printData is set
  useEffect(() => {
    if (printData) {
      const timeout = setTimeout(() => {
        reactToPrintFn();
        setPrintData(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [printData, reactToPrintFn]);

  // Process delivery function
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

      // Set print data for successful delivery
      setPrintData([
        {
          saleId: modalState.activeSaleId,
          items: validItems,
          createdAt: new Date(),
          transport: customerInfo.transport,
          transportCost: customerInfo.transportCost || 0,
        },
      ]);

      toast.success(updatedSale.message || "Mahsulotlar yuborildi!");
      closeModal();
    } catch (error) {
      toast.error(error.data.message || "Mahsulotlarni yuborishda xatolik yuz berdi!");
    }
  }, [
    validItems,
    modalState.activeSaleId,
    customerInfo.transport,
    customerInfo.transportCost,
    deliveredGroups,
    deliverProduct,
    closeModal,
  ]);

  return (
    <div>
      {/* MODAL */}
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

              {/* Transport Cost */}
              <div className="card-summary-row">
                <span>Transport harajati: (so'm)</span>
                <input
                  type="text"
                  value={formattedTransportCost}
                  onChange={handleTransportCostChange}
                  className="card-price-input"
                  style={{ width: "100%", border: "1px solid #d9d9d9" }}
                  aria-label="Transport cost"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Selected Products */}
            <h4>Tanlangan mahsulotlar:</h4>
            {deliveryItems.map((item, index) => (
              <div key={index} className="invoice-delivery-item">
                <label>
                  {role !== "direktor" && item.remaining > 0 && (
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
                  {item.productName || "Noma'lum"}
                </label>
                <div>
                  Buyurtma qilingan: {(item.ordered || 0).toLocaleString()}{" "}
                  {item.size || "dona"}
                </div>
                <div>
                  Yuborilgan: {(item.delivered || 0).toLocaleString()}{" "}
                  {item.size || "dona"}
                </div>
                <div>
                  Qoldiq: {(item.remaining || 0).toLocaleString()}{" "}
                  {item.size || "dona"}
                </div>
                {item.selected && (
                  <input
                    type="text"
                    value={item.deliveryQuantity || ""}
                    placeholder={`Yuborish miqdori: ${item.remaining}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      const numVal = parseInt(val.replace(/\D/g, ""));
                      if (
                        val === "" ||
                        (!isNaN(numVal) &&
                          numVal >= 1 &&
                          numVal <= item.remaining)
                      ) {
                        handleDeliveryItemChange(
                          index,
                          "deliveryQuantity",
                          val
                        );
                      }
                    }}
                    className="card-price-input"
                    style={{ width: "100%", border: "1px solid #d9d9d9" }}
                    aria-label="Delivery quantity"
                  />
                )}
              </div>
            ))}

            {/* Worker Groups */}
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

            {/* Confirm Button */}
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

      {/* PRINT SECTION */}
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
                  Yuk Xati (Sotuv №{doc.saleId?.slice(-4) || 'N/A'})
                </h2>
                <p className="card-doc-date">{formatDate(doc.createdAt)}</p>

                <div className="card-doc-info">
                  <p>
                    <strong>Mijoz:</strong>{" "}
                    {saleCar?.innerData?.customerId?.name || "Noma'lum"}
                  </p>
                  <p>
                    <strong>Avtotransport:</strong>{" "}
                    {doc.transport || "Belgilanmagan"}
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
                      const total = calculateItemTotal(item);
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{item.productName || "Noma'lum"}</td>
                          <td>{(item.quantity || 0).toLocaleString()}</td>
                          <td>{item.size || "dona"}</td>
                          <td>{NumberFormat(price)}</td>
                          <td>{NumberFormat(total)}</td>
                        </tr>
                      );
                    })}
                    <tr className="card-doc-total">
                      <td colSpan="5"><strong>Jami:</strong></td>
                      <td><strong>{NumberFormat(totalAmount)}</strong></td>
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


















// import React, { useCallback, useRef, useState, useMemo, useEffect } from "react";
// import { useDeliverProductMutation } from "../../../../context/cartSaleApi";
// import { toast } from "react-toastify";
// import { QRCodeCanvas } from "qrcode.react";
// import { Button, Modal } from "antd";
// import {
//   useGetTransportQuery,
//   useGetSaleCartByIdQuery,
// } from "../../../../context/cartSaleApi";
// import { useReactToPrint } from "react-to-print";
// import { NumberFormat } from "../../../../hook/NumberFormat";
// import { capitalizeFirstLetter } from "../../../../hook/CapitalizeFirstLitter";
// import "./style.css";

// const DeliveryProduct = ({
//   deliveryItems,
//   handleDeliveryItemChange,
//   closeModal,
//   modalState,
// }) => {

//   const [deliverProduct, { isLoading }] = useDeliverProductMutation();
//   const role = localStorage.getItem("role");
//   const inputRef = useRef(null);
//   const contentRef = useRef();
//   const dropdownRef = useRef(null);

//   const [transportCost, setTransportCost] = useState(0);
//   const [printData, setPrintData] = useState(null);
//   const [isTransportDropdownOpen, setIsTransportDropdownOpen] = useState(false);
//   const [deliveredGroups, setDeliveredGroups] = useState(["polizol"]);
//   const [customerInfo, setCustomerInfo] = useState({
//     transport: "",
//     transportCost: 0,
//   });

//   const { data: transport = { innerData: [] } } = useGetTransportQuery();
//   const { data: saleCar = { innerData: [] } } = useGetSaleCartByIdQuery(
//     modalState.activeSaleId
//   );

//   const groups = ["polizol", "Okisleniya", "ruberoid"];

//   // Format number function
//   const formatNumber = (num) =>
//     num || num === 0
//       ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
//       : "";

//   // Format currency function
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
//   };

//   // Format date function
//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("uz-UZ", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   // Calculate item total
//   const calculateItemTotal = (item) => {
//     const price = item.discountedPrice ?? item.pricePerUnit ?? 0;
//     return price * item.quantity;
//   };

//   // Handle group change
//   const handleGroupChange = (group) => {
//     setDeliveredGroups((prev) =>
//       prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
//     );
//   };

//   // Handle transport cost change
//   const handleTransportCostChange = useCallback((e) => {
//     const raw = e.target.value.replace(/\D/g, "");
//     const numberValue = Number(raw) || 0;
//     setTransportCost(numberValue);
//     setCustomerInfo((prev) => ({ ...prev, transportCost: numberValue }));
//   }, []);

//   // Handle customer info change
//   const handleCustomerInfoChange = useCallback((field, value) => {
//     setCustomerInfo((prev) => ({ ...prev, [field]: value }));
//   }, []);

//   // Handle transport select
//   const handleTransportSelect = useCallback((transport) => {
//     setCustomerInfo((prev) => ({ ...prev, transport }));
//     setIsTransportDropdownOpen(false);
//   }, []);

//   // Toggle transport dropdown
//   const toggleTransportDropdown = useCallback(() => {
//     setIsTransportDropdownOpen((prev) => !prev);
//   }, []);

//   // Formatted transport cost
//   const formattedTransportCost = useMemo(
//     () => formatNumber(transportCost),
//     [transportCost]
//   );

//   // Valid items for delivery
//   const validItems = useMemo(
//     () =>
//       deliveryItems
//         .filter((item) => item.selected && item.deliveryQuantity > 0)
//         .map((item) => ({
//           _id: item._id,
//           productId: item.productId,
//           quantity: item.deliveryQuantity,
//           productName: item.productName,
//           size: item.size,
//           pricePerUnit: item.discountedPrice,
//           discountedPrice: item.discountedPrice,
//         })),
//     [deliveryItems]
//   );
//   // React to print configuration
//   const reactToPrintFn = useReactToPrint({
//     contentRef,
//     pageStyle: `
//       @page {
//         size: 80mm auto;
//         margin: 0;
//       }
//       @media print {
//         body { margin: 0; }
//         * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
//         .card-doc-table th, .card-doc-table td { display: table-cell !important; }
//         .card-doc-page { page-break-after: always; }
//       }`,
//     onPrintError: () => {
//       toast.error("Chop etishda xatolik yuz berdi. Iltimos, qayta urining.", {
//         position: "top-right",
//         autoClose: 3000,
//       });
//     },
//   });

//   // Effect for printing when printData is set
//   useEffect(() => {
//     if (printData) {
//       const timeout = setTimeout(() => {
//         reactToPrintFn();
//         setPrintData(null);
//       }, 300);
//       return () => clearTimeout(timeout);
//     }
//   }, [printData, reactToPrintFn]);

//   // Process delivery function
//   const processDelivery = useCallback(async () => {
//     if (validItems.length === 0) {
//       toast.error("Iltimos, yuborish uchun mahsulot va miqdor tanlang");
//       return;
//     }
//     if (!customerInfo.transport) {
//       toast.error("Iltimos, avtotransportni tanlang");
//       return;
//     }

//     try {
//       const payload = {
//         saleId: modalState.activeSaleId,
//         items: validItems,
//         transport: customerInfo.transport,
//         transportCost: customerInfo.transportCost || 0,
//         deliveredGroups: deliveredGroups,
//       };

//       const updatedSale = await deliverProduct(payload).unwrap();

//       // Set print data for successful delivery
//       setPrintData([
//         {
//           saleId: modalState.activeSaleId,
//           items: validItems,
//           createdAt: new Date(),
//           transport: customerInfo.transport,
//           transportCost: customerInfo.transportCost || 0,
//         },
//       ]);

//       toast.success(updatedSale.message || "Mahsulotlar yuborildi!");
//       closeModal();
//     } catch (error) {
//       toast.error(error.data.message || "Mahsulotlarni yuborishda xatolik yuz berdi!");
//     }
//   }, [
//     validItems,
//     modalState.activeSaleId,
//     customerInfo.transport,
//     customerInfo.transportCost,
//     deliveredGroups,
//     deliverProduct,
//     closeModal,
//   ]);

//   return (
//     <div>
//       {/* MODAL */}
//       <Modal
//         className="modaldiliver-box"
//         open={modalState.isDeliveryModalOpen}
//         onCancel={closeModal}
//         footer={null}
//         title="Mahsulot yuborish"
//         destroyOnClose
//       >
//         <div className="modaldiliver">
//           <div className="invoice-delivery-form">
//             <div className="invoice-delivery-box">
//               {/* Transport Selection */}
//               <div className="card-summary-row relative">
//                 <span>Avtotransport:</span>
//                 <input
//                   ref={inputRef}
//                   type="text"
//                   value={customerInfo.transport}
//                   onChange={(e) =>
//                     handleCustomerInfoChange("transport", e.target.value)
//                   }
//                   onClick={toggleTransportDropdown}
//                   className="card-price-input"
//                   style={{ width: "100%", border: "1px solid #d9d9d9" }}
//                   aria-label="Transport details"
//                   placeholder="50ZZ500Z Fura..."
//                   required
//                 />
//                 {isTransportDropdownOpen && (
//                   <div ref={dropdownRef} className="isTransportDropdownOpen">
//                     {transport.innerData.map((item, index) => (
//                       <button
//                         key={index}
//                         onClick={() => handleTransportSelect(item.transport)}
//                         className="card-transport-option"
//                       >
//                         {item.transport}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Transport Cost */}
//               <div className="card-summary-row">
//                 <span>Transport harajati: (so'm)</span>
//                 <input
//                   type="text"
//                   value={formattedTransportCost}
//                   onChange={handleTransportCostChange}
//                   className="card-price-input"
//                   style={{ width: "100%", border: "1px solid #d9d9d9" }}
//                   aria-label="Transport cost"
//                   placeholder="0"
//                 />
//               </div>
//             </div>

//             {/* Selected Products */}
//             <h4>Tanlangan mahsulotlar:</h4>
//             {deliveryItems.map((item, index) => (
//               <div key={index} className="invoice-delivery-item">
//                 <label>
//                   {role !== "direktor" && item.remaining > 0 && (
//                     <input
//                       type="checkbox"
//                       checked={item.selected || false}
//                       onChange={(e) =>
//                         handleDeliveryItemChange(
//                           index,
//                           "selected",
//                           e.target.checked
//                         )
//                       }
//                     />
//                   )}
//                   {item.productName || "Noma'lum"}
//                 </label>
//                 <div>
//                   Buyurtma qilingan: {(item.ordered || 0).toLocaleString()}{" "}
//                   {item.size || "dona"}
//                 </div>
//                 <div>
//                   Yuborilgan: {(item.delivered || 0).toLocaleString()}{" "}
//                   {item.size || "dona"}
//                 </div>
//                 <div>
//                   Qoldiq: {(item.remaining || 0).toLocaleString()}{" "}
//                   {item.size || "dona"}
//                 </div>
//                 {item.selected && (
//                   <input
//                     type="number"
//                     min="1"
//                     max={item.remaining}
//                     value={item.deliveryQuantity || ""}
//                     placeholder={`Yuborish miqdori: ${item.remaining}`}
//                     onChange={(e) => {
//                       const val = e.target.value;
//                       if (
//                         val === "" ||
//                         (parseInt(val) >= 1 && parseInt(val) <= item.remaining)
//                       ) {
//                         handleDeliveryItemChange(
//                           index,
//                           "deliveryQuantity",
//                           val === "" ? "" : parseInt(val)
//                         );
//                       }
//                     }}
//                   />
//                 )}
//               </div>
//             ))}

//             {/* Worker Groups */}
//             <div className="invoice-delivery-form-radio">
//               <span>Ishchi guruh:</span>
//               <div className="delivery-form-radio-box">
//                 {groups.map((group) => (
//                   <Button
//                     className="delivery-form-radio-box-button"
//                     key={group}
//                     type={deliveredGroups.includes(group) ? "primary" : "default"}
//                     onClick={() => handleGroupChange(group)}
//                   >
//                     {capitalizeFirstLetter(group)}
//                   </Button>
//                 ))}
//               </div>
//             </div>

//             {/* Confirm Button */}
//             {role !== "direktor" && (
//               <Button
//                 className="invoice-btn invoice-btn-success"
//                 onClick={processDelivery}
//                 disabled={isLoading}
//                 loading={isLoading}
//                 type="primary"
//               >
//                 Yuborishni tasdiqlash
//               </Button>
//             )}
//           </div>
//         </div>
//       </Modal>

//       {/* PRINT SECTION */}
//       {printData && Array.isArray(printData) && (
//         <div ref={contentRef} className="card-doc-wrapper">
//           {printData.map((doc, docIndex) => {
//             const totalAmount = (doc.items || []).reduce(
//               (sum, item) => sum + calculateItemTotal(item),
//               0
//             );

//             return (
//               <div key={docIndex} className="card-doc-page">
//                 <h2 className="card-doc-title">
//                   Yuk Xati (Sotuv №{doc.saleId?.slice(-4) || 'N/A'})
//                 </h2>
//                 <p className="card-doc-date">{formatDate(doc.createdAt)}</p>

//                 <div className="card-doc-info">
//                   <p>
//                     <strong>Mijoz:</strong>{" "}
//                     {saleCar?.innerData?.customerId?.name || "Noma'lum"}
//                   </p>
//                   <p>
//                     <strong>Avtotransport:</strong>{" "}
//                     {doc.transport || "Belgilanmagan"}
//                   </p>
//                   <p>
//                     <strong>Transport xarajati:</strong>{" "}
//                     {formatCurrency(doc.transportCost || 0)}
//                   </p>
//                 </div>

//                 <table className="card-doc-table">
//                   <thead>
//                     <tr>
//                       <th>№</th>
//                       <th>Mahsulot nomi</th>
//                       <th>Miqdori</th>
//                       <th>O'lchov</th>
//                       <th>Narxi</th>
//                       <th>Qiymat</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {doc.items.map((item, index) => {
//                       const price = item.discountedPrice ?? item.pricePerUnit ?? 0;
//                       const total = calculateItemTotal(item);
//                       return (
//                         <tr key={index}>
//                           <td>{index + 1}</td>
//                           <td>{item.productName || "Noma'lum"}</td>
//                           <td>{(item.quantity || 0).toLocaleString()}</td>
//                           <td>{item.size || "dona"}</td>
//                           <td>{NumberFormat(price)}</td>
//                           <td>{NumberFormat(total)}</td>
//                         </tr>
//                       );
//                     })}
//                     <tr className="card-doc-total">
//                       <td colSpan="5"><strong>Jami:</strong></td>
//                       <td><strong>{NumberFormat(totalAmount)}</strong></td>
//                     </tr>
//                   </tbody>
//                 </table>

//                 <div className="card-doc-sign">
//                   <div>
//                     <strong>Berdi:</strong> _____________________
//                   </div>
//                   <div className="card-doc-qr">
//                     <QRCodeCanvas
//                       value={`${window.location.origin}/feedback`}
//                       size={90}
//                       level="M"
//                     />
//                   </div>
//                   <div>
//                     <strong>Oldim:</strong> _____________________
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default DeliveryProduct;




