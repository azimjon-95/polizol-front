import React, { useState, useMemo } from "react";
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

        try {
            const payload = {
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

