import React, { useMemo, useCallback, useEffect } from "react";
import { useGetAllMaterialsQuery } from "../../../context/materialApi";
import { toast } from "react-toastify";
import { Button } from "antd";
import { useCreateProductionMutation } from "../../../context/praymerApi";
import "./css/praymer.css";

// Utility functions
const formatNumber = (n) =>
  Number.isFinite(n)
    ? new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(Math.round(n))
    : "0";

const parseNum = (v) => {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const normalized = String(v).replace(/[^0-9.,-]/g, "").replace(/,/g, ".");
  return Number.isFinite(parseFloat(normalized)) ? parseFloat(normalized) : 0;
};

const BiproPraymer = () => {
  const [qtyProduced, setQtyProduced] = React.useState(1);
  const [salePricePerBucket, setSalePricePerBucket] = React.useState(215000);
  const [items, setItems] = React.useState([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeBtn, setActiveBtn] = React.useState("praymer"); // default active
  const { data: materials, isLoading: materialsLoading } = useGetAllMaterialsQuery();
  const [createProduction, { isLoading: createProductionLoading }] = useCreateProductionMutation();

  // Constants for Praymer
  const praymerConstants = {
    DEFAULT_SALE_PRICE: 215000,
    TRANSPORT_COST: 6250,
    LABOR_COST: 400,
    LABOR_COUNT: 1,
    PREP_WEIGHT: 18,
    PREP_COST: 9464,
    BN3_QTY: 8.1,
    RAZ_QTY: 9.756,
  };

  // Constants for Mastika (values reduced approximately by 20% for demonstration; adjust as needed)
  const mastikaConstants = {
    DEFAULT_SALE_PRICE: 215000,
    TRANSPORT_COST: 5000,
    LABOR_COST: 320,
    LABOR_COUNT: 1,
    PREP_WEIGHT: 14.4,
    PREP_COST: 7571,
    BN3_QTY: 6.48,
    RAZ_QTY: 7.805,
  };

  // Select constants based on activeBtn
  const constants = activeBtn === "mastika" ? mastikaConstants : praymerConstants;

  // Material map for quick lookup
  const materialMap = useMemo(() => {
    if (!materials?.innerData) return {};
    return materials.innerData.reduce((acc, material) => {
      acc[material.category] = material;
      return acc;
    }, {});
  }, [materials?.innerData]);

  // Default items
  const DEFAULT_ITEMS = useMemo(() => {
    const { nakleyka, chelak, "BN-3": BN3, razbavitel } = materialMap;
    return [
      ...(nakleyka
        ? [{
          _id: nakleyka._id,
          name: nakleyka.name,
          category: "nakleyka",
          unit: nakleyka.unit,
          qty: 1,
          qiymat: Math.floor(nakleyka.price),
          baseQty: 1,
          baseQiymat: nakleyka.price,
          isMaterial: true,
          removable: false,
        }]
        : []),
      ...(chelak
        ? [{
          _id: chelak._id,
          name: chelak.name,
          category: "chelak",
          unit: chelak.unit,
          qty: 1,
          qiymat: chelak.price,
          baseQty: 1,
          baseQiymat: chelak.price,
          isMaterial: true,
          removable: false,
        }]
        : []),
      {
        _id: "transport",
        name: "Transport xarajati",
        unit: "-",
        qty: 1,
        qiymat: constants.TRANSPORT_COST,
        baseQty: 1,
        baseQiymat: constants.TRANSPORT_COST,
        removable: false,
      },
      {
        _id: "labor",
        name: "Ish haqi (Yuklash)",
        unit: "dona",
        qty: constants.LABOR_COUNT,
        qiymat: constants.LABOR_COST * constants.LABOR_COUNT,
        baseQty: constants.LABOR_COUNT,
        baseQiymat: constants.LABOR_COST,
        removable: false,
      },
      ...(BN3
        ? [{
          _id: BN3._id,
          name: BN3.name,
          category: "BN-3",
          unit: BN3.unit,
          qty: constants.BN3_QTY,
          qiymat: BN3.price * constants.BN3_QTY,
          baseQty: constants.BN3_QTY,
          baseQiymat: BN3.price,
          isMaterial: true,
          removable: false,
        }]
        : []),
      ...(razbavitel
        ? [{
          _id: razbavitel._id,
          name: razbavitel.name,
          category: "razbavitel",
          unit: razbavitel.unit,
          qty: constants.RAZ_QTY,
          qiymat: razbavitel.price * constants.RAZ_QTY,
          baseQty: constants.RAZ_QTY,
          baseQiymat: razbavitel.price,
          isMaterial: true,
          removable: false,
        }]
        : []),
      {
        _id: "prep",
        name: "Tayyorlash",
        unit: "kg",
        qty: constants.PREP_WEIGHT,
        qiymat: constants.PREP_COST,
        baseQty: constants.PREP_WEIGHT,
        baseQiymat: constants.PREP_COST / constants.PREP_WEIGHT,
        removable: false,
      },
    ];
  }, [materialMap, constants]);

  // Initialize items
  useEffect(() => {
    setItems(DEFAULT_ITEMS);
  }, [DEFAULT_ITEMS]);

  // Reset sale price when constants change (i.e., activeBtn changes)
  useEffect(() => {
    setSalePricePerBucket(constants.DEFAULT_SALE_PRICE);
    setQtyProduced(1); // Reset quantity to 1 on switch
  }, [constants.DEFAULT_SALE_PRICE]);

  // 🔹 Helper: Tayyorlash qiymatini qayta hisoblash
  const recalcPrep = (items) => {
    const otherCosts = items
      .filter((it) => it.removable)
      .reduce((sum, it) => sum + parseNum(it.qiymat), 0);

    return items.map((it) =>
      it._id === "prep"
        ? {
          ...it,
          qiymat: constants.PREP_COST + otherCosts,
          baseQiymat: (constants.PREP_COST + otherCosts) / it.baseQty
        }
        : it
    );
  };

  // Scaled items
  const scaledItems = useMemo(() => {
    const scaleFactor = parseNum(qtyProduced) || 1;
    return items.map((item) => ({
      ...item,
      qty: parseNum(item.baseQty) * scaleFactor,
      qiymat: parseNum(item.baseQiymat) * parseNum(item.baseQty) * scaleFactor,
    }));
  }, [items, qtyProduced]);

  // Total cost per bucket
  const totalCostPerBucket = useMemo(
    () => items.reduce((acc, it) => acc + (it.removable ? 0 : parseNum(it.baseQiymat) * parseNum(it.baseQty)), 0),
    [items]
  );

  // Profit calculations
  const profitMetrics = useMemo(() => {
    const profitPerBucket = parseNum(salePricePerBucket) - totalCostPerBucket;
    return {
      profitPerBucket,
      profitPercent: totalCostPerBucket > 0 ? ((profitPerBucket / totalCostPerBucket) * 100).toFixed(3) : "0",
    };
  }, [salePricePerBucket, totalCostPerBucket]);

  // Totals
  const totals = useMemo(() => {
    const q = parseNum(qtyProduced);
    const { profitPerBucket } = profitMetrics;
    return {
      costAll: Math.round(totalCostPerBucket * q),
      profitAll: Math.round(profitPerBucket * q),
      tannarxAll: Math.round(totalCostPerBucket * q),
      saleAll: Math.round(parseNum(salePricePerBucket) * q),
      marginPerBucket: Math.round(parseNum(salePricePerBucket) - totalCostPerBucket),
    };
  }, [qtyProduced, totalCostPerBucket, profitMetrics, salePricePerBucket]);
  // activeBtn === "mastika"
  // Prepare server data
  const prepareDataForServer = useCallback(() => ({
    productionName: activeBtn === "mastika" ? "Mastika" : "Praymer - BIPRO",
    productionQuantity: parseNum(qtyProduced),
    profitPercent: parseNum(profitMetrics.profitPercent),
    salePricePerBucket: parseNum(salePricePerBucket),
    items: items.map((item) => ({
      _id: item._id,
      name: item.name,
      unit: item.unit,
      baseQty: parseNum(item.baseQty) * (parseNum(qtyProduced)),
      baseQiymat: parseNum(item.baseQiymat),
      isMaterial: !!item.isMaterial,
      removable: !!item.removable,
      materialId: item.isMaterial ? item._id || null : null,
    })),
    totals: {
      costAll: totals.tannarxAll / qtyProduced,
      profitAll: totals.profitAll,
      tannarxAll: totals.tannarxAll,
      saleAll: totals.saleAll,
      marginPerBucket: totals.marginPerBucket,
    },
  }), [qtyProduced, profitMetrics.profitPercent, salePricePerBucket, items, totals, activeBtn]);

  // Submit to server
  const submitToServer = useCallback(async () => {
    if (isSubmitting || createProductionLoading) return;
    setIsSubmitting(true);
    try {
      const data = prepareDataForServer();
      await createProduction(data).unwrap();
      toast.success("Ma'lumotlar muvaffaqiyatli saqlandi!", { position: "top-right", autoClose: 3000 });
    } catch (error) {
      toast.error(`Ma'lumotlarni saqlashda xato: ${error?.data?.message || "Noma'lum xato"}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, createProductionLoading, prepareDataForServer, createProduction]);

  // Add expense row
  const addRow = useCallback(() => {
    setItems((prev) => {
      const newItems = [
        ...prev,
        {
          _id: `custom_${Date.now()}`,
          name: "Yangi xarajat",
          unit: "-",
          qty: 1,
          qiymat: 0,
          baseQty: 1,
          baseQiymat: 0,
          removable: true,
        },
      ];
      return recalcPrep(newItems);
    });
  }, []);

  // Add raw material row
  const addRawMaterialRow = useCallback(() => {
    setItems((prev) => {
      const newItems = [
        ...prev,
        {
          _id: "",
          name: "",
          unit: "",
          qty: 1,
          qiymat: 0,
          baseQty: 1,
          baseQiymat: 0,
          removable: true,
          isMaterial: true,
        },
      ];
      return recalcPrep(newItems);
    });
  }, []);

  // Update item
  const updateItem = useCallback(
    (_id, field, value) => {
      setItems((prev) => {
        const updated = prev.map((it) => {
          if (it._id !== _id) return it;
          const scaleFactor = parseNum(qtyProduced) || 1;
          const updatedItem = { ...it, [field]: value };

          if (field === "qty") {
            const newQty = parseNum(value);
            updatedItem.baseQty = newQty / scaleFactor;
            updatedItem.qiymat = updatedItem.baseQiymat * updatedItem.baseQty;
          } else if (field === "qiymat") {
            const newQiymat = parseNum(value);
            updatedItem.baseQiymat = newQiymat / (parseNum(it.baseQty) * scaleFactor);
            updatedItem.qiymat = updatedItem.baseQiymat * updatedItem.baseQty;
          } else if (field === "name" && it.isMaterial) {
            const selectedMaterial = materials?.innerData?.find((mat) => mat.name === value);
            if (selectedMaterial) {
              updatedItem._id = selectedMaterial._id;
              updatedItem.unit = selectedMaterial.unit;
              updatedItem.baseQiymat = parseNum(selectedMaterial.price);
              updatedItem.qiymat = parseNum(selectedMaterial.price) * updatedItem.baseQty;
            }
          }
          return updatedItem;
        });

        return recalcPrep(updated);
      });
    },
    [qtyProduced, materials?.innerData, constants.PREP_COST]
  );

  // Remove item
  const removeItem = useCallback((_id) => {
    setItems((prev) => {
      const newItems = prev.filter((it) => it._id !== _id);
      return recalcPrep(newItems);
    });
  }, []);

  // Reset to defaults
  const resetDefaults = useCallback(() => {
    setItems(DEFAULT_ITEMS);
    setQtyProduced(1);
    setSalePricePerBucket(constants.DEFAULT_SALE_PRICE);
  }, [DEFAULT_ITEMS, constants.DEFAULT_SALE_PRICE]);

  // Input handlers
  const handleQtyChange = useCallback((e) => setQtyProduced(parseNum(e.target.value)), []);
  const handleSalePriceChange = useCallback((e) => setSalePricePerBucket(parseNum(e.target.value)), []);

  const valueKg = scaledItems?.find((i) => i.name === "Tayyorlash")?.qty;
  if (materialsLoading) return <div className="quy-container">Yuklanmoqda...</div>;

  return (
    <div className="quy-container">
      <header className="quy-header">
        <div>
          <div className="quy-box-header">
            <button
              className={activeBtn === "praymer" ? "active" : ""}
              onClick={() => setActiveBtn("praymer")}
            >
              BIPRO – PRAYMER
            </button>

            <button
              className={activeBtn === "mastika" ? "active" : ""}
              onClick={() => setActiveBtn("mastika")}
            >
              Mastika
            </button>
          </div>
          <p className="quy-subtitle">
            Qiymatlar 1 chelak uchun kiritilgan. Miqdorni o'zgartirsangiz jami summalar mos ravishda ko'payadi.
          </p>
        </div>
        <div className="quy-buttons">
          <button onClick={resetDefaults} className="quy-btn-reset">Reset</button>
          <button onClick={addRow} className="quy-btn-add">+ Xarajat</button>
          <button onClick={addRawMaterialRow} className="quy-btn-add">+ Xom ashyo</button>
        </div>
      </header>

      <div className="quy-wrapper_box">
        <div className="quy-wrapper">
          <section className="quy-params-grid">
            <div className="quy-param-card">
              <label className="quy-param-label">Ishlab chiqarilgan miqdor (chelak)</label>
              <input
                className="quy-param-input"
                type="number"
                min={0}
                value={qtyProduced}
                onChange={handleQtyChange}
              />
            </div>
            <div className="quy-param-card">
              <label className="quy-param-label">Foyda (%) — 1 chelak</label>
              <input
                className="quy-param-input quy-param-input-readonly"
                type="text"
                value={`${Math.floor(profitMetrics.profitPercent)}%`}
                disabled
              />
            </div>
            <div className="quy-param-card">
              <label className="quy-param-label">Sotuv narxi (1 chelak, so'm)</label>
              <input
                className="quy-param-input"
                type="text"
                value={formatNumber(salePricePerBucket)}
                onChange={handleSalePriceChange}
              />
            </div>
          </section>

          <section className="quy-table-section">
            <h2 className="quy-table-title">Xarajatlar ({qtyProduced} chelak)</h2>
            <div className="quy-table-wrapper">
              <table className="quy-table">
                <thead>
                  <tr>
                    <th>Harajatlar</th>
                    <th>Birlik</th>
                    <th>Miqdori</th>
                    <th>Qiymati (so'm)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {scaledItems?.filter((i) => i.name !== "Tayyorlash")?.map((it) => (
                    <tr key={it._id} className="quy-table-row">
                      <td className="quy-table-cell">
                        {it.isMaterial ? (
                          <select
                            className="quy-input-name"
                            value={it.name}
                            onChange={(e) => updateItem(it._id, "name", e.target.value)}
                          >
                            <option value="">Xom ashyo tanlang</option>
                            {materials?.innerData?.map((mat) => (
                              <option key={mat._id} value={mat.name}>
                                {mat.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="quy-input-name"
                            value={it.name}
                            onChange={(e) => updateItem(it._id, "name", e.target.value)}
                          />
                        )}
                      </td>
                      <td className="quy-table-cell">
                        <input
                          className="quy-input-unit"
                          value={it.unit}
                          onChange={(e) => updateItem(it._id, "unit", e.target.value)}
                          disabled={it.isMaterial}
                        />
                      </td>
                      <td className="quy-table-cell">
                        <input
                          type="number"
                          className="quy-input-qty"
                          value={it.qty}
                          onChange={(e) => updateItem(it._id, "qty", parseNum(e.target.value))}
                        />
                      </td>
                      <td className="quy-table-cell">
                        <input
                          type="text"
                          className="quy-input-price"
                          value={formatNumber(it.qiymat)}
                          onChange={(e) => updateItem(it._id, "qiymat", parseNum(e.target.value))}
                          disabled={it.isMaterial}
                        />
                      </td>
                      <td className="quy-table-cell" style={{ textAlign: "right" }}>
                        {it.removable && (
                          <button
                            onClick={() => removeItem(it._id)}
                            className="quy-btn-remove"
                          >
                            O'chirish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="quy-results-grid">
          <div className="quy-result-card">
            <h3 className="quy-result-title">Ishlab chiqarilgan mahsulot</h3>
            <table className="quy-result-table">
              <thead>
                <tr>
                  <th>Nomi</th>
                  <th>Miqdori (chelak)</th>
                  <th>Miqdori (kg)</th>
                  <th>Bahosi</th>
                  <th>Qiymati</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: "500" }}>Tannarxi</td>
                  <td>{formatNumber(qtyProduced)} dona</td>
                  <td>{formatNumber(valueKg)} kg</td>
                  <td>{formatNumber(totals.tannarxAll / qtyProduced)} so'm</td>
                  <td className="quy-table-value">{formatNumber(totals.tannarxAll)} so'm</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="quy-result-card">
            <h3 className="quy-result-title">Sotuv natijasi</h3>
            <div className="quy-sales-grid">
              <div className="quy-sales-card">
                <div className="quy-sales-label">Sotuv narxi (1 chelak)</div>
                <div className="quy-sales-value">{formatNumber(salePricePerBucket)} so'm</div>
              </div>
              <div className="quy-sales-card">
                <div className="quy-sales-label">Daromad (1 chelak)</div>
                <div className={`quy-sales-value ${totals.marginPerBucket >= 0 ? "quy-total-value-green" : "quy-total-value-red"}`}>
                  {formatNumber(totals.marginPerBucket)} so'm
                </div>
              </div>
              <div className="quy-sales-card">
                <div className="quy-sales-label">Jami sotuv</div>
                <div className="quy-sales-value">{formatNumber(totals.saleAll)} so'm</div>
              </div>
              <div className="quy-sales-card">
                <div className="quy-sales-label">Jami daromad</div>
                <div className={`quy-sales-value ${totals.saleAll - totals.tannarxAll >= 0 ? "quy-total-value-green" : "quy-total-value-red"}`}>
                  {formatNumber(totals.saleAll - totals.tannarxAll)} so'm
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={submitToServer}
            disabled={isSubmitting || createProductionLoading || qtyProduced <= 0}
            className="quy-btn-submit"
            loading={isSubmitting || createProductionLoading}
          >
            {isSubmitting || createProductionLoading ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </section>
      </div>
    </div>
  );
};

export default BiproPraymer;
