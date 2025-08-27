import React, { useMemo, useState, useCallback } from "react";
import { useGetAllMaterialsQuery } from "../../../context/materialApi";
import { toast } from 'react-toastify';
import { Button } from "antd";
import { useCreateProductionMutation } from "../../../context/praymerApi";
import { NumberFormat } from "../../../hook/NumberFormat";
import './css/praymer.css';

// Utility functions
function formatNumber(n) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(Math.round(v));
}

function parseNum(v) {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const s = String(v).replace(/[^0-9.,-]/g, "");
  const normalized = s.replace(/,/g, ".");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

// Constants
const TANNARX_PER_BUCKET = 170396;
const DEFAULT_SALE_PRICE = 215000;
const TRANSPORT_COST = 6250;
const LABOR_COST = 1125;
const LABOR_COUNT = 3;
const PREP_WEIGHT = 18;
const PREP_COST = 9464;

function BiproPraymer() {
  const [qtyProduced, setQtyProduced] = useState(1);
  const [salePricePerBucket, setSalePricePerBucket] = useState(DEFAULT_SALE_PRICE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createProduction, { isLoading: createProductionLoading }] = useCreateProductionMutation();
  const { data: materials, isLoading: materialsLoading } = useGetAllMaterialsQuery();

  // Memoized material selections
  const materialMap = useMemo(() => {
    if (!materials?.innerData) return {};

    return materials.innerData.reduce((acc, material) => {
      acc[material.category] = material;
      return acc;
    }, {});
  }, [materials?.innerData]);

  // Generate default items based on available materials
  const DEFAULT_ITEMS = useMemo(() => {
    const { nakleyka, chelak, "BN-3": BN3, razbavitel } = materialMap;

    return [
      ...(nakleyka ? [{
        _id: nakleyka._id,
        name: nakleyka.name,
        category: "nakleyka",
        unit: nakleyka.unit,
        qty: 1,
        qiymat: Math.floor(nakleyka?.price),
        baseQty: 1,
        baseQiymat: NumberFormat(nakleyka.price),
      }] : []),
      ...(chelak ? [{
        _id: chelak._id,
        name: chelak.name,
        category: "chelak",
        unit: chelak.unit,
        qty: 1,
        qiymat: chelak.price,
        baseQty: 1,
        baseQiymat: chelak.price,
      }] : []),
      {
        _id: "transport",
        name: "Transport xarajati",
        unit: "-",
        qty: 1,
        qiymat: TRANSPORT_COST,
        baseQty: 1,
        baseQiymat: TRANSPORT_COST
      },
      {
        _id: "labor",
        name: "Ish haqi (yopishtirish)",
        unit: "kishi",
        qty: LABOR_COUNT,
        qiymat: LABOR_COST,
        baseQty: LABOR_COUNT,
        baseQiymat: LABOR_COST
      },
      ...(BN3 ? [{
        _id: BN3._id,
        name: BN3.name,
        category: "BN-3",
        unit: BN3.unit,
        qty: 8.10,
        qiymat: BN3.price,
        baseQty: 8.10,
        baseQiymat: BN3.price,
      }] : []),
      ...(razbavitel ? [{
        _id: razbavitel._id,
        name: razbavitel.name,
        category: "razbavitel",
        unit: razbavitel.unit,
        qty: 9.756,
        qiymat: razbavitel.price,
        baseQty: 9.756,
        baseQiymat: razbavitel.price,
      }] : []),
      {
        _id: "prep",
        name: "Tayyorlash",
        unit: "kg",
        qty: PREP_WEIGHT,
        qiymat: PREP_COST,
        baseQty: PREP_WEIGHT,
        baseQiymat: PREP_COST
      },
    ];
  }, [materialMap]);

  const [items, setItems] = useState(() => DEFAULT_ITEMS);

  // Update items when DEFAULT_ITEMS changes
  React.useEffect(() => {
    setItems(DEFAULT_ITEMS);
  }, [DEFAULT_ITEMS]);

  // Calculate profit metrics
  const profitMetrics = useMemo(() => {
    const profitPerBucket = parseNum(salePricePerBucket) - TANNARX_PER_BUCKET;
    const profitPercent = ((profitPerBucket / TANNARX_PER_BUCKET) * 100).toFixed(3);

    return {
      profitPerBucket,
      profitPercent
    };
  }, [salePricePerBucket]);

  // Compute scaled items
  const scaledItems = useMemo(() => {
    const scaleFactor = parseNum(qtyProduced) || 1;

    return items.map(item => {
      if (item?._id === "labor") {
        return { ...item, qty: parseNum(item?.baseQty), qiymat: parseNum(item?.baseQiymat) };
      }
      return {
        ...item,
        qty: parseNum(item?.baseQty) * scaleFactor,
        qiymat: parseNum(item?.baseQiymat) * scaleFactor,
      };
    });
  }, [items, qtyProduced]);

  // Calculate total cost per bucket
  const totalCostPerBucket = useMemo(
    () => items.reduce((acc, it) => acc + parseNum(it.baseQiymat), 0),
    [items]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const q = parseNum(qtyProduced);
    const { profitPerBucket } = profitMetrics;

    return {
      costAll: Math.round(totalCostPerBucket * q),
      profitAll: Math.round(profitPerBucket * q),
      tannarxAll: Math.round(TANNARX_PER_BUCKET * q),
      saleAll: Math.round(parseNum(salePricePerBucket) * q),
      marginPerBucket: Math.round(parseNum(salePricePerBucket) - TANNARX_PER_BUCKET),
    };
  }, [qtyProduced, totalCostPerBucket, profitMetrics, salePricePerBucket]);

  // Prepare data for server submission
  const prepareDataForServer = useCallback(() => {
    return {
      productionName: "Praymer - BIPRO",
      productionQuantity: parseNum(qtyProduced),
      profitPercent: parseNum(profitMetrics.profitPercent),
      salePricePerBucket: parseNum(salePricePerBucket),
      items: items.map(item => ({
        _id: item._id,
        name: item.name,
        unit: item.unit,
        baseQty: parseNum(item.baseQty * qtyProduced),
        baseQiymat: parseNum(item.baseQiymat),
        isMaterial: !!item.isMaterial,
        removable: !!item.removable,
        materialId: item.isMaterial
          ? item._id || null
          : null,
      })),
      totals: {
        costAll: totals.tannarxAll / qtyProduced,
        profitAll: totals.profitAll,
        tannarxAll: totals.tannarxAll,
        saleAll: totals.saleAll,
        marginPerBucket: totals.marginPerBucket,
      },
    };
  }, [qtyProduced, profitMetrics.profitPercent, salePricePerBucket, items, materials?.innerData, totals]);

  // Submit to server
  const submitToServer = useCallback(async () => {
    if (isSubmitting || createProductionLoading) return;

    setIsSubmitting(true);
    const data = prepareDataForServer();

    try {
      const res = await createProduction(data).unwrap();
      toast.success(res.innerData.message || "Ma'lumotlar muvaffaqiyatli saqlandi!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      toast.error("Ma'lumotlarni saqlashda xato: " + (error?.data?.message || "Noma'lum xato"), {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, createProductionLoading, prepareDataForServer, createProduction]);

  // Add new expense row
  const addRow = useCallback(() => {
    const newItem = {
      _id: `custom_${Date.now()}`,
      name: "Yangi xarajat",
      unit: "-",
      qty: 1,
      qiymat: 0,
      baseQty: 1,
      baseQiymat: 0,
      removable: true,
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  // Add raw material row
  const addRawMaterialRow = useCallback(() => {
    const newItem = {
      _id: '',
      name: "",
      unit: "",
      qty: 1,
      qiymat: 0,
      baseQty: 1,
      baseQiymat: 0,
      removable: true,
      isMaterial: true,
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  // Update item
  const updateItem = useCallback((_id, field, value) => {
    setItems(prev =>
      prev.map(it => {
        if (it._id !== _id) return it;

        const updatedItem = { ...it, [field]: value };
        const currentQtyProduced = parseNum(qtyProduced) || 1;

        if (field === "qty") {
          updatedItem.baseQty = parseNum(value) / (it._id === "labor" ? 1 : currentQtyProduced);
        } else if (field === "qiymat") {
          updatedItem.baseQiymat = parseNum(value) / (it._id === "labor" ? 1 : currentQtyProduced);
        } else if (field === "name" && it.isMaterial) {
          const selectedMaterial = materials?.innerData?.find(mat => mat.name === value);
          if (selectedMaterial) {
            updatedItem._id = selectedMaterial._id; // Bu yerda _id yangilanadi
            updatedItem.unit = selectedMaterial.unit;
            updatedItem.qiymat = parseNum(selectedMaterial.price) * parseNum(it.qty);
            updatedItem.baseQiymat = parseNum(selectedMaterial.price);
          }
        }

        return updatedItem;
      })
    );
  }, [qtyProduced, materials?.innerData]);

  // Remove item
  const removeItem = useCallback((_id) => {
    setItems(prev => prev.filter(it => it._id !== _id));
  }, []);

  // Reset to defaults
  const resetDefaults = useCallback(() => {
    setItems(DEFAULT_ITEMS);
    setQtyProduced(1);
    setSalePricePerBucket(DEFAULT_SALE_PRICE);
  }, [DEFAULT_ITEMS]);

  // Handle quantity change
  const handleQtyChange = useCallback((e) => {
    setQtyProduced(parseNum(e.target.value));
  }, []);

  // Handle sale price change
  const handleSalePriceChange = useCallback((e) => {
    setSalePricePerBucket(parseNum(e.target.value));
  }, []);

  if (materialsLoading) {
    return <div className="quy-container">Yuklanmoqda...</div>;
  }

  return (
    <div className="quy-container">
      <header className="quy-header">
        <div>
          <h1 className="quy-title">PRAЙMER – BIPRO</h1>
          <p className="quy-subtitle">
            Qiymatlar default bo'lib 1 chelak uchun kiritilgan. Miqdorni o'zgartirsangiz jami summalar mos ravishda ko'payadi.
          </p>
        </div>
        <div className="quy-buttons">
          <button onClick={resetDefaults} className="quy-btn-reset">
            Reset
          </button>
          <button onClick={addRow} className="quy-btn-add">
            + Xarajat qo'shish
          </button>
          <button onClick={addRawMaterialRow} className="quy-btn-add">
            + Xom ashyo qo'shish
          </button>
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
              <label className="quy-param-label">Foyda (%) — 1 chelak uchun</label>
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
                type="number"
                value={salePricePerBucket}
                onChange={handleSalePriceChange}
              />
            </div>
          </section>

          <section className="quy-table-section">
            <div className="quy-table-header">
              <h2 className="quy-table-title">Xarajatlar ({qtyProduced} chelak uchun)</h2>
            </div>
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
                  {scaledItems.map(it => (
                    <tr key={it._id} className="quy-table-row">
                      <td className="quy-table-cell">
                        {it.isMaterial ? (
                          <select
                            className="quy-input-name"
                            value={it.name}
                            onChange={e => updateItem(it._id, "name", e.target.value)}
                          >
                            <option value="">Xom ashyo tanlang</option>
                            {materials?.innerData?.map(mat => (
                              <option key={mat._id} value={mat.name}>
                                {mat.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="quy-input-name"
                            value={it.name}
                            onChange={e => updateItem(it._id, "name", e.target.value)}
                          />
                        )}
                      </td>
                      <td className="quy-table-cell">
                        <input
                          className="quy-input-unit"
                          value={it.unit}
                          onChange={e => updateItem(it._id, "unit", e.target.value)}
                          disabled={it.isMaterial}
                        />
                      </td>
                      <td className="quy-table-cell">
                        <input
                          // type="number"
                          className="quy-input-qty"
                          value={it.qty}
                          onChange={e => updateItem(it._id, "qty", parseNum(e.target.value))}
                        />
                      </td>
                      <td className="quy-table-cell">
                        <input
                          type="number"
                          className="quy-input-price"
                          value={Math.floor(it.qiymat * it.qty)}
                          onChange={e => updateItem(it._id, "qiymat", parseNum(e.target.value))}
                          disabled={it.isMaterial}
                        />
                      </td>
                      <td className="quy-table-cell" style={{ textAlign: 'right' }}>
                        {it.removable ? (
                          <button
                            onClick={() => removeItem(it._id)}
                            className="quy-btn-remove"
                          >
                            O'chirish
                          </button>
                        ) : (
                          <span> </span>
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
                  <th>Bahosi</th>
                  <th>Qiymati</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '500' }}>Tannarxi</td>
                  <td>{formatNumber(qtyProduced)}</td>
                  <td>{formatNumber(TANNARX_PER_BUCKET)} so'm</td>
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
                <div className="quy-sales-value">{formatNumber(parseNum(salePricePerBucket))} so'm</div>
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
            disabled={isSubmitting || createProductionLoading}
            className="quy-btn-submit"
            loading={isSubmitting || createProductionLoading}
          >
            {isSubmitting || createProductionLoading ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </section>
      </div>
    </div>
  );
}

export default BiproPraymer;


