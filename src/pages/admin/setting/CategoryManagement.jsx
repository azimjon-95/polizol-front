// CatigoryManagement.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
  useCreateCategoryMutation,
  useGetAllCategoriesQuery,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "../../../context/categoryApi";
import {
  useCreateAdditionExpenMutation,
  useGetAllAdditionExpenQuery,
  useUpdateAdditionExpenMutation,
} from "../../../context/additionExpenApi";
import { useGetAllNormaQuery } from "../../../context/normaApi";
import "./styles/ProductManagement.css";

const CatigoryManagement = () => {
  // Form state
  const [productFormData, setProductFormData] = useState({
    category: "",
    productName: "",
    productionCost: "",
    loadingCost: "",
    qozonCost: "", // UI nomi
    takeDownCost: "", // ixtiyoriy: agar kerak bo‘lsa
  });
  const [productNotification, setProductNotification] = useState({
    message: "",
    type: "",
  });
  const [productEditId, setProductEditId] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);

  const [expenseFormData, setExpenseFormData] = useState({ saturdayWage: "" });
  const [expenseNotification, setExpenseNotification] = useState({
    message: "",
    type: "",
  });
  const [expenseEditId, setExpenseEditId] = useState(null);

  // Data
  const { data: normas } = useGetAllNormaQuery();
  const normaData = normas?.innerData || [];

  const { data: products = {}, isLoading: isCategoriesLoading } =
    useGetAllCategoriesQuery();
  const productRows = products?.innerData || [];

  const [createProduct, { isLoading: isCreatingProduct }] =
    useCreateCategoryMutation();
  const [updateProduct] = useUpdateCategoryMutation();
  const [deleteProduct] = useDeleteCategoryMutation();

  const { data: expenses = {}, isLoading: isExpensesLoading } =
    useGetAllAdditionExpenQuery();
  const expenseRows = expenses?.innerData || [];
  const [createExpense, { isLoading: isCreatingExpense }] =
    useCreateAdditionExpenMutation();
  const [updateExpense] = useUpdateAdditionExpenMutation();

  // Product list variants by category (schema-enum ga mos)
  const productLists = useMemo(() => {
    const byCat = (cat) =>
      normaData
        .filter((i) => (i.category || "").toLowerCase() === cat.toLowerCase())
        .map((i) => i.productName || i.name)
        .filter(Boolean);

    return {
      Polizol: byCat("Polizol"),
      Folygoizol: byCat("Folygoizol"),
      Ruberoid: byCat("Ruberoid"),
      Bn_3: ["BN-3"],
      Bn_5: ["BN-5"],
      Bn_5_mel: ["BN-5 + mel"],
      Qop: ["Qop"],
      Stakan: ["Stakan kichik", "Stakan katta"], // category: Stakan, productName variantlari
      Praymer: ["Praymer"],
    };
  }, [normaData]);

  // Cost field config by category
  const getCostFieldConfig = (category) => {
    switch (category) {
      case "Bn_3":
        return {
          showProductionCost: false,
          showLoadingCost: true,
          showQozonCost: true,
          showTakeDownCost: false,
          labels: {
            production: "Ishlab chiqarish narxi (UZS)",
            loading: "Yuk tushurish narxi (UZS)",
            qozon: "Qozonga tashlash narxi (UZS)",
            takeDown: "Yukni tushirish (take down) narxi (UZS)",
          },
        };
      case "Bn_5":
        return {
          showProductionCost: true,
          showLoadingCost: true,
          showQozonCost: false,
          showTakeDownCost: false,
          labels: {
            production: "Ishlab chiqarish narxi (UZS)",
            loading: "Yuklash narxi (UZS)",
          },
        };
      case "Bn_5_mel":
        return {
          showProductionCost: true,
          showLoadingCost: true,
          showQozonCost: false,
          showTakeDownCost: false,
          labels: {
            production: "Ishlab chiqarish + Mel narxi (UZS)",
            loading: "Yuklash narxi (UZS)",
          },
        };
      default:
        return {
          showProductionCost: true,
          showLoadingCost: true,
          showQozonCost: false,
          showTakeDownCost: false,
          labels: {
            production: "Ishlab chiqarish narxi (UZS)",
            loading: "Yuklash narxi (UZS)",
          },
        };
    }
  };

  const costConfig = getCostFieldConfig(productFormData.category);

  useEffect(() => {
    const list = productLists[productFormData.category] || [];
    setAvailableProducts(list);
    setProductFormData((prev) => ({ ...prev, productName: "" }));
  }, [productFormData.category, productLists]);

  const notifyP = useCallback((m, t) => {
    setProductNotification({ message: m, type: t });
    setTimeout(() => setProductNotification({ message: "", type: "" }), 2500);
  }, []);
  const notifyE = useCallback((m, t) => {
    setExpenseNotification({ message: m, type: t });
    setTimeout(() => setExpenseNotification({ message: "", type: "" }), 2500);
  }, []);

  const onProductChange = useCallback((e) => {
    const { name, value } = e.target;
    setProductFormData((p) => ({ ...p, [name]: value }));
  }, []);
  const onExpenseChange = useCallback((e) => {
    const { name, value } = e.target;
    setExpenseFormData((p) => ({ ...p, [name]: value }));
  }, []);

  const clearProductForm = useCallback(() => {
    setProductFormData({
      category: "",
      productName: "",
      productionCost: "",
      loadingCost: "",
      qozonCost: "",
      takeDownCost: "",
    });
    setProductEditId(null);
  }, []);
  const clearExpenseForm = useCallback(() => {
    setExpenseFormData({ saturdayWage: "" });
    setExpenseEditId(null);
  }, []);

  const isNumberOrEmpty = (v) => v === "" || !isNaN(parseFloat(v));

  const validateProductForm = useCallback(() => {
    const {
      category,
      productName,
      productionCost,
      loadingCost,
      qozonCost,
      takeDownCost,
    } = productFormData;

    if (!category || !productName) {
      notifyP("Kategoriya va mahsulot nomini tanlang!", "error");
      return false;
    }
    if (
      costConfig.showProductionCost &&
      (productionCost === "" || !isNumberOrEmpty(productionCost))
    ) {
      notifyP("Ishlab chiqarish narxini to'g'ri kiriting!", "error");
      return false;
    }
    if (
      costConfig.showLoadingCost &&
      (loadingCost === "" || !isNumberOrEmpty(loadingCost))
    ) {
      notifyP("Yuklash/yuk tushurish narxini to'g'ri kiriting!", "error");
      return false;
    }
    if (
      costConfig.showQozonCost &&
      (qozonCost === "" || !isNumberOrEmpty(qozonCost))
    ) {
      notifyP("Qozonga tashlash narxini to'g'ri kiriting!", "error");
      return false;
    }
    if (
      costConfig.showTakeDownCost &&
      (takeDownCost === "" || !isNumberOrEmpty(takeDownCost))
    ) {
      notifyP("Take down narxini to'g'ri kiriting!", "error");
      return false;
    }
    return true;
  }, [productFormData, costConfig, notifyP]);

  const handleProductSubmit = useCallback(async () => {
    if (!validateProductForm()) return;

    const toNum = (v) => (v === "" ? 0 : Number(v));

    // UI -> Backend mapping
    const payload = {
      name: productFormData.productName,
      category: productFormData.category,
      productionCost: costConfig.showProductionCost
        ? toNum(productFormData.productionCost)
        : 0,
      loadingCost: costConfig.showLoadingCost
        ? toNum(productFormData.loadingCost)
        : 0,
      qozongaTashlash: costConfig.showQozonCost
        ? toNum(productFormData.qozonCost)
        : 0,
      takeDownCost: costConfig.showTakeDownCost
        ? toNum(productFormData.takeDownCost)
        : 0,
    };

    try {
      if (productEditId) {
        await updateProduct({ id: productEditId, ...payload }).unwrap();
        notifyP("Mahsulot muvaffaqiyatli yangilandi!", "success");
      } else {
        await createProduct(payload).unwrap();
        notifyP("Mahsulot muvaffaqiyatli qo'shildi!", "success");
      }
      clearProductForm();
    } catch (e) {
      notifyP(
        `Mahsulot ${
          productEditId ? "yangilashda" : "qo'shishda"
        } xatolik yuz berdi!`,
        "error"
      );
    }
  }, [
    validateProductForm,
    productFormData,
    productEditId,
    costConfig,
    createProduct,
    updateProduct,
    notifyP,
    clearProductForm,
  ]);

  const handleExpenseSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const { saturdayWage } = expenseFormData;
      if (saturdayWage === "" || isNaN(parseFloat(saturdayWage))) {
        notifyE("Shanba ish haqi raqam bo‘lishi kerak!", "error");
        return;
      }

      const exists = expenseRows.find(
        (x) => x.saturdayWage === Number(saturdayWage)
      );
      if (!expenseEditId && exists) {
        notifyE("Bu xarajatlar allaqachon mavjud!", "error");
        return;
      }

      const payload = { saturdayWage: Number(saturdayWage) };
      try {
        if (expenseEditId) {
          await updateExpense({ id: expenseEditId, ...payload }).unwrap();
          notifyE("Xarajatlar muvaffaqiyatli yangilandi!", "success");
        } else {
          await createExpense(payload).unwrap();
          notifyE("Xarajatlar muvaffaqiyatli qo'shildi!", "success");
        }
        clearExpenseForm();
      } catch {
        notifyE(
          `Xarajatlar ${
            expenseEditId ? "yangilashda" : "qo'shishda"
          } xatolik yuz berdi!`,
          "error"
        );
      }
    },
    [
      expenseFormData,
      expenseEditId,
      expenseRows,
      createExpense,
      updateExpense,
      notifyE,
      clearExpenseForm,
    ]
  );

  const handleEditProduct = useCallback((p) => {
    setProductFormData({
      category: p.category,
      productName: p.name,
      productionCost: String(p.productionCost ?? ""),
      loadingCost: String(p.loadingCost ?? ""),
      qozonCost: String(p.qozongaTashlash ?? ""),
      takeDownCost: String(p.takeDownCost ?? ""),
    });
    setProductEditId(p._id);
  }, []);

  const handleEditExpense = useCallback((exp) => {
    setExpenseFormData({ saturdayWage: String(exp.saturdayWage) });
    setExpenseEditId(exp._id);
  }, []);

  const handleDeleteProduct = useCallback(
    async (id) => {
      if (!window.confirm("Bu mahsulotni o'chirishni xohlaysizmi?")) return;
      try {
        await deleteProduct(id).unwrap();
        notifyP("Mahsulot o'chirildi!", "success");
      } catch {
        notifyP("Mahsulot o'chirishda xatolik yuz berdi!", "error");
      }
    },
    [deleteProduct, notifyP]
  );

  const onKeyPressSubmit = useCallback(
    (e) => {
      if (e.key === "Enter") handleProductSubmit();
    },
    [handleProductSubmit]
  );
  const onKeyPressExpense = useCallback(
    (e) => {
      if (e.key === "Enter") handleExpenseSubmit(e);
    },
    [handleExpenseSubmit]
  );

  const formatCreatedAt = useCallback((createdAt) => {
    const d = new Date(createdAt);
    const y = `${d.getFullYear()}`.padStart(4, "0");
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    const h = `${d.getHours()}`.padStart(2, "0");
    const min = `${d.getMinutes()}`.padStart(2, "0");
    return `${y}.${m}.${day} ${h}:${min}`;
  }, []);

  // Jadvalda ustunlarni ko‘rsatish (agar birorta qiymat bor bo‘lsa)
  const showQozonCol = useMemo(
    () => productRows.some((p) => (p.qozongaTashlash ?? 0) !== 0),
    [productRows]
  );
  const showTakeDownCol = useMemo(
    () => productRows.some((p) => (p.takeDownCost ?? 0) !== 0),
    [productRows]
  );

  return (
    <div className="hyu-container">
      <div className="hyu-main-wrapper">
        {/* Form */}
        <div className="hyu-form-section">
          <h2 className="hyu-table-title">
            {productEditId ? "Mahsulotni Yangilash" : "Yangi Mahsulot Qo'shish"}
          </h2>

          <div className="hyu-form-elem">
            <div className="hyu-form-group">
              <label className="hyu-label">Kategoriya</label>
              <select
                name="category"
                className="hyu-select"
                value={productFormData.category}
                onChange={onProductChange}
                disabled={isCategoriesLoading}
              >
                <option value="">Kategoriyani tanlang</option>
                {Object.keys(productLists).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="hyu-form-group">
              <label className="hyu-label">Mahsulot Nomi</label>
              <select
                name="productName"
                className="hyu-select"
                value={productFormData.productName}
                onChange={onProductChange}
                disabled={
                  !productFormData.category || !availableProducts.length
                }
              >
                <option value="">Mahsulot nomini tanlang</option>
                {availableProducts.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {costConfig.showQozonCost && (
              <div className="hyu-form-group">
                <label className="hyu-label">{costConfig.labels.qozon}</label>
                <input
                  type="number"
                  name="qozonCost"
                  className="hyu-input"
                  placeholder="Masalan: 3000"
                  value={productFormData.qozonCost}
                  onChange={onProductChange}
                  onKeyPress={onKeyPressSubmit}
                />
              </div>
            )}

            {costConfig.showTakeDownCost && (
              <div className="hyu-form-group">
                <label className="hyu-label">
                  {costConfig.labels.takeDown}
                </label>
                <input
                  type="number"
                  name="takeDownCost"
                  className="hyu-input"
                  placeholder="Masalan: 2000"
                  value={productFormData.takeDownCost}
                  onChange={onProductChange}
                  onKeyPress={onKeyPressSubmit}
                />
              </div>
            )}

            {costConfig.showProductionCost && (
              <div className="hyu-form-group">
                <label className="hyu-label">
                  {costConfig.labels.production}
                </label>
                <input
                  type="number"
                  name="productionCost"
                  className="hyu-input"
                  placeholder="Masalan: 50000"
                  value={productFormData.productionCost}
                  onChange={onProductChange}
                  onKeyPress={onKeyPressSubmit}
                />
              </div>
            )}

            {costConfig.showLoadingCost && (
              <div className="hyu-form-group">
                <label className="hyu-label">{costConfig.labels.loading}</label>
                <input
                  type="number"
                  name="loadingCost"
                  className="hyu-input"
                  placeholder="Masalan: 5000"
                  value={productFormData.loadingCost}
                  onChange={onProductChange}
                  onKeyPress={onKeyPressSubmit}
                />
              </div>
            )}

            <div className="hyu-form-actions">
              <button
                type="button"
                className="hyu-submit-btn"
                onClick={handleProductSubmit}
                disabled={isCreatingProduct}
              >
                {productEditId ? "Yangilash" : "Qo'shish"}
              </button>
              {productEditId && (
                <button
                  type="button"
                  className="hyu-cancel-btn"
                  onClick={clearProductForm}
                >
                  Bekor qilish
                </button>
              )}
            </div>
          </div>

          <br />

          {/* Expenses */}
          <div className="hyu-additional">
            <h2 className="hyu-table-title">
              {expenseEditId
                ? "Xarajatlarni Yangilash"
                : "Tannarx va boshqa xarajatlar"}
            </h2>

            <div className="hyu-f-result">
              {expenseRows.length === 0 ? (
                <div className="hyu-empty-state">
                  <p>Hozircha xarajatlar yo'q</p>
                </div>
              ) : (
                <div className="hyu-expense-list">
                  {expenseRows.map((ex, i) => (
                    <div key={i} className="hyu-expense-item">
                      <div className="hyu-expense-field">
                        <span className="hyu-label">Shanbalik Ish Haqi:</span>
                        <span className="hyu-expense-label">
                          {ex.saturdayWage.toLocaleString()} so'm
                        </span>
                      </div>
                      <div className="hyu-expense-actions">
                        <button
                          className="hyu-edit-btn"
                          onClick={() => handleEditExpense(ex)}
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form className="hyu-form" onSubmit={handleExpenseSubmit}>
              <div className="hyu-form-group">
                <label className="hyu-label">Shanba Ish Haqi (UZS)</label>
                <input
                  type="number"
                  name="saturdayWage"
                  className="hyu-input"
                  placeholder="Masalan: 50000"
                  value={expenseFormData.saturdayWage}
                  onChange={onExpenseChange}
                  onKeyPress={onKeyPressExpense}
                  disabled={isExpensesLoading}
                />
              </div>

              <div className="hyu-form-actions">
                <button
                  type="submit"
                  className="hyu-submit-btn"
                  disabled={isCreatingExpense || isExpensesLoading}
                >
                  {expenseEditId ? "Yangilash" : "Qo'shish"}
                </button>
                {expenseEditId && (
                  <button
                    type="button"
                    className="hyu-cancel-btn"
                    onClick={clearExpenseForm}
                  >
                    Bekor qilish
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="hyu-table-section">
          <h2 className="hyu-table-title">Mahsulotlar Jadvali</h2>
          <div className="hyu-table-wrapper">
            {productRows.length === 0 ? (
              <div className="hyu-empty-state">
                <p>Hozircha mahsulotlar yo'q</p>
              </div>
            ) : (
              <table className="hyu-table">
                <thead>
                  <tr>
                    <th>Nomi</th>
                    <th>Kategoriya</th>
                    <th>Ishlab Chiqarish</th>
                    <th>Yuklash</th>
                    {showQozonCol && <th>Qozonga tashlash</th>}
                    {showTakeDownCol && <th>Take down</th>}
                    <th>Sana</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((p) => (
                    <tr key={p._id}>
                      <td className="hyu-product-name">{p.name}</td>
                      <td>
                        <span
                          className={`hyu-category-badge ${String(
                            p.category || ""
                          ).toLowerCase()}`}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td className="hyu-price">
                        {Number(p.productionCost || 0).toLocaleString()} UZS
                      </td>
                      <td className="hyu-price">
                        {Number(p.loadingCost || 0).toLocaleString()} UZS
                      </td>
                      {showQozonCol && (
                        <td className="hyu-price">
                          {Number(p.qozongaTashlash || 0).toLocaleString()} UZS
                        </td>
                      )}
                      {showTakeDownCol && (
                        <td className="hyu-price">
                          {Number(p.takeDownCost || 0).toLocaleString()} UZS
                        </td>
                      )}
                      <td className="hyu-date">
                        {formatCreatedAt(p.createdAt)}
                      </td>
                      <td>
                        <button
                          className="hyu-edit-btn"
                          onClick={() => handleEditProduct(p)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="hyu-delete-btn"
                          onClick={() => handleDeleteProduct(p._id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {(productNotification.message || expenseNotification.message) && (
        <div
          className={`hyu-notification ${
            productNotification.message
              ? productNotification.type
              : expenseNotification.type
          } show`}
        >
          {productNotification.message || expenseNotification.message}
        </div>
      )}
    </div>
  );
};

export default CatigoryManagement;
