import React, { useMemo, useState, useEffect, useCallback } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { PiTableDuotone } from "react-icons/pi";
import { Package, ShoppingCart } from "lucide-react";
import { Button, Modal } from "antd";
import { useProductionForSalesBN5Mutation } from "../../../context/productionApi";
import { toast } from "react-toastify";

const Bn5ProcessDialog = ({ refetch, material, gasPrice, electricityPrice }) => {
  const [packagingType, setPackagingType] = useState("bag");
  const [unitType, setUnitType] = useState("dona");
  const [showBn5ProcessDialog, setShowBn5ProcessDialog] = useState(false);

  // Jadval modal
  const [isBn5SalesPrepTableModalOpen, setIsBn5SalesPrepTableModalOpen] = useState(false);

  const [bn5Amount, setBn5Amount] = useState("");
  const [formattedBn5Amount, setFormattedBn5Amount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [inputValues, setInputValues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [createBn5Production] = useProductionForSalesBN5Mutation();

  const [currentBn5Process, setCurrentBn5Process] = useState({
    date: new Date().toISOString().split("T")[0],
    bn5Amount: "5000",
    melAmount: "1000",
    electricity: "200",
    gasAmount: "200",
    notes: "",
    extra: "200000",
    kraftPaper: "0",
    sellingPrice: "6500",
    qop: "170",
    price: "",
  });

  const packagingConfig = {
    bag: { label: "BN-5 Qop", weight: 39, ropePerUnit: 1.5, kraftPerUnit: unitType !== "dona" ? 0.25 : 0 },
    smallCup: { label: "Stakan kichik", weight: 0.5, ropePerUnit: 1.5, kraftPerUnit: 0 },
    largeCup: { label: "Stakan katta", weight: 1, ropePerUnit: 1.5, kraftPerUnit: 0 },
    // ✅ NEW: Melsiz
    mel: { label: "BN-5 Melsiz", weight: 1, ropePerUnit: 0, kraftPerUnit: 0 },
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const n = Number(String(value).replace(/,/g, ""));
    if (Number.isNaN(n)) return "";
    return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const parseNumber = (value) => String(value || "").replace(/,/g, "");

  const handleBn5AmountChange = (e) => {
    const rawValue = parseNumber(e.target.value);
    if (rawValue === "" || !isNaN(rawValue)) {
      setBn5Amount(rawValue);
      setFormattedBn5Amount(formatNumber(rawValue));
    }
  };

  const handleChange = (key, value) => {
    setCurrentBn5Process((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeleteInputValue = (index) => {
    setInputValues((prev) => prev.filter((_, i) => i !== index));
    toast.success("Qadoqlash birligi o‘chirildi!");
  };

  const calculatePercentages = () => {
    const bn5 = parseFloat(currentBn5Process.bn5Amount) || 0;
    const mel = parseFloat(currentBn5Process.melAmount) || 0;
    const total = bn5 + mel;
    const bn5Percent = total > 0 ? ((bn5 / total) * 100).toFixed(1) : 0;
    const melPercent = total > 0 ? ((mel / total) * 100).toFixed(1) : 0;
    return { bn5Percent, melPercent };
  };

  // ---------- COMPUTED PRICES + TABLE DATA ----------
  const computedCosts = useMemo(() => {
    const bn5 = parseFloat(currentBn5Process.bn5Amount) || 0;
    const mel = parseFloat(currentBn5Process.melAmount) || 0;
    const electric = parseFloat(currentBn5Process.electricity) || 0;
    const gas = parseFloat(currentBn5Process.gasAmount) || 0;
    const kraft = parseFloat(currentBn5Process.kraftPaper) || 0;
    const qop = parseFloat(currentBn5Process.qop) || 0;
    const extra = parseFloat(currentBn5Process.extra) || 0;

    const bn5Price = material?.find((m) => m.category === "BN-5")?.price || 0;
    const melPrice = material?.find((m) => m.category === "Mel")?.price || 0;
    const krafPrice = material?.find((m) => m.category === "kraf")?.price || 0;
    const ipPrice = material?.find((m) => m.category === "ip")?.price || 0;
    const qopPrice = material?.find((m) => m.category === "qop")?.price || 0;

    const bn5Sum = bn5 * bn5Price;
    const melSum = mel * melPrice;
    const gazSum = gas * (Number(gasPrice) || 0);
    const elektrSum = electric * (Number(electricityPrice) || 0);
    const qopSum = qop * qopPrice;
    const kraftSum = kraft * krafPrice;

    const ipSum = ipPrice * qop * 0.015;

    // Ish xaqi: 80
    const ishHaqi = 80;

    const total = bn5Sum + melSum + gazSum + elektrSum + qopSum + kraftSum + ishHaqi + ipSum + extra;
    const totalWeight = bn5 + mel;

    let tannarx1kg = 0;
    if (totalWeight > 0) {
      const costPerKg = total / totalWeight;
      const factor = 1.021 - 0.0005; // yig'indisi: 1.068
      tannarx1kg = Math.round(costPerKg * factor - 9);
    }

    return {
      bn5, mel, electric, gas, kraft, qop, extra,
      bn5Price, melPrice, krafPrice, ipPrice, qopPrice,
      bn5Sum, melSum, gazSum, elektrSum, qopSum, kraftSum, ipSum, ishHaqi,
      total,
      totalWeight,
      tannarx1kg,
    };
  }, [currentBn5Process, material, gasPrice, electricityPrice]);

  useEffect(() => {
    setCurrentBn5Process((prev) => ({
      ...prev,
      price: computedCosts.tannarx1kg,
      extra: prev.extra,
    }));
  }, [computedCosts.tannarx1kg]);

  const bn5SalesPrepRows = useMemo(() => {
    const rows = [
      { name: "Bitum BN-5 (kg)", qty: computedCosts.bn5 ? computedCosts.bn5 : "", price: computedCosts.bn5Price, sum: computedCosts.bn5Sum },
      { name: "Mel (kg)", qty: computedCosts.mel ? computedCosts.mel : "", price: computedCosts.melPrice, sum: computedCosts.melSum },
      { name: "Qop (eksport) dona", qty: computedCosts.qop ? computedCosts.qop : "", price: computedCosts.qopPrice, sum: computedCosts.qopSum },
      { name: "El. energiya", qty: computedCosts.electric ? computedCosts.electric : "", price: Number(electricityPrice) || 0, sum: computedCosts.elektrSum },
      { name: "Tabiiy gaz", qty: computedCosts.gas ? computedCosts.gas : "", price: Number(gasPrice) || 0, sum: computedCosts.gazSum },
      { name: "Ish xaqi", qty: 6000, price: 80, sum: 80 * 6000 },
      { name: "Boshqa xarajatlar", qty: "", price: "", sum: computedCosts.extra },
    ];
    return rows;
  }, [computedCosts, gasPrice, electricityPrice]);

  const totalExpenses = useMemo(() => {
    return bn5SalesPrepRows.reduce((acc, r) => acc + (Number(r.sum) || 0), 0);
  }, [bn5SalesPrepRows]);

  const tannarxFromTable = useMemo(() => {
    const totalWeight = (Number(computedCosts.bn5) || 0) + (Number(computedCosts.mel) || 0);
    if (totalWeight <= 0) return 0;
    return computedCosts.tannarx1kg || 0;
  }, [computedCosts]);

  // ---------- VALIDATION / SAVE ----------
  const validateBn5Processing = () => {
    const bn5 = parseFloat(currentBn5Process.bn5Amount) || 0;
    const mel = parseFloat(currentBn5Process.melAmount) || 0;

    const bn5Stock = material?.find((m) => m.category === "BN-5")?.quantity || 0;
    const melStock = material?.find((m) => m.category === "Mel")?.quantity || 0;

    if (bn5Stock < bn5) {
      toast.error("Omborda yetarli BN-5 yo'q!");
      return false;
    }
    if (melStock < mel) {
      toast.error("Omborda yetarli Mel yo'q!");
      return false;
    }

    setShowBn5ProcessDialog(true);
    return true;
  };

  const confirmBn5Processing = async () => {
    setIsLoading(true);
    try {
      const payload = {
        processData: {
          ...currentBn5Process,
          bn5Amount: parseFloat(currentBn5Process.bn5Amount) || 0,
          melAmount: parseFloat(currentBn5Process.melAmount) || 0,
          electricity: parseFloat(currentBn5Process.electricity) || 0,
          gasAmount: parseFloat(currentBn5Process.gasAmount) || 0,
          kraftPaper: parseFloat(currentBn5Process.kraftPaper) || 0,
          qop: parseFloat(currentBn5Process.qop) || 0,
          extra: parseFloat(currentBn5Process.extra) || 0,
          price: parseFloat(currentBn5Process.price) || 0,
          sellingPrice: parseFloat(currentBn5Process.sellingPrice) || 0,
        },
        packagingData: inputValues.map((input) => ({
          label: input.label,
          bn5Amount: parseFloat(input.bn) || 0,
          quantity: parseFloat(input.value) || 0,
          unit: "kg",
          rope: input.label === "BN-5 Qop" ? (parseFloat(input.value) * 1.5).toFixed(2) : 0,
        })),
        timestamp: new Date().toISOString(),
      };

      await createBn5Production(payload).unwrap();

      refetch();
      toast.success("Mahsulot muvaffiyatli qadoqlandi va serverga tayyor!");
      setShowBn5ProcessDialog(false);
    } catch (error) {
      toast.error(error?.data?.message || "Xatolik yuz berdi, iltimos qaytadan urinib ko‘ring!");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputFields = () => {
    const { bn5Percent, melPercent } = calculatePercentages();

    const fields = [
      { label: <>BN-5 miqdori (kg) <span className="percent-info">({bn5Percent}%)</span></>, key: "bn5Amount", placeholder: "5000" },
      { label: <>Mel miqdori (kg) <span className="percent-info">({melPercent}%)</span></>, key: "melAmount", placeholder: "1800" },
      { label: <>Elektr energiyasi (kWh) <span className="price-info">({electricityPrice} so‘m/kWh)</span></>, key: "electricity", placeholder: "200" },
      { label: <>Gaz (m³) <span className="price-info">({gasPrice} so‘m/m³)</span></>, key: "gasAmount", placeholder: "200" },
      { label: "Boshqa xarajatlar", key: "extra", placeholder: "0" },
      { label: "Kraf qog‘oz (kg)", key: "kraftPaper", placeholder: "20" },
      { label: "BN-5 Qop (dona)", key: "qop", placeholder: "87" },
      { label: "BN-5 Tannarxi (1kg)", key: "price", placeholder: "0", readOnly: true },
      { label: "BN-5 Sotuv narxi (1kg)", key: "sellingPrice", placeholder: "0" },
    ];

    return fields.map(({ label, key, placeholder, readOnly }) => (
      <div className="bitum-input-group" key={key}>
        <label>{label}</label>
        <input
          type="number"
          value={currentBn5Process[key]}
          onChange={(e) => handleChange(key, e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>
    ));
  };

  // ✅ NEW: melsiz tanlansa quantity kerak emas
  const isMelsizSelected = packagingType === "mel";

  const handleOK = () => {
    if (!bn5Amount) {
      toast.error("Iltimos, BN-5 miqdorini kiriting!");
      return;
    }

    // ✅ quantity talab qilinmaydi (melsiz bo'lsa)
    if (!isMelsizSelected && !quantity) {
      toast.error("Iltimos, ikkinchi maydonni ham to'ldiring!");
      return;
    }

    const finalQuantity = isMelsizSelected ? "1" : quantity;

    const newEntry = {
      label: packagingConfig[packagingType].label,
      bn: bn5Amount,
      value: finalQuantity,
    };

    setInputValues((prev) => [...prev, newEntry]);

    setBn5Amount("");
    setFormattedBn5Amount("");
    setQuantity("");

    toast.success("Qadoqlash birligi qo‘shildi!");
  };

  const openTableModal = useCallback(() => setIsBn5SalesPrepTableModalOpen(true), []);
  const closeTableModal = useCallback(() => setIsBn5SalesPrepTableModalOpen(false), []);

  return (
    <>
      <div className="bitum-production-panel">
        <div className="bitum-panel-header">
          <Package size={24} color="#059669" />
          <h2>2-BOSQICH: BN-5 + Mel</h2>

          <button
            type="button"
            className="bn5__ui__tablePreviewButton--d21c"
            onClick={openTableModal}
            aria-label="BN-5 Sotuvga tayyorlash jadvali"
          >
            <PiTableDuotone />
          </button>
        </div>

        <div className="bitum-input-grid">{renderInputFields()}</div>

        <button className="bitum-action-button bitum-bn5-action" onClick={validateBn5Processing}>
          <ShoppingCart size={20} /> Qadoqlashga Tayyorlash
        </button>
      </div>

      {/* ------- TABLE MODAL ------- */}
      <Modal
        open={isBn5SalesPrepTableModalOpen}
        onCancel={closeTableModal}
        footer={null}
        centered
        width={820}
        className="bn5__ui__salesPrepModalRoot--e38a"
        title={<span className="bn5__ui__salesPrepTitle--c19f">BN-5 Sotuvga tayyorlash</span>}
      >
        <div className="bn5__ui__salesPrepModalBody--a550">
          <div className="bn5__ui__salesPrepMetaRow--c6a1">
            <div className="bn5__ui__salesPrepMetaItem--b6a9">
              <span className="bn5__ui__salesPrepMetaLabel--6c0f">Sana</span>
              <span className="bn5__ui__salesPrepMetaValue--c30b">{currentBn5Process.date}</span>
            </div>
            <div className="bn5__ui__salesPrepMetaItem--b6a9">
              <span className="bn5__ui__salesPrepMetaLabel--6c0f">Umumiy aralashma</span>
              <span className="bn5__ui__salesPrepMetaValue--c30b">
                {formatNumber((Number(currentBn5Process.bn5Amount) || 0) + (Number(currentBn5Process.melAmount) || 0))} kg
              </span>
            </div>
            <div className="bn5__ui__salesPrepMetaItem--b6a9">
              <span className="bn5__ui__salesPrepMetaLabel--6c0f">Tannarx (1kg)</span>
              <span className="bn5__ui__salesPrepMetaValue--c30b">{formatNumber(tannarxFromTable)}</span>
            </div>
          </div>

          <div className="bn5__ui__salesPrepTableWrap--6f1d">
            <table className="bn5__ui__salesPrepTable--db22">
              <thead className="bn5__ui__salesPrepThead--90b1">
                <tr>
                  <th className="bn5__ui__salesPrepTh--11a0">Xarajatlar</th>
                  <th className="bn5__ui__salesPrepTh--11a0">Miqdori</th>
                  <th className="bn5__ui__salesPrepTh--11a0">Bahosi</th>
                  <th className="bn5__ui__salesPrepTh--11a0">Qiymati</th>
                </tr>
              </thead>
              <tbody className="bn5__ui__salesPrepTbody--1e7a">
                {bn5SalesPrepRows.map((r, idx) => (
                  <tr key={idx} className="bn5__ui__salesPrepTr--81e1">
                    <td className="bn5__ui__salesPrepTdName--93b4">{r.name}</td>
                    <td className="bn5__ui__salesPrepTdNum--b9d0">
                      {r.qty !== "" ? formatNumber(r.qty) : ""}
                      {r.note ? ` ${r.note}` : ""}
                    </td>
                    <td className="bn5__ui__salesPrepTdNum--b9d0">{r.price !== "" ? formatNumber(r.price) : ""}</td>
                    <td className="bn5__ui__salesPrepTdNum--b9d0">{formatNumber(r.sum)}</td>
                  </tr>
                ))}

                <tr className="bn5__ui__salesPrepSummaryRow--0f62">
                  <td className="bn5__ui__salesPrepSummaryCell--69ad">Jami xarajatlar</td>
                  <td className="bn5__ui__salesPrepSummaryCell--69ad"></td>
                  <td className="bn5__ui__salesPrepSummaryCell--69ad"></td>
                  <td className="bn5__ui__salesPrepSummaryCell--69ad">{formatNumber(totalExpenses)}</td>
                </tr>

                <tr className="bn5__ui__salesPrepFooterRow--a2c7">
                  <td className="bn5__ui__salesPrepFooterCell--c0d1" colSpan={2}></td>
                  <td className="bn5__ui__salesPrepFooterCell--c0d1 bn5__ui__salesPrepFooterAccent--d2f0">
                    Tannarx
                  </td>
                  <td className="bn5__ui__salesPrepFooterCell--c0d1 bn5__ui__salesPrepFooterAccent--d2f0">
                    {formatNumber(tannarxFromTable)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bn5__ui__salesPrepNoteBox--a94e">
            <div className="bn5__ui__salesPrepNoteTitle--90f2">Izoh</div>
            <div className="bn5__ui__salesPrepNoteText--0b68">
              Ushbu jadvaldagi qiymatlar formadagi kiritilgan ma’lumotlardan avtomatik hisoblanadi.
            </div>
          </div>
        </div>
      </Modal>

      {/* ------- PACKAGING DIALOG ------- */}
      {showBn5ProcessDialog && (
        <div className="bitum-dialog-overlay">
          <div className="bitum-dialog-box">
            <h3>Mahsulotni Qadoqlash</h3>
            <p>
              Umumiy aralashma:{" "}
              <strong>
                {(
                  parseFloat(currentBn5Process.bn5Amount) +
                  parseFloat(currentBn5Process.melAmount) -
                  inputValues.reduce((sum, item) => sum + +item.bn, 0)
                ).toLocaleString()}{" "}
                kg
              </strong>
            </p>

            <div className="bitum-packaging-buttons">
              {Object.keys(packagingConfig).map((type) => (
                <button
                  key={type}
                  className={`bitum-action-button ${packagingType === type ? "active" : ""}`}
                  onClick={() => {
                    setPackagingType(type);

                    // ✅ mel tanlansa unitType baribir "kilo" deb qolsin (ikkinchi input yo'q bo'ladi)
                    if (type === "bag") setUnitType("dona");
                    else setUnitType("kilo");

                    // ✅ mel tanlanganda eski quantity qiymatini tozalab yuboramiz
                    if (type === "mel") setQuantity("");
                  }}
                >
                  {packagingConfig[type].label}
                </button>
              ))}
            </div>

            <div className="input-container">
              <input
                type="text"
                className="input-field"
                placeholder="Bn-5 miqdorini kiriting (kg)"
                value={formattedBn5Amount}
                onChange={handleBn5AmountChange}
              />

              {/* ✅ melsiz tanlansa ikkinchi input ko'rinmaydi */}
              {!isMelsizSelected && (
                <input
                  type="text"
                  className="input-field"
                  placeholder={unitType === "dona" ? "BN-5 Qoplar sonini kiriting" : "Kraf qog'oz miqdorini (kg)"}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              )}

              <button className="action-button" onClick={handleOK}>
                OK
              </button>
            </div>

            <div className="input-values-container">
              {inputValues.length > 0 ? (
                inputValues.map((input, index) => (
                  <div key={index} className="input-value-card">
                    <button className="del-inp-value" onClick={() => handleDeleteInputValue(index)}>
                      <RiDeleteBin6Line />
                    </button>

                    <span className="package-type">{input.label}</span>
                    <span className="package-info">BN-5 + Mel: {formatNumber(input.bn)} kg</span>

                    {/* ✅ melsiz bo'lsa quantity ko'rsatmaymiz */}
                    {input.label !== "BN-5 Melsiz" ? (
                      <span className="package-info">
                        {input.label === "BN-5 Qop" ? input.label : "Kraf qog'oz"} {input.value}{" "}
                        {input.label === "BN-5 Qop" ? "dona" : "kg"}
                      </span>
                    ) : (
                      <span className="package-info">Melsiz qadoqlash (qo‘shimcha birlik talab qilinmaydi)</span>
                    )}

                    {input.label === "BN-5 Qop" && (
                      <span className="package-info">Ip: {(parseFloat(input.value) * 1.5).toFixed(2)} g</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-package-text">Hech qanday qadoqlash birligi qo‘shilmagan.</p>
              )}
            </div>

            <div className="bitum-dialog-actions">
              <button className="bitum-cancel-button" onClick={() => setShowBn5ProcessDialog(false)}>
                Bekor qilish
              </button>
              <Button
                className="bitum-confirm-button bitum-bn5-confirm"
                onClick={confirmBn5Processing}
                disabled={isLoading}
                loading={isLoading}
              >
                {isLoading ? <span>Loading...</span> : "Tasdiqlash"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Bn5ProcessDialog;
