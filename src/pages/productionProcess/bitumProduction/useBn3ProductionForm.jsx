import React, { useEffect, useMemo, useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";
import { Button } from "antd";
import { toast } from "react-toastify";
import "./style.css";

import { useGetFilteredMaterialsQuery } from "../../../context/materialApi";
import { useCreateBn5ProductionMutation } from "../../../context/productionApi";

const Bn3Production = () => {
    const { data: material, refetch, isLoading, isFetching } =
        useGetFilteredMaterialsQuery();

    const [createBn5Production, { isLoading: saving }] =
        useCreateBn5ProductionMutation();

    // ✅ doimiy tariflar
    const electricityPrice = 1000;
    const gasPrice = 1800;

    // ✅ ishchi haqi: 1 kg uchun (default 70)
    const [workersRate, setWorkersRate] = useState(70);

    const [production, setProduction] = useState({
        date: new Date().toISOString().split("T")[0],
        bn3Amount: "15000",
        wasteAmount: "500",
        gasAmount: "800",
        electricity: "500",
        extra: "713545",
        price: "",
    });

    const [showDialog, setShowDialog] = useState(false);
    const [calculatedBn5, setCalculatedBn5] = useState(0);

    const materialObj = useMemo(() => {
        const arr = material?.filteredMaterials || [];
        return arr.reduce((acc, item) => {
            const key = String(item.category || "").replace(/-/g, "").toLowerCase();
            acc[key] = item;
            return acc;
        }, {});
    }, [material]);

    useEffect(() => {
        const bn3 = Number(production.bn3Amount) || 0;
        const waste = Number(production.wasteAmount) || 0;
        const gas = Number(production.gasAmount) || 0;
        const electricity = Number(production.electricity) || 0;
        const extra = Number(production.extra) || 0;

        const bn3Price = Number(materialObj?.bn3?.price) || 0;

        const finalBn5 = bn3 - waste;

        // ✅ ishchi xarajati: har 1kg BN-5 uchun 70 (o‘zgaruvchan)
        const workersCost = finalBn5 > 0 ? finalBn5 * (Number(workersRate) || 0) : 0;

        const totalCost =
            bn3 * bn3Price +
            gas * gasPrice +
            electricity * electricityPrice +
            workersCost +
            extra;

        const unitPrice = finalBn5 > 0 ? Math.ceil(totalCost / finalBn5) : 0;

        setProduction((p) => ({ ...p, price: String(unitPrice) }));
    }, [
        production.bn3Amount,
        production.wasteAmount,
        production.gasAmount,
        production.electricity,
        production.extra,
        materialObj?.bn3?.price,
        workersRate, // ✅ workersRate o‘zgarsa ham qayta hisoblaydi
    ]);

    const validate = () => {
        const bn3 = Number(production.bn3Amount) || 0;
        const stock = Number(materialObj?.bn3?.quantity) || 0;

        if (stock < bn3) {
            toast.error("Omborda yetarli BN-3 yo‘q!");
            return false;
        }
        return true;
    };

    const startProduction = () => {
        if (!validate()) return;

        const bn3 = Number(production.bn3Amount) || 0;
        const waste = Number(production.wasteAmount) || 0;

        setCalculatedBn5(bn3 - waste);
        setShowDialog(true);
    };

    const confirmProduction = async () => {
        try {
            // ⚠️ workersRate backendda kerak bo‘lsa alohida qo‘shamiz,
            // hozircha payloadga qo‘shmayapman (backend reject qilmasin deb)
            const res = await createBn5Production(production).unwrap();

            toast.success(`BN-5 ishlab chiqarildi: ${res.finalBn5 ?? ""} kg`);
            refetch();
            setShowDialog(false);
        } catch {
            toast.error("Saqlashda xatolik");
        }
    };

    if (isLoading || isFetching) return <p>Yuklanmoqda...</p>;

    return (
        <>
            <div className="bitum-production-panel">
                <div className="bitum-panel-header">
                    <Calculator size={24} />
                    <h2>1-BOSQICH: BN-3 → BN-5</h2>
                </div>

                <div className="bitum-input-grid">
                    {/* ✅ ISHCHI HAQI INPUT (1 kg uchun) */}

                    {[
                        { label: "BN-3 miqdori (kg)", key: "bn3Amount" },
                        { label: "Chiqindi (kg)", key: "wasteAmount" },
                        { label: `Elektr energiyasi (kWh) (${electricityPrice} so‘m)`, key: "electricity" },
                        { label: `Gaz (m³) (${gasPrice} so‘m)`, key: "gasAmount" },
                        { label: "Boshqa xarajatlar", key: "extra" },
                        { label: "BN-5 (1kg narx)", key: "price", readOnly: true },
                    ].map(({ label, key, readOnly }) => (
                        <div className="bitum-input-group" key={key}>
                            <label>{label}</label>
                            <input
                                type="number"
                                value={production[key]}
                                readOnly={readOnly}
                                onChange={(e) =>
                                    !readOnly && setProduction((p) => ({ ...p, [key]: e.target.value }))
                                }
                            />
                        </div>
                    ))}
                </div>
                <div style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "10px",
                }}>
                    <div className="bitum-input-group">
                        <label>Ishchi haqi (1 kg uchun, so‘m)</label>
                        <input
                            type="number"
                            value={workersRate}
                            onChange={(e) => setWorkersRate(e.target.value)}
                            placeholder="70"
                        />
                    </div>

                    <button className="bitum-action-button bitum-bn5-action" onClick={startProduction}>
                        <TrendingUp size={20} /> BN-5 Ishlab Chiqarish
                    </button>
                </div>
            </div>

            {showDialog && (
                <div className="bitum-dialog-overlay">
                    <div className="bitum-dialog-box">
                        <h3>BN-5 Natijasi</h3>
                        <p>
                            Hisoblangan BN-5: <b>{calculatedBn5} kg</b>
                        </p>

                        <div className="bitum-dialog-actions">
                            <Button danger type="primary" onClick={() => setShowDialog(false)}>Bekor qilish</Button>
                            <Button type="primary" loading={saving} onClick={confirmProduction}>
                                Tasdiqlash
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Bn3Production;
