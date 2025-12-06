import React, { useState, useMemo, useEffect, useRef } from "react";
import { Form } from "antd";
import { toast } from "react-toastify";
import { capitalizeFirstLetter } from "../../hook/CapitalizeFirstLitter";
import { NumberFormat } from "../../hook/NumberFormat";
import { useGetAllNormaQuery } from "../../context/normaApi";
import { useGetAllMaterialsQuery } from "../../context/materialApi";
import { useStartProductionProcessMutation } from "../../context/productionApi";

const RuberoidPolizolProduction = () => {
    const [quantityToProduce, setQuantityToProduce] = useState({});
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

    // Sana har kuni yangilanishi uchun (live update, masalan, yangi kun boshlanganda)
    useEffect(() => {
        const checkDayChange = () => {
            const now = new Date();
            const todayDay = now.getDate();
            if (todayDay !== lastCheckedDayRef.current) {
                lastCheckedDayRef.current = todayDay;
                setCurrentDate(now);
                // Faqat previous day rejimida bo'lmasa, selectedDate ni yangilang
                if (!isPreviousDay) {
                    setSelectedDate(now);
                }
            }
        };

        checkDayChange(); // Dastlabki tekshiruv

        const interval = setInterval(checkDayChange, 60000); // Har daqiqada tekshiring (yangi kunni aniqlash uchun)

        return () => clearInterval(interval);
    }, [isPreviousDay]); // isPreviousDay o'zgarganda ham tekshirishni qayta ishga tushirish

    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const toggleDate = () => {
        const now = new Date(); // Har doim joriy vaqtni oling
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        if (!isPreviousDay) {
            // birinchi marta bosilganda — kechagi kunga o‘tadi
            setSelectedDate(yesterday);
            setIsPreviousDay(true);
        } else {
            // keyingi bosishda — bugungi kunga qaytadi
            setSelectedDate(now);
            setIsPreviousDay(false);
        }
    };

    const { data: materials = { innerData: [] }, refetch, isLoading: materialsLoading, error: materialsError } = useGetAllMaterialsQuery();
    const { data: normas = { innerData: [] }, isLoading: normasLoading, error: normasError } = useGetAllNormaQuery();
    const [startProduction, { isLoading: productionLoading }] = useStartProductionProcessMutation();

    if (normasError) {
        toast.error(normasError.data?.message || "Mahsulot turlari ma'lumotlarini olishda xatolik yuz berdi", { toastId: "normas-error" });
    }

    if (materialsError) {
        toast.error(materialsError.data?.message || "Xom ashyo ma'lumotlarini olishda xatolik yuz berdi", { toastId: "materials-error" });
    }

    const handleConsumedQuantityChange = (materialId, value) => {
        const parsedValue = parseFloat(value) || 0;
        setConsumedQuantities((prev) => ({ ...prev, [materialId]: parsedValue }));
    };

    const handleGasConsumptionChange = (value) => {
        const parsedValue = parseFloat(value) || 0;
        setGasConsumption(parsedValue);
    };

    const handleElectricityConsumptionChange = (value) => {
        const parsedValue = parseFloat(value) || 0;
        setElectricityConsumption(parsedValue);
    };

    const handlePeriodExpenseChange = (value) => {
        setPeriodExpense(value); // Keep as string to detect empty
    };

    const handleSetPeriodToZero = () => {
        setPeriodExpense("0"); // Set to "0" string
    };

    const handleQuantityChange = (normaId, value) => {
        const parsedValue = parseInt(value, 10);
        setQuantityToProduce((prev) => ({
            ...prev,
            [normaId]: isNaN(parsedValue) || parsedValue < 1 ? undefined : parsedValue,
        }));
    };

    const filteredNormas = useMemo(() => {
        return normas?.innerData?.filter((norma) =>
            selectedCategory === "polizol"
                ? norma.category === "polizol" || norma.category === "folygoizol"
                : norma.category === selectedCategory
        ) || [];
    }, [normas, selectedCategory]);

    const selectedProducts = useMemo(() => {
        return Object.entries(quantityToProduce)
            .filter(([, qty]) => qty > 0)
            .map(([normaId, quantity]) => {
                const norma = filteredNormas.find((n) => n._id === normaId);
                return norma ? { normaId, name: norma.productName, quantity, category: selectedCategory } : null;
            })
            .filter(Boolean);
    }, [quantityToProduce, filteredNormas, selectedCategory]);

    const handleProduce = async () => {
        if (selectedProducts.length === 0) {
            return toast.warning("Iltimos, kamida bitta mahsulot miqdorini kiriting");
        }

        if (!gasConsumption || !electricityConsumption) {
            return toast.warning("Iltimos, gas va elektr energiya sarfini kiriting");
        }

        if (periodExpense.trim() === "") {
            return toast.error("Iltimos, davr harajatlari ni kiriting yoki 0 ga o'rnating");
        }

        try {
            const parsedPeriodExpense = parseFloat(periodExpense) || 0;
            const payload = {
                date: formatDate(selectedDate),
                products: selectedProducts,
                consumedMaterials: Object.entries(consumedQuantities)
                    .filter(([_, qty]) => qty > 0) // faqat qiymati kiritilgan materiallar
                    .map(([materialId, quantity]) => ({
                        materialId,
                        quantity,
                    })),
                utilities: {
                    gasConsumption: gasConsumption || 0,
                    electricityConsumption: electricityConsumption || 0,
                    periodExpense: parsedPeriodExpense,

                },
            };

            await startProduction(payload).unwrap();
            toast.success(
                `Muvaffaqiyatli ishlab chiqarildi: ${selectedProducts
                    .map((p) => `${p.quantity} dona ${p.name}`)
                    .join(", ")}${isDefective ? " (Brak sifatida belgilandi)" : ""}`
            );
            refetch();
            setQuantityToProduce({});
            setConsumedQuantities({});
            setGasConsumption("");
            setPeriodExpense(""); // Reset to empty string
            setElectricityConsumption("");
            setIsDefective(false);
            form.resetFields();
        } catch (error) {
            toast.error(error.data?.innerData || error.data?.message || "Ishlab chiqarishda xatolik yuz berdi");
        }
    };

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
                        className={`category-button ${selectedCategory === "ruberoid" ? "active" : ""}`}
                        onClick={() => setSelectedCategory("ruberoid")}
                    >
                        Ruberoid
                    </button>
                    <button
                        className={`category-button ${selectedCategory === "polizol" ? "active" : ""}`}
                        onClick={() => setSelectedCategory("polizol")}
                    >
                        Polizol
                    </button>
                </div>
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
                                    height: "fit-content"
                                }}
                            >
                                0
                            </button>
                        </div>
                    </div>

                    {/* <div className="date-section">
                        <button
                            type="button"
                            onClick={toggleDate}
                            className="date-nav-button"
                            style={{
                                width: "27px",
                                height: "27px",
                                backgroundColor: "#1890ff",
                                color: "white",
                                border: "none",
                                padding: "0px 0px 2px 0px",
                                borderRadius: "50%",
                                cursor: "pointer",
                                fontSize: "16px"
                            }}
                        >
                            {isPreviousDay ? "→" : "←"}
                        </button>
                        <div className="current-date" style={{ fontSize: "15px" }}>
                            {formatDate(selectedDate)}
                        </div>
                    </div> */}
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
                                                    value={quantityToProduce[norma._id] || ""}
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
                                <button
                                    disabled={selectedProducts.length === 0 || normasLoading || productionLoading || materialsLoading}
                                    onClick={handleProduce}
                                    className="produce-button"
                                >
                                    {productionLoading ? "Ishlab chiqarilmoqda..." : "Ishlab Chiqarish"}
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
                                    Narxi: {NumberFormat(req.price)} so'm
                                </span>
                                <span className="material-quantity">
                                    Mavjud: {NumberFormat(req.quantity)} {req?.unit}
                                </span>
                                <span className="materialId_unitInp">
                                    <input
                                        type="number"
                                        placeholder="Sariflangan miqdori..."
                                        value={consumedQuantities[req._id] || ""}
                                        onChange={(e) =>
                                            handleConsumedQuantityChange(req._id, e.target.value)
                                        }
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





// import React, { useState, useMemo } from "react";
// import { Form } from "antd";
// import { toast } from "react-toastify";
// import { capitalizeFirstLetter } from "../../hook/CapitalizeFirstLitter";
// import { NumberFormat } from "../../hook/NumberFormat";
// import { useGetAllNormaQuery } from "../../context/normaApi";
// import { useGetAllMaterialsQuery } from "../../context/materialApi";
// import { useStartProductionProcessMutation } from "../../context/productionApi";

// const RuberoidPolizolProduction = () => {
//     const [quantityToProduce, setQuantityToProduce] = useState({});
//     const [selectedCategory, setSelectedCategory] = useState("polizol");
//     const [isDefective, setIsDefective] = useState(false);
//     const [form] = Form.useForm();
//     const [consumedQuantities, setConsumedQuantities] = useState({});
//     const [gasConsumption, setGasConsumption] = useState("");
//     const [electricityConsumption, setElectricityConsumption] = useState("");
//     const [periodExpense, setPeriodExpense] = useState(""); // String for empty detection

//     const { data: materials = { innerData: [] }, refetch, isLoading: materialsLoading, error: materialsError } = useGetAllMaterialsQuery();
//     const { data: normas = { innerData: [] }, isLoading: normasLoading, error: normasError } = useGetAllNormaQuery();
//     const [startProduction, { isLoading: productionLoading }] = useStartProductionProcessMutation();

//     if (normasError) {
//         toast.error(normasError.data?.message || "Mahsulot turlari ma'lumotlarini olishda xatolik yuz berdi", { toastId: "normas-error" });
//     }

//     if (materialsError) {
//         toast.error(materialsError.data?.message || "Xom ashyo ma'lumotlarini olishda xatolik yuz berdi", { toastId: "materials-error" });
//     }

//     const handleConsumedQuantityChange = (materialId, value) => {
//         const parsedValue = parseFloat(value) || 0;
//         setConsumedQuantities((prev) => ({ ...prev, [materialId]: parsedValue }));
//     };

//     const handleGasConsumptionChange = (value) => {
//         const parsedValue = parseFloat(value) || 0;
//         setGasConsumption(parsedValue);
//     };

//     const handleElectricityConsumptionChange = (value) => {
//         const parsedValue = parseFloat(value) || 0;
//         setElectricityConsumption(parsedValue);
//     };

//     const handlePeriodExpenseChange = (value) => {
//         setPeriodExpense(value); // Keep as string to detect empty
//     };

//     const handleSetPeriodToZero = () => {
//         setPeriodExpense("0"); // Set to "0" string
//     };

//     const handleQuantityChange = (normaId, value) => {
//         const parsedValue = parseInt(value, 10);
//         setQuantityToProduce((prev) => ({
//             ...prev,
//             [normaId]: isNaN(parsedValue) || parsedValue < 1 ? undefined : parsedValue,
//         }));
//     };

//     const filteredNormas = useMemo(() => {
//         return normas?.innerData?.filter((norma) =>
//             selectedCategory === "polizol"
//                 ? norma.category === "polizol" || norma.category === "folygoizol"
//                 : norma.category === selectedCategory
//         ) || [];
//     }, [normas, selectedCategory]);

//     const selectedProducts = useMemo(() => {
//         return Object.entries(quantityToProduce)
//             .filter(([, qty]) => qty > 0)
//             .map(([normaId, quantity]) => {
//                 const norma = filteredNormas.find((n) => n._id === normaId);
//                 return norma ? { normaId, name: norma.productName, quantity, category: selectedCategory } : null;
//             })
//             .filter(Boolean);
//     }, [quantityToProduce, filteredNormas, selectedCategory]);

//     const handleProduce = async () => {
//         if (selectedProducts.length === 0) {
//             return toast.warning("Iltimos, kamida bitta mahsulot miqdorini kiriting");
//         }

//         if (!gasConsumption || !electricityConsumption) {
//             return toast.warning("Iltimos, gas va elektr energiya sarfini kiriting");
//         }

//         if (periodExpense.trim() === "") {
//             return toast.error("Iltimos, davr harajatlari ni kiriting yoki 0 ga o'rnating");
//         }

//         try {
//             const parsedPeriodExpense = parseFloat(periodExpense) || 0;
//             const payload = {
//                 products: selectedProducts,
//                 consumedMaterials: Object.entries(consumedQuantities)
//                     .filter(([_, qty]) => qty > 0) // faqat qiymati kiritilgan materiallar
//                     .map(([materialId, quantity]) => ({
//                         materialId,
//                         quantity,
//                     })),
//                 utilities: {
//                     gasConsumption: gasConsumption || 0,
//                     electricityConsumption: electricityConsumption || 0,
//                     periodExpense: parsedPeriodExpense
//                 },
//             };

//             await startProduction(payload).unwrap();
//             toast.success(
//                 `Muvaffaqiyatli ishlab chiqarildi: ${selectedProducts
//                     .map((p) => `${p.quantity} dona ${p.name}`)
//                     .join(", ")}${isDefective ? " (Brak sifatida belgilandi)" : ""}`
//             );
//             refetch();
//             setQuantityToProduce({});
//             setConsumedQuantities({});
//             setGasConsumption("");
//             setPeriodExpense(""); // Reset to empty string
//             setElectricityConsumption("");
//             setIsDefective(false);
//             form.resetFields();
//         } catch (error) {
//             toast.error(error.data?.innerData || error.data?.message || "Ishlab chiqarishda xatolik yuz berdi");
//         }
//     };

//     return (
//         <div
//             style={{
//                 height: "91vh",
//                 overflowY: "auto",
//                 overflowX: "hidden",
//                 paddingBottom: "24px",
//             }}
//             className="production-system-scroll"
//         >
//             <div className="production-card">
//                 <div className="category-buttons">
//                     <button
//                         className={`category-button ${selectedCategory === "ruberoid" ? "active" : ""}`}
//                         onClick={() => setSelectedCategory("ruberoid")}
//                     >
//                         Ruberoid
//                     </button>
//                     <button
//                         className={`category-button ${selectedCategory === "polizol" ? "active" : ""}`}
//                         onClick={() => setSelectedCategory("polizol")}
//                     >
//                         Polizol
//                     </button>
//                 </div>
//                 <div className="energy-consumption-section">
//                     <div className="energy-input-group">
//                         <label className="form-label">Gaz sarfi (m³)</label>
//                         <input
//                             type="number"
//                             placeholder="Gaz sarfini kiriting (m³)"
//                             value={gasConsumption}
//                             onChange={(e) => handleGasConsumptionChange(e.target.value)}
//                             className="material-consumed-input"
//                             min="0"
//                             step="0.1"
//                         />
//                     </div>

//                     <div className="energy-input-group">
//                         <label className="form-label">Elektr energiyasi sarfi (kWh)</label>
//                         <input
//                             type="number"
//                             placeholder="Elektr energiyasi sarfini kiriting (kWh)"
//                             value={electricityConsumption}
//                             onChange={(e) => handleElectricityConsumptionChange(e.target.value)}
//                             className="material-consumed-input"
//                             min="0"
//                             step="0.1"
//                         />
//                     </div>

//                     <div className="energy-input-group">
//                         <label className="form-label">Davr harajatlari (so'm)</label>
//                         <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
//                             <input
//                                 type="number"
//                                 placeholder="Davr harajatlarini kiriting (so'm)"
//                                 value={periodExpense}
//                                 onChange={(e) => handlePeriodExpenseChange(e.target.value)}
//                                 className="material-consumed-input"
//                                 min="0"
//                                 step="1000"
//                                 style={{ flex: 1 }}
//                             />
//                             <button
//                                 type="button"
//                                 onClick={handleSetPeriodToZero}
//                                 className="set-zero-button"
//                                 style={{
//                                     padding: "8px 12px",
//                                     backgroundColor: "#f0f0f0",
//                                     border: "1px solid #d9d9d9",
//                                     borderRadius: "4px",
//                                     cursor: "pointer",
//                                     fontSize: "14px",
//                                     minWidth: "40px",
//                                     height: "fit-content"
//                                 }}
//                             >
//                                 0
//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="production-form-box">
//                     <div className="production-form-grid">
//                         <div>
//                             <label className="form-label">Mahsulot turini tanlang</label>
//                             <div className="norma-menu">
//                                 <div>
//                                     {normasLoading ? (
//                                         <p>Yuklanmoqda...</p>
//                                     ) : filteredNormas.length > 0 ? (
//                                         filteredNormas.map((norma) => (
//                                             <div key={norma._id} className="norma-item">
//                                                 {capitalizeFirstLetter(norma.productName)}
//                                                 <input
//                                                     type="number"
//                                                     value={quantityToProduce[norma._id] || ""}
//                                                     onChange={(e) => handleQuantityChange(norma._id, e.target.value)}
//                                                     className="quantity-input"
//                                                     placeholder="Miqdori..."
//                                                     min="1"
//                                                 />
//                                             </div>
//                                         ))
//                                     ) : (
//                                         <p>Mahsulot topilmadi</p>
//                                     )}
//                                 </div>
//                                 <button
//                                     disabled={selectedProducts.length === 0 || normasLoading || productionLoading || materialsLoading}
//                                     onClick={handleProduce}
//                                     className="produce-button"
//                                 >
//                                     {productionLoading ? "Ishlab chiqarilmoqda..." : "Ishlab Chiqarish"}
//                                 </button>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="materials-required-card">
//                         <h3 className="materials-required-title">Kerakli xom ashyolar:</h3>
//                         {materials?.innerData?.map((req, index) => (
//                             <div key={index} className="material-item">
//                                 <span>{req.name}</span>
//                                 <span className="material-quantity">
//                                     Narxi: {NumberFormat(req.price)} so'm
//                                 </span>
//                                 <span className="material-quantity">
//                                     Mavjud: {NumberFormat(req.quantity)} {req?.unit}
//                                 </span>
//                                 <span className="materialId_unitInp">
//                                     <input
//                                         type="number"
//                                         placeholder="Sariflangan miqdori..."
//                                         value={consumedQuantities[req._id] || ""}
//                                         onChange={(e) =>
//                                             handleConsumedQuantityChange(req._id, e.target.value)
//                                         }
//                                         className="material-consumed-input"
//                                         min="0"
//                                     />
//                                     <span className="materialId_unit">{req?.unit}</span>
//                                 </span>
//                             </div>
//                         )) || <p>Xom ashyo ma'lumotlari topilmadi</p>}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default RuberoidPolizolProduction;



