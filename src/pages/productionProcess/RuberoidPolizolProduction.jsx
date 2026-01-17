import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Form } from "antd";
import { toast } from "react-toastify";
import { capitalizeFirstLetter } from "../../hook/CapitalizeFirstLitter";
import { NumberFormat } from "../../hook/NumberFormat";
import { useGetAllNormaQuery } from "../../context/normaApi";
import { useGetAllMaterialsQuery } from "../../context/materialApi";
import { useStartProductionProcessMutation } from "../../context/productionApi";

const RuberoidPolizolProduction = () => {
    // ✅ Quantity endi category bo‘yicha alohida saqlanadi
    const [quantityByCategory, setQuantityByCategory] = useState({
        ruberoid: {},
        polizol: {},
    });

    const [selectedCategory, setSelectedCategory] = useState("polizol");
    const [isDefective, setIsDefective] = useState(false);

    const [form] = Form.useForm();
    const [consumedQuantities, setConsumedQuantities] = useState({});
    const [gasConsumption, setGasConsumption] = useState("");
    const [electricityConsumption, setElectricityConsumption] = useState("");
    const [periodExpense, setPeriodExpense] = useState(""); // String for empty detection

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isPreviousDay, setIsPreviousDay] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const lastCheckedDayRef = useRef(new Date().getDate());

    const { data: materials = { innerData: [] }, refetch, isLoading: materialsLoading, error: materialsError } =
        useGetAllMaterialsQuery();
    const { data: normas = { innerData: [] }, isLoading: normasLoading, error: normasError } =
        useGetAllNormaQuery();
    const [startProduction, { isLoading: productionLoading }] = useStartProductionProcessMutation();

    // Sana har kuni yangilanishi uchun
    useEffect(() => {
        const checkDayChange = () => {
            const now = new Date();
            const todayDay = now.getDate();
            if (todayDay !== lastCheckedDayRef.current) {
                lastCheckedDayRef.current = todayDay;
                setCurrentDate(now);
                if (!isPreviousDay) setSelectedDate(now);
            }
        };

        checkDayChange();
        const interval = setInterval(checkDayChange, 60000);
        return () => clearInterval(interval);
    }, [isPreviousDay]);

    // Error toastlar (spam bo‘lmasin deb toastId ishlatilyapti)
    useEffect(() => {
        if (normasError) {
            toast.error(
                normasError?.data?.message || "Mahsulot turlari ma'lumotlarini olishda xatolik yuz berdi",
                { toastId: "normas-error" }
            );
        }
    }, [normasError]);

    useEffect(() => {
        if (materialsError) {
            toast.error(
                materialsError?.data?.message || "Xom ashyo ma'lumotlarini olishda xatolik yuz berdi",
                { toastId: "materials-error" }
            );
        }
    }, [materialsError]);

    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const toggleDate = () => {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        if (!isPreviousDay) {
            setSelectedDate(yesterday);
            setIsPreviousDay(true);
        } else {
            setSelectedDate(now);
            setIsPreviousDay(false);
        }
    };

    const handleConsumedQuantityChange = (materialId, value) => {
        const parsedValue = parseFloat(value);
        setConsumedQuantities((prev) => ({
            ...prev,
            [materialId]: Number.isNaN(parsedValue) ? 0 : parsedValue,
        }));
    };

    const handleGasConsumptionChange = (value) => {
        const parsedValue = parseFloat(value);
        setGasConsumption(Number.isNaN(parsedValue) ? "" : parsedValue);
    };

    const handleElectricityConsumptionChange = (value) => {
        const parsedValue = parseFloat(value);
        setElectricityConsumption(Number.isNaN(parsedValue) ? "" : parsedValue);
    };

    const handlePeriodExpenseChange = (value) => {
        setPeriodExpense(value);
    };

    const handleSetPeriodToZero = () => {
        setPeriodExpense("0");
    };

    // ✅ Tab bo‘yicha quantity yozish
    const handleQuantityChange = (normaId, value) => {
        const parsedValue = parseInt(value, 10);

        setQuantityByCategory((prev) => ({
            ...prev,
            [selectedCategory]: {
                ...prev[selectedCategory],
                [normaId]: isNaN(parsedValue) || parsedValue < 1 ? undefined : parsedValue,
            },
        }));
    };

    // Tabga mos norma chiqarish
    const filteredNormas = useMemo(() => {
        return (
            normas?.innerData?.filter((norma) =>
                selectedCategory === "polizol"
                    ? norma.category === "polizol" || norma.category === "folygoizol"
                    : norma.category === selectedCategory
            ) || []
        );
    }, [normas, selectedCategory]);

    // Tez lookup uchun norma map
    const normasById = useMemo(() => {
        const map = new Map();
        (normas?.innerData || []).forEach((n) => map.set(String(n._id), n));
        return map;
    }, [normas]);

    // ✅ Eng muhim: Ruberoid + Polizol (ikkalasini ham) yig‘ish
    const selectedProductsAll = useMemo(() => {
        const result = [];

        Object.entries(quantityByCategory.ruberoid || {}).forEach(([normaId, qty]) => {
            if (!qty || qty <= 0) return;
            const norma = normasById.get(String(normaId));
            if (!norma) return;
            result.push({
                normaId,
                name: norma.productName,
                quantity: qty,
                category: "ruberoid",
            });
        });

        Object.entries(quantityByCategory.polizol || {}).forEach(([normaId, qty]) => {
            if (!qty || qty <= 0) return;
            const norma = normasById.get(String(normaId));
            if (!norma) return;
            result.push({
                normaId,
                name: norma.productName,
                quantity: qty,
                category: "polizol",
            });
        });

        return result;
    }, [quantityByCategory, normasById]);

    // UI summary uchun
    const totalSelectedCount = useMemo(() => {
        return selectedProductsAll.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    }, [selectedProductsAll]);

    const ruberoidCount = useMemo(() => {
        return Object.values(quantityByCategory.ruberoid || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    }, [quantityByCategory]);

    const polizolCount = useMemo(() => {
        return Object.values(quantityByCategory.polizol || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    }, [quantityByCategory]);

    // ✅ Bitta yuborish
    const handleProduce = useCallback(async () => {
        if (selectedProductsAll.length === 0) {
            return toast.warning("Iltimos, kamida bitta mahsulot miqdorini kiriting");
        }

        if (gasConsumption === "" || electricityConsumption === "") {
            return toast.warning("Iltimos, gas va elektr energiya sarfini kiriting");
        }

        if (String(periodExpense).trim() === "") {
            return toast.error("Iltimos, davr harajatlari ni kiriting yoki 0 ga o'rnating");
        }

        try {
            const parsedPeriodExpense = parseFloat(periodExpense) || 0;

            const payload = {
                date: formatDate(selectedDate),
                products: selectedProductsAll,
                consumedMaterials: Object.entries(consumedQuantities)
                    .filter(([_, qty]) => (parseFloat(qty) || 0) > 0)
                    .map(([materialId, quantity]) => ({
                        materialId,
                        quantity: parseFloat(quantity) || 0,
                    })),
                utilities: {
                    gasConsumption: parseFloat(gasConsumption) || 0,
                    electricityConsumption: parseFloat(electricityConsumption) || 0,
                    periodExpense: parsedPeriodExpense,
                },
                // isDefective: isDefective, // agar backendda kerak bo‘lsa
            };

            await startProduction(payload).unwrap();

            toast.success(
                `Muvaffaqiyatli ishlab chiqarildi: ${selectedProductsAll
                    .map((p) => `${p.quantity} dona ${p.name}`)
                    .join(", ")}${isDefective ? " (Brak)" : ""}`
            );

            refetch();

            // reset
            setQuantityByCategory({ ruberoid: {}, polizol: {} });
            setConsumedQuantities({});
            setGasConsumption("");
            setElectricityConsumption("");
            setPeriodExpense("");
            setIsDefective(false);
            form.resetFields();
        } catch (error) {
            toast.error(error?.data?.innerData || error?.data?.message || "Ishlab chiqarishda xatolik yuz berdi");
        }
    }, [
        selectedProductsAll,
        gasConsumption,
        electricityConsumption,
        periodExpense,
        consumedQuantities,
        selectedDate,
        startProduction,
        refetch,
        form,
        isDefective,
    ]);

    return (
        <div
            style={{
                height: "91vh",
                overflowY: "auto",
                overflowX: "hidden",
                paddingBottom: "24px",
            }}
            className="production-system-scroll"
        >
            <div className="production-card">
                <div className="category-buttons">
                    <button
                        type="button"
                        className={`category-button ${selectedCategory === "ruberoid" ? "active" : ""}`}
                        onClick={() => setSelectedCategory("ruberoid")}
                    >
                        Ruberoid
                    </button>
                    <button
                        type="button"
                        className={`category-button ${selectedCategory === "polizol" ? "active" : ""}`}
                        onClick={() => setSelectedCategory("polizol")}
                    >
                        Polizol
                    </button>

                    {/* <button
                        type="button"
                        className="category-button"
                        onClick={toggleDate}
                        title={isPreviousDay ? "Bugungi kunga qaytish" : "Kechagi kunga o‘tish"}
                    >
                        {isPreviousDay ? `Bugun: ${formatDate(currentDate)}` : `Kechagi: ${formatDate(new Date(currentDate.getTime() - 86400000))}`}
                    </button> */}
                </div>

                {/* Summary */}
                {/* <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                        Ruberoid: <b>{ruberoidCount}</b> dona
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                        Polizol: <b>{polizolCount}</b> dona
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                        Jami: <b>{totalSelectedCount}</b> dona
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                        Sana: <b>{formatDate(selectedDate)}</b>
                    </div>
                </div> */}

                <div className="energy-consumption-section">
                    <div className="energy-input-group">
                        <label className="form-label">Gaz sarfi (m³)</label>
                        <input
                            type="number"
                            placeholder="Gaz sarfini kiriting (m³)"
                            value={gasConsumption}
                            onChange={(e) => handleGasConsumptionChange(e.target.value)}
                            className="material-consumed-input"
                            min="0"
                            step="0.1"
                        />
                    </div>

                    <div className="energy-input-group">
                        <label className="form-label">Elektr energiyasi sarfi (kWh)</label>
                        <input
                            type="number"
                            placeholder="Elektr energiyasi sarfini kiriting (kWh)"
                            value={electricityConsumption}
                            onChange={(e) => handleElectricityConsumptionChange(e.target.value)}
                            className="material-consumed-input"
                            min="0"
                            step="0.1"
                        />
                    </div>

                    <div className="energy-input-group">
                        <label className="form-label">Davr harajatlari (so'm)</label>
                        <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                            <input
                                type="number"
                                placeholder="Davr harajatlarini kiriting (so'm)"
                                value={periodExpense}
                                onChange={(e) => handlePeriodExpenseChange(e.target.value)}
                                className="material-consumed-input"
                                min="0"
                                step="1000"
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={handleSetPeriodToZero}
                                className="set-zero-button"
                                style={{
                                    padding: "7.5px 4px 7.5px 4px",
                                    backgroundColor: "#f0f0f0",
                                    border: "1px solid #d9d9d9",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    height: "fit-content",
                                }}
                            >
                                0
                            </button>
                        </div>
                    </div>
                </div>

                <div className="production-form-box">
                    <div className="production-form-grid">
                        <div>
                            <label className="form-label">Mahsulot turini tanlang</label>

                            <div className="norma-menu">
                                <div>
                                    {normasLoading ? (
                                        <p>Yuklanmoqda...</p>
                                    ) : filteredNormas.length > 0 ? (
                                        filteredNormas.map((norma) => (
                                            <div key={norma._id} className="norma-item">
                                                {capitalizeFirstLetter(norma.productName)}
                                                <input
                                                    type="number"
                                                    value={quantityByCategory[selectedCategory]?.[norma._id] || ""}
                                                    onChange={(e) => handleQuantityChange(norma._id, e.target.value)}
                                                    className="quantity-input"
                                                    placeholder="Miqdori..."
                                                    min="1"
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <p>Mahsulot topilmadi</p>
                                    )}
                                </div>

                                {/* ✅ Bitta yuborish tugmasi */}
                                <button
                                    type="button"
                                    disabled={
                                        selectedProductsAll.length === 0 ||
                                        normasLoading ||
                                        productionLoading ||
                                        materialsLoading
                                    }
                                    onClick={handleProduce}
                                    className="produce-button"
                                >
                                    {productionLoading ? "Yuborilmoqda..." : "Yuborish"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="materials-required-card">
                        <h3 className="materials-required-title">Kerakli xom ashyolar:</h3>

                        {materials?.innerData?.map((req, index) => (
                            <div key={index} className="material-item">
                                <span>{req.name}</span>
                                <span className="material-quantity">
                                    Narxi: {NumberFormat(Math.floor(req.price))} so'm
                                </span>
                                <span className="material-quantity">
                                    Mavjud: {NumberFormat(req.quantity)} {req?.unit}
                                </span>

                                <span className="materialId_unitInp">
                                    <input
                                        type="number"
                                        placeholder="Sariflangan miqdori..."
                                        value={consumedQuantities[req._id] || ""}
                                        onChange={(e) => handleConsumedQuantityChange(req._id, e.target.value)}
                                        onWheel={(e) => e.currentTarget.blur()} // ✅ scroll bo'lsa qiymat o'zgarmaydi
                                        className="material-consumed-input"
                                        min="0"
                                    />
                                    <span className="materialId_unit">{req?.unit}</span>
                                </span>
                            </div>
                        )) || <p>Xom ashyo ma'lumotlari topilmadi</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RuberoidPolizolProduction;


