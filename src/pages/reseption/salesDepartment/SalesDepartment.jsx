import React, { useState, useRef } from "react";
import {
  Package,
  FileText,
  User,
  ShoppingCart,
  Info,
} from "lucide-react";
import { SiSoundcharts } from "react-icons/si";
import betumImg from '../../../assets/betum.png';
import folygoizolImg from '../../../assets/folgizol.jpg';
import polizolImg from '../../../assets/polizol.jpg';
import praymerImg from '../../../assets/praymer.png';
import stakanImg from '../../../assets/stakanBN.png';
import bn5 from '../../../assets/bn5.png';
import { FaMoneyBillWave } from "react-icons/fa";

import ruberoidImg from '../../../assets/ruberoid.jpg';

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SalespersonManagement from "./salesPerson/SalespersonManagement";
import CartTab from "./CartTab";
import { useNavigate } from "react-router-dom";
import { Modal, Button, message } from "antd";
import { useSelector } from "react-redux";
import { useGetFinishedProductsQuery } from "../../../context/productionApi";
import { useGetFilteredSalesQuery } from "../../../context/cartSaleApi";
import "./style.css";
import SalesInvoiceDashboard from "./SalesInvoiceDashboard";

const SacodSalesModule = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const role = localStorage.getItem("role");
  const [activeTab, setActiveTab] = useState(
    role === "direktor" ? "sales" : "products"
  );
  const [paymentInfo, setPaymentInfo] = useState({
    totalAmount: 0,
    paidAmount: 0,
    discount: 0,
    paymentStatus: "partial",
  });
  const [salesperson] = useState("Azimjon Mamutaliyev");
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isReturnInfoModalOpen, setIsReturnInfoModalOpen] = useState(false);
  const [isDefectiveInfoModalOpen, setIsDefectiveInfoModalOpen] =
    useState(false); // New state for defective modal
  const [selectedReturnInfo, setSelectedReturnInfo] = useState(null);
  const [selectedDefectiveInfo, setSelectedDefectiveInfo] = useState(null); // New state for selected defective info
  const [contractInfo, setContractInfo] = useState({
    customerType: "individual",
    customerName: "",
    customerPhone: "",
    customerCompanyName: "",
    customerCompanyAddress: "",
    customerTaxId: "",
    paymentAmount: 0,
    paymentDescription: "",
    discounts: {},
  });

  const { data: finishedProducts } = useGetFinishedProductsQuery();
  const { data: filteredSales } = useGetFilteredSalesQuery();
  const filteredSalesLength = useSelector(
    (state) => state.length.filteredSalesLength
  );
  const searchPanelRef = useRef(null);

  const showLogoutModal = () => {
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    setIsLoggingOut(true);
    try {
      message.success("Muvaffaqiyatli tizimdan chiqdingiz!");
      setTimeout(() => {
        localStorage.clear();
        navigate("/login", { replace: true });
      }, 500);
    } catch (error) {
      message.error("Chiqishda xatolik yuz berdi!");
      console.error("Logout error:", error);
    } finally {
      setIsModalOpen(false);
      setIsLoggingOut(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const addToCart = (product, quantity = 1) => {


    // Update cart state
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item._id === product._id
      );
      let updatedCart;

      if (existingItemIndex !== -1) {
        // Update quantity for existing item
        updatedCart = prevCart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item to cart
        updatedCart = [
          ...prevCart,
          {
            ...product,
            quantity,
            discountedPrice: product.pricePerUnit || product.pricePerKg || 0,
          },
        ];
      }

      return updatedCart;
    });

    // Show toast notification after cart update
    toast.success(
      <div className="flex-items-center">Mahsulot savatga qo'shildi!</div>,
      {
        position: "top-right",
        autoClose: 3000,
        toastId: `add-to-cart-${product._id}-${Date.now()}`, // Unique toast ID
      }
    );
  };

  const calculateItemTotal = (item) => {
    if (item.type === "coal_paper") {
      return (item.discountedPrice || item.pricePerUnit) * item.quantity;
    }
    return (
      (item.discountedPrice || item.pricePerKg) *
      item.weightPerBag *
      item.quantity
    );
  };

  const calculateItemWeight = (item) => {
    if (item.type === "betum") {
      return item.weightPerBag * item.quantity;
    }
    return 0;
  };

  const calculatePoddonCount = (quantity) => {
    return Math.floor(quantity / 25);
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + calculateItemTotal(item),
      0
    );
    const discountAmount = (subtotal * paymentInfo.discount) / 100;
    return subtotal - discountAmount;
  };

  const handleContractDiscountChange = (productId, value) => {
    const product = finishedProducts.find((p) => p.id === productId);
    const maxPrice =
      product.type === "coal_paper" ? product.pricePerUnit : product.pricePerKg;
    const discountedPrice = Math.min(Number(value), maxPrice);
    setContractInfo({
      ...contractInfo,
      discounts: {
        ...contractInfo.discounts,
        [productId]: discountedPrice,
      },
    });
  };

  const completeContract = () => {
    if (!contractInfo.customerName || cart?.length === 0) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (contractInfo.paymentAmount > calculateTotal()) {
      toast.error("To'lov summasi yakuniy summadan oshib ketdi!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const updatedCart = cart?.map((item) => ({
      ...item,
      discountedPrice: contractInfo.discounts[item.id],
    }));

    const total = calculateTotal();
    const debt = total - contractInfo.paymentAmount;
    const newSale = {
      id: Date.now(),
      date: new Date().toLocaleDateString("uz-UZ"),
      time: new Date().toLocaleTimeString("uz-UZ"),
      customer: {
        name: contractInfo.customerName,
        type: contractInfo.customerType,
        phone: contractInfo.customerPhone,
        companyName: contractInfo.customerCompanyName,
        companyAddress: contractInfo.customerCompanyAddress,
        taxId: contractInfo.customerTaxId,
      },
      items: updatedCart?.map((item) => ({
        ...item,
        pricePerUnit:
          item.type === "coal_paper"
            ? item.discountedPrice || item.pricePerUnit
            : undefined,
        pricePerKg:
          item.type === "betum"
            ? item.discountedPrice || item.pricePerKg
            : undefined,
      })),
      payment: {
        totalAmount: total,
        paidAmount: contractInfo.paymentAmount,
        debt: debt,
        status: debt <= 0 ? "paid" : "partial",
        paymentDescription: contractInfo.paymentDescription,
      },
      salesperson,
      totalWeight: updatedCart.reduce(
        (sum, item) => sum + calculateItemWeight(item),
        0
      ),
      totalPoddons: updatedCart.reduce(
        (sum, item) =>
          item.type === "coal_paper"
            ? sum + calculatePoddonCount(item.quantity)
            : sum,
        0
      ),
      isContract: true,
    };

    setSales([newSale, ...sales]);
    setCart([]);
    setPaymentInfo({
      totalAmount: 0,
      paidAmount: 0,
      discount: 0,
      paymentStatus: "partial",
    });
    setIsContractModalOpen(false);
    toast.success("Shartnoma muvaffaqiyatli tuzildi va sotuv yakunlandi!", {
      position: "top-right",
      autoClose: 3000,
    });
    setActiveTab("sales");
  };

  // Map obyekt
  const productImages = {
    betum: { src: betumImg, className: "icon-betum" },
    Stakan: { src: stakanImg, className: "icon-stakan" },
    folygoizol: { src: folygoizolImg, className: "icon-folygoizol" },
    polizol: { src: polizolImg, className: "icon-polizol" },
    ruberoid: { src: ruberoidImg, className: "icon-ruberoid" },
    Praymer: { src: praymerImg, className: "icon-praymer" },
    Qop: { src: betumImg, className: "icon-qop" },
    "BN-5": { src: bn5, className: "icon-bn5" },
  };

  // Funksiya
  const getProductIcon = (type) => {
    console.log(type);
    const item = productImages[type];
    if (!item) return null;
    return <img src={item.src} alt={type} className={`sacod-icon-sm ${item.className}`} />;
  }
  console.log(finishedProducts);
  const showReturnInfo = (returnInfo) => {
    setSelectedReturnInfo(returnInfo);
    setIsReturnInfoModalOpen(true);
  };

  const showDefectiveInfo = (defectiveInfo) => {
    setSelectedDefectiveInfo(defectiveInfo);
    setIsDefectiveInfoModalOpen(true);
  };

  return (
    <div className="sacod-sales-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {role !== "direktor" && (
        <div className="sacod-navigation">
          <div className="sacod-filter-controls">
            <button
              className={`sacod-nav-btn ${activeTab === "products" ? "sacod-nav-btn-active" : ""
                }`}
              onClick={() => setActiveTab("products")}
            >
              <Package className="sacod-icon-sm" />
              <span className="navsaler_bottom">Mahsulotlar</span>
            </button>
            <button
              className={`sacod-nav-btn ${activeTab === "cart" ? "sacod-nav-btn-active" : ""
                }`}
              onClick={() => setActiveTab("cart")}
            >
              <ShoppingCart className="sacod-icon-sm" />
              <span className="navsaler_bottom">Savat</span>
              <p style={{ fontSize: "17px" }}>({cart?.length})</p>
            </button>
            <button
              className={`sacod-nav-btn ${activeTab === "sales" ? "sacod-nav-btn-active" : ""
                }`}
              onClick={() => setActiveTab("sales")}
            >
              <FileText className="sacod-icon-sm" />
              <span className="navsaler_bottom">Shartnomalar</span>
            </button>
            <button
              className={`sacod-nav-btn ${activeTab === "salespeople" ? "sacod-nav-btn-active" : ""
                }`}
              onClick={() => setActiveTab("salespeople")}
            >
              <SiSoundcharts className="sacod-icon-sm" />
              <span className="navsaler_bottom">Sotuvchilar</span>
            </button>
            {
              role === "sotuvchi menejir" &&
              <button
                className={`sacod-nav-btn ${activeTab === "salespeople" ? "sacod-nav-btn-active" : ""
                  }`}
                onClick={() => navigate('/expense')}
              >
                <FaMoneyBillWave className="sacod-icon-sm" />
                <span className="navsaler_bottom">Xarajatlar</span>
              </button>
            }

          </div>
          {role === "sotuvchi menejir" ||
            role === "sotuvchi" ||
            role === "sotuvchi eksport" ? (
            <button
              className="profile-btn about-log"
              ref={searchPanelRef}
              onClick={showLogoutModal}
            >
              <User />
            </button>
          ) : (
            <></>
          )}
        </div>
      )}
      {activeTab === "products" && (
        <div
          className={`sacod-products-grid ${role === "sotuvchi" ||
            role !== "sotuvchi eksport" ||
            role === "saler_meneger"
            ? "sacod-products-gridMedia"
            : "sacod-products-gridDack"
            }`}
        >
          {finishedProducts?.map((product, inx) => (
            <div
              key={inx}
              className={`sacod-product-card ${product.isReturned
                ? "sacod-product-card-returned"
                : product.isDefective
                  ? "sacod-product-card-defective"
                  : ""
                }`}
            >
              {product.isReturned && (
                <div className="sacod-returned-info">
                  <p>Mijozdan qaytgan mahsulot</p>
                </div>
              )}
              {product.isDefective && (
                <div className="sacod-returned-info">
                  <p>Brak mahsulot</p>
                </div>
              )}
              <div className="sacod-product-header">
                <div className="sacod-product-name-box">
                  <p className="sacod-product-name">{product.productName}</p>
                </div>
                <div className="sacod-product-icon">
                  {getProductIcon(product.category)}
                </div>
              </div>

              <div className="sacod-product-subTitle">
                <p className="sacod-product-category">
                  Kategoriya: <strong>{product.category}</strong>
                </p>
                <div className="sacod-product-stock">
                  <Package className="sacod-icon-xs" />
                  {product.quantity.toLocaleString()}{" "}
                  {product.category === "Qop" || product.category === "Stakan"
                    ? "kg"
                    : "dona"}
                </div>
              </div>

              <div className="sacod-product-details">
                {product.type === "dona" ? (
                  <div className="sacod-product-price">
                    {product.sellingPrice?.toLocaleString()} so'm/dona
                  </div>
                ) : (
                  <div className="sacod-product-price">
                    {product.sellingPrice?.toLocaleString()} so'm/
                    {product.category === "Qop" || product.category === "Stakan"
                      ? "kg"
                      : "dona"}
                  </div>
                )}
                <div className="sacod-return-details-btn_box">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      addToCart(product, product.type === "coal_paper" ? 1 : 1);
                    }}
                    className="sacod-add-to-cart-btn"
                  >
                    <ShoppingCart className="sacod-icon-xs" />
                    Savatga qo'shish
                  </button>
                  {product.isReturned && (
                    <button
                      className="sacod-return-details-btn"
                      onClick={() => showReturnInfo(product.returnInfo)}
                    >
                      <Info className="sacod-icon-xs" />
                      Batafsil
                    </button>
                  )}
                  {product.isDefective && (
                    <button
                      className="sacod-return-details-btn"
                      onClick={() => showDefectiveInfo(product.defectiveInfo)}
                    >
                      <Info className="sacod-icon-xs" />
                      Batafsil
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "cart" && (
        <CartTab setActiveTab={setActiveTab} cart={cart} setCart={setCart} />
      )}

      {isContractModalOpen && (
        <div className="sacod-modal">
          <div className="sacod-modal-content">
            <h2 className="sacod-modal-title">
              <FileText className="sacod-icon-sm" />
              Shartnoma Tuzish
            </h2>
            <div className="sacod-form-section">
              <h3>Mijoz Ma'lumotlari</h3>
              <div className="sacod-form-row">
                <select
                  value={contractInfo.customerType}
                  onChange={(e) =>
                    setContractInfo({
                      ...contractInfo,
                      customerType: e.target.value,
                    })
                  }
                  className="sacod-form-select"
                >
                  <option value="individual">Jismoniy shaxs</option>
                  <option value="company">Yuridik shaxs</option>
                </select>
              </div>
              <div className="sacod-form-row">
                <input
                  type="text"
                  placeholder={
                    contractInfo.customerType === "company"
                      ? "Kompaniya nomi *"
                      : "Mijoz ismi *"
                  }
                  value={contractInfo.customerName}
                  onChange={(e) =>
                    setContractInfo({
                      ...contractInfo,
                      customerName: e.target.value,
                    })
                  }
                  className="sacod-form-input"
                />
                <input
                  type="tel"
                  placeholder="Telefon raqami"
                  value={contractInfo.customerPhone}
                  onChange={(e) =>
                    setContractInfo({
                      ...contractInfo,
                      customerPhone: e.target.value,
                    })
                  }
                  className="sacod-form-input"
                />
              </div>
              {contractInfo.customerType === "company" && (
                <div className="sacod-form-row">
                  <input
                    type="text"
                    placeholder="Kompaniya manzili"
                    value={contractInfo.customerCompanyAddress}
                    onChange={(e) =>
                      setContractInfo({
                        ...contractInfo,
                        customerCompanyAddress: e.target.value,
                      })
                    }
                    className="sacod-form-input"
                  />
                  <input
                    type="text"
                    placeholder="Soliq raqami (INN)"
                    value={contractInfo.customerTaxId}
                    onChange={(e) =>
                      setContractInfo({
                        ...contractInfo,
                        customerTaxId: e.target.value,
                      })
                    }
                    className="sacod-form-input"
                  />
                </div>
              )}
            </div>

            <div className="sacod-form-section">
              <h3>Mahsulotlar va Chegirmalar</h3>
              {cart?.map((item) => (
                <div key={item.id} className="sacod-cart-item">
                  <div className="sacod-cart-item-info">
                    <h4>{item.name}</h4>
                    <p>
                      Miqdori: {item.quantity}{" "}
                      {item.type === "coal_paper" ? "dona" : "qop"}
                    </p>
                    {item.type === "coal_paper" && (
                      <p>Poddon: {calculatePoddonCount(item.quantity)}</p>
                    )}
                    <p>
                      Asl narx:{" "}
                      {(item.type === "coal_paper"
                        ? item.pricePerUnit
                        : item.pricePerKg
                      )?.toLocaleString()}{" "}
                      so'm / {item.type === "coal_paper" ? "dona" : "kg"}
                    </p>
                    <input
                      style={{ width: "150px" }}
                      type="text"
                      placeholder="Chegirmali narx"
                      value={contractInfo.discounts[item.id] || ""}
                      onChange={(e) =>
                        handleContractDiscountChange(item.id, e.target.value)
                      }
                      className="sacod-form-input"
                      min="0"
                      max={
                        item.type === "coal_paper"
                          ? item.pricePerUnit
                          : item.pricePerKg
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="sacod-form-section">
              <h3>To'lov Ma'lumotlari</h3>
              <div className="sacod-form-row">
                <input
                  type="number"
                  placeholder="To'lov summasi"
                  value={contractInfo.paymentAmount}
                  onChange={(e) =>
                    setContractInfo({
                      ...contractInfo,
                      paymentAmount: Number(e.target.value),
                    })
                  }
                  className="sacod-form-input"
                  min="0"
                />
              </div>
              <div className="sacod-form-row">
                <textarea
                  placeholder="To'lov tavsifi"
                  value={contractInfo.paymentDescription}
                  onChange={(e) =>
                    setContractInfo({
                      ...contractInfo,
                      paymentDescription: e.target.value,
                    })
                  }
                  className="sacod-form-input"
                  rows="4"
                />
              </div>
            </div>

            <div className="sacod-modal-actions">
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="sacod-modal-btn sacod-modal-btn-cancel"
              >
                Bekor qilish
              </button>
              <button
                // onClick={completeContract}
                className="sacod-modal-btn sacod-modal-btn-confirm"
                disabled={
                  !contractInfo.customerName ||
                  cart?.length === 0 ||
                  isCreatingCartSale
                }
                onClick={completeContract}
                aria-label="Confirm contract"
              >
                Shartnomani tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {isReturnInfoModalOpen && (
        <div className="sacod-modal">
          <div className="sacod-modal-content">
            <h2 className="sacod-modal-title">
              <Info className="sacod-icon-sm" />
              Qaytarish Ma'lumotlari
            </h2>
            <div className="sacod-form-section">
              {selectedReturnInfo?.length > 0 ? (
                selectedReturnInfo.map((returnInfo, index) => (
                  <div
                    key={returnInfo._id || index}
                    className="sacod-return-item"
                  >
                    <div className="sacod-form-row">
                      <label>Firma Nomi:</label>
                      <p>{returnInfo.companyName || "N/A"}</p>
                    </div>
                    <div className="sacod-form-row">
                      <label>Qaytarish Sanasi:</label>
                      <p>
                        {returnInfo.returnDate
                          ? new Date(returnInfo.returnDate).toLocaleDateString(
                            "uz-UZ"
                          )
                          : "N/A"}
                      </p>
                    </div>

                    <div className="sacod-form-row">
                      <label>Qaytarilgan Miqdor:</label>
                      <p>{returnInfo.returnedQuantity || "N/A"}</p>
                    </div>
                    <div className="sacod-form-row">
                      <label>Qaytarilgan Summa:</label>
                      <p>{returnInfo.refundedAmount || "N/A"}</p>
                    </div>
                    <div className="sacod-form-row">
                      <label>Qaytarish Sababi:</label>
                      <p>{returnInfo.returnReason || "N/A"}</p>
                    </div>
                    {/* <div className="sacod-form-row">
                      <label>Qaytarish Tavsifi:</label>
                      <p>{returnInfo.returnDescription || "N/A"}</p>
                    </div> */}
                  </div>
                ))
              ) : (
                <p>Ma'lumotlar topilmadi</p>
              )}
            </div>

            <div className="sacod-modal-actions">
              <button
                onClick={() => setIsReturnInfoModalOpen(false)}
                className="sacod-modal-btn sacod-modal-btn-cancel"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {isDefectiveInfoModalOpen && (
        <div className="sacod-modal">
          <div className="sacod-modal-content">
            <h2 className="sacod-modal-title">
              <Info className="sacod-icon-sm" />
              Brak Ma'lumotlari
            </h2>
            <div className="sacod-form-section">
              <div className="sacod-form-row">
                <label>Brak Sanasi:</label>
                <p>
                  {selectedDefectiveInfo?.defectiveDate
                    ? new Date(
                      selectedDefectiveInfo.defectiveDate
                    ).toLocaleDateString("uz-UZ")
                    : "N/A"}
                </p>
              </div>

              <div className="sacod-form-row">
                <label>Brak Sababi:</label>
                <p>{selectedDefectiveInfo?.defectiveReason || "N/A"}</p>
              </div>
              <div className="sacod-form-row">
                <label>Brak Tavsifi:</label>
                <p>{selectedDefectiveInfo?.defectiveDescription || "N/A"}</p>
              </div>
            </div>

            <div className="sacod-modal-actions">
              <button
                onClick={() => setIsDefectiveInfoModalOpen(false)}
                className="sacod-modal-btn sacod-modal-btn-cancel"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sales" && (
        <div className={activeTab === "sales" ? "" : ""}>
          {filteredSales?.innerData?.length === 0 ? (
            <div className="sacod-empty-state">
              <FileText className="sacod-empty-icon" />
              <p>Hali hech qanday sotuv amalga oshirilmagan</p>
            </div>
          ) : (
            <SalesInvoiceDashboard />
          )}
        </div>
      )}

      {activeTab === "salespeople" && <SalespersonManagement sales={sales} />}

      <Modal
        title="Tizimdan chiqmoqchimisiz?"
        open={isModalOpen}
        onOk={() => handleModalOk}
        onCancel={handleModalCancel}
        centered
        maskClosable={!isLoggingOut}
        okText="Ha"
        cancelText="Yo'q"
        confirmLoading={isLoggingOut}
        okButtonProps={{
          className: "logout-modal-ok",
          danger: true,
          loading: isLoggingOut,
        }}
        cancelButtonProps={{
          className: "logout-modal-cancel",
          disabled: isLoggingOut,
        }}
        closable={!isLoggingOut}
        footer={[
          <Button
            key="cancel"
            className="logout-modal-cancel"
            onClick={handleModalCancel}
            disabled={isLoggingOut}
          >
            Yo'q
          </Button>,
          <Button
            key="ok"
            className="logout-modal-ok"
            type="primary"
            danger
            onClick={handleModalOk}
            loading={isLoggingOut}
          >
            Ha
          </Button>,
        ]}
      >
        <p>Chiqishni tasdiqlaysizmi?</p>
      </Modal>
    </div>
  );
};

export default SacodSalesModule;


