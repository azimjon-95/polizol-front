// Bn3ToBn5Production.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calculator, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { Button } from 'antd';
import { toast } from 'react-toastify';
import {
    useGetFilteredMaterialsQuery,
} from '../../../context/materialApi';
import {
    useStartBn5BoilingMutation,
    useFinishBn5BoilingMutation,
    useGetActiveBoilingProcessQuery,
} from '../../../context/productionApi';
import './css/bn5pros.css';

const Bn3ToBn5Production = () => {
    /* ================= API HOOKS ================= */
    const { data: material } = useGetFilteredMaterialsQuery();
    const { data: activeProcess } = useGetActiveBoilingProcessQuery(undefined, {
        pollingInterval: 10000,
        refetchOnMountOrArgChange: true,
    });
    const [startBoiling, { isLoading: starting }] = useStartBn5BoilingMutation();
    const [finishBoiling, { isLoading: finishing }] = useFinishBn5BoilingMutation();

    /* ================= JARAYON HOLATI ================= */
    const stage = activeProcess?.message === "Hozirda faol qaynatish jarayoni yo‘q"
        ? 'input'
        : 'boiling';

    /* ================= INPUT MA'LUMOTLARI (useRef) ================= */
    const inputData = useRef({
        date: new Date().toISOString().split('T')[0],
        bn3Amount: '15000',
        wasteAmount: '500',
        gasAmount: '800',
        electricity: '500',
        extra: '713545',
        price: '',
    });

    /* ================= TIMER ================= */
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!activeProcess?.innerData?.boilingStartTime) {
            setElapsedSeconds(0);
            return;
        }

        const interval = setInterval(() => {
            const diff = Math.floor(
                (Date.now() - new Date(activeProcess.innerData.boilingStartTime)) / 1000
            );
            setElapsedSeconds(diff);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeProcess?.innerData?.boilingStartTime]);

    const formatElapsed = (sec) => {
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    /* ================= MATERIAL OBJECT ================= */
    const materialObj = useMemo(() => {
        return (
            material?.filteredMaterials?.reduce((acc, item) => {
                acc[item.category.replace(/-/g, '').toLowerCase()] = item;
                return acc;
            }, {}) || {}
        );
    }, [material]);

    /* ================= NARX HISOBLASH ================= */
    const electricityPrice = 1000; // so‘m/kWh
    const gasPrice = 1800;        // so‘m/m³
    const workersSalary = 750000; // so‘m

    useEffect(() => {
        const bn3 = +inputData.current.bn3Amount || 0;
        const waste = +inputData.current.wasteAmount || 0;
        const gas = +inputData.current.gasAmount || 0;
        const elec = +inputData.current.electricity || 0;
        const extra = +inputData.current.extra || 0;
        const bn3Price = materialObj?.bn3?.price || 0;

        const finalBn5 = bn3 - waste;

        if (finalBn5 <= 0) {
            inputData.current.price = '0';
            return;
        }

        const totalCost =
            bn3 * bn3Price +
            gas * gasPrice +
            elec * electricityPrice +
            workersSalary +
            extra;

        inputData.current.price = Math.ceil(totalCost / finalBn5).toString();
    }, [
        materialObj?.bn3?.price,
        inputData.current.bn3Amount,
        inputData.current.wasteAmount,
        inputData.current.gasAmount,
        inputData.current.electricity,
        inputData.current.extra,
    ]);

    /* ================= HISOBLANGAN BN-5 MIQDORI ================= */
    const calculatedBn5 = useMemo(() => {
        return (+inputData.current.bn3Amount || 0) - (+inputData.current.wasteAmount || 0);
    }, [inputData.current.bn3Amount, inputData.current.wasteAmount]);

    /* ================= QAYNATISHNI BOSHLASH ================= */
    const handleStartBoiling = async () => {
        const bn3Amt = +inputData.current.bn3Amount || 0;

        if ((materialObj?.bn3?.quantity || 0) < bn3Amt) {
            toast.error("Omborda yetarli BN-3 yo‘q");
            return;
        }

        try {
            const payload = {
                date: inputData.current.date,
                bn3Amount: bn3Amt,
                wasteAmount: +inputData.current.wasteAmount || 0,
                gasAmount: +inputData.current.gasAmount || 0,
                electricity: +inputData.current.electricity || 0,
                extra: +inputData.current.extra || 0,
                price: +inputData.current.price || 0,
                notes: '',
            };

            await startBoiling(payload).unwrap();
            toast.success('Material qozonga tashlandi. Qaynatish boshlandi!');
        } catch (e) {
            toast.error(e?.data?.message || 'Xatolik');
        }
    };

    /* ================= YAKUNLASH MODALI ================= */
    const [showModal, setShowModal] = useState(false);
    const [actualBn5Total, setActualBn5Total] = useState('');
    const [forSale, setForSale] = useState('');
    const [forMel, setForMel] = useState('');

    const closeModal = () => {
        setShowModal(false);
        setActualBn5Total('');
        setForSale('');
        setForMel('');
    };

    const openFinishModal = () => {
        setActualBn5Total(calculatedBn5.toString());
        setShowModal(true);
    };

    const handleFinish = async () => {
        const totalActual = +actualBn5Total || 0;
        const sale = +forSale || 0;
        const mel = +forMel || 0;

        if (totalActual <= 0) {
            toast.error('Haqiqiy miqdor noto‘g‘ri');
            return;
        }
        if (sale + mel > totalActual) {
            toast.error('Sotish + MEL oshib ketdi');
            return;
        }

        try {
            await finishBoiling({
                inventoryId: activeProcess._id,
                finalBn5Amount: totalActual,
                forSale: sale,
                forMel: mel,
            }).unwrap();

            toast.success('BN-5 muvaffaqiyatli yakunlandi');
            closeModal();
        } catch (e) {
            toast.error(e?.data?.message || 'Xatolik');
        }
    };

    /* ================= RENDER ================= */
    const disabled = stage === 'boiling';

    return (
        <>
            <div className="bitum-production-panel">
                <div className="bitum-panel-header">
                    <Calculator size={24} />
                    <h2>BN-3 → BN-5</h2>
                </div>

                {stage === 'boiling' && (
                    <div className="boiling-status">
                        <Clock size={18} />
                        <strong>{formatElapsed(elapsedSeconds)}</strong>
                    </div>
                )}

                <div className="bitum-input-grid">
                    {[
                        { key: 'bn3Amount', label: 'BN-3 miqdori (kg)' },
                        { key: 'wasteAmount', label: 'Chiqindi (kg)' },
                        { key: 'electricity', label: <>Elektr energiyasi (kWh) <span className="price-info">(1000 so‘m/kWh)</span></> },
                        { key: 'gasAmount', label: <>Gaz (m³) <span className="price-info">(1800 so‘m/m³)</span></> },
                        { key: 'extra', label: 'Boshqa xarajatlar (so‘m)' },
                        { key: 'price', label: 'BN-5 narxi (1 kg, so‘m)', readOnly: true },
                    ].map(({ key, label, readOnly }) => (
                        <div className="bitum-input-group" key={key}>
                            <label className="bitum-label">
                                {label}
                                {readOnly && <span className="readonly-hint"> (avtomatik hisoblanadi)</span>}
                            </label>
                            <input
                                type="number"
                                className="bitum-input"
                                disabled={disabled || readOnly}
                                value={inputData.current[key] || ''}
                                onChange={(e) => !disabled && !readOnly && (inputData.current[key] = e.target.value)}
                                placeholder={readOnly ? 'Hisoblanmoqda...' : ''}
                            />
                        </div>
                    ))}
                </div>

                {stage === 'input' && (
                    <button
                        className="bitum-action-button"
                        onClick={handleStartBoiling}
                        disabled={starting}
                    >
                        <TrendingUp size={18} /> Qozonga tashlash
                    </button>
                )}

                {stage === 'boiling' && (
                    <button
                        className="bitum-action-button bitum-take-out"
                        onClick={openFinishModal}
                    >
                        <Loader2 size={18} /> Qozondan olish
                    </button>
                )}
            </div>

            {/* Yakunlash modali */}
            {showModal && (
                <div className="bitum-dialog-overlay">
                    <div className="bitum-dialog-box">
                        <h3>BN-5 Qozondan Chiqarish</h3>
                        <p>
                            Hisoblangan BN-5 miqdori: <strong>{calculatedBn5.toLocaleString()} kg</strong>
                        </p>

                        <div className="bitum-dialog-input">
                            <label>Haqiqiy BN-5 miqdori (kg)</label>
                            <input
                                type="number"
                                value={actualBn5Total}
                                onChange={(e) => setActualBn5Total(e.target.value)}
                                placeholder={calculatedBn5.toString()}
                            />
                        </div>

                        <div className="split-inputs">
                            <div className="bitum-dialog-input">
                                <label>Sotish uchun (kg)</label>
                                <input
                                    type="number"
                                    value={forSale}
                                    onChange={(e) => setForSale(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="bitum-dialog-input">
                                <label>MEL qo‘shish uchun (kg)</label>
                                <input
                                    type="number"
                                    value={forMel}
                                    onChange={(e) => setForMel(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="bitum-dialog-actions">
                            <button className="bitum-cancel-button" onClick={closeModal}>
                                Bekor qilish
                            </button>
                            <Button
                                type="primary"
                                loading={finishing}
                                onClick={handleFinish}
                            >
                                Tasdiqlash
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Bn3ToBn5Production;