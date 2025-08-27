// DebtComponent.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './style/debts.css';
import {
    useCreateDebtMutation,
    useRepayDebtMutation,
    useGetActiveDebtsQuery
} from '../../../context/debtsApi';
import { NumberFormat } from '../../../hook/NumberFormat';

const DebtComponent = () => {
    const [activeTab, setActiveTab] = useState('create');
    const [copiedId, setCopiedId] = useState(null);
    const [formattedAmount, setFormattedAmount] = useState('');
    const [debtData, setDebtData] = useState({
        type: 'lend',
        counterparty: '',
        amount: 0,
        paymentMethod: 'naqt',
        description: '',
        dueDate: '',
    });
    const [repayData, setRepayData] = useState({
        debtId: '',
        amount: 0,
        paymentMethod: 'naqt',
        note: '',
    });

    // Faol qarzlar va tarixni olish uchun so‘rovlar
    const { data: activeDebts, isLoading: isLoadingActive } = useGetActiveDebtsQuery({ type: undefined, status: 'active' });
    const [createDebt, { isLoading: isCreating }] = useCreateDebtMutation();
    const [repayDebt, { isLoading: isRepaying }] = useRepayDebtMutation();

    // Yangi qarz yaratish
    const handleCreateDebt = async () => {
        try {
            await createDebt(debtData).unwrap();
            toast.success('Qarz muvaffaqiyatli yaratildi');
            setDebtData({
                type: 'lend',
                counterparty: '',
                amount: 0,
                paymentMethod: 'naqt',
                description: '',
                dueDate: '',
            });
        } catch (error) {
            toast.error(`Xato: ${error.data?.error || 'Qarz yaratishda xatolik yuz berdi'}`);
        }
    };

    // Qarzni to‘lash
    const handleRepayDebt = async () => {
        try {
            await repayDebt(repayData).unwrap();

            toast.success('Qarz muvaffaqiyatli to‘landi');
            setRepayData({
                debtId: '',
                amount: 0,
                paymentMethod: 'naqt',
                note: '',
            });
        } catch (error) {
            toast.error(`Xato: ${error.data?.message || 'Qarz to‘lashda xatolik yuz berdi'}`);
        }
    };

    // ID nusxalash
    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id)
            .then(() => {
                setCopiedId(id);
                toast.success('ID nusxalandi!');
                setTimeout(() => setCopiedId(null), 600);
            })
            .catch(() => {
                toast.error('Nusxalashda xatolik yuz berdi');
            });
    };

    // Yuklanmoqda holati
    if (isLoadingActive) {
        return <div className="hgj-loader">Ma'lumotlar yuklanmoqda...</div>;
    }

    const debtTypes = {
        lend: '🤝 Qarz berildi',
        borrow: '📋 Qarz olindi',
    };


    // Raqamni formatlash (1.000.000)
    const formatNumber = (value) => {
        if (!value) return '';
        const cleanValue = value.toString().replace(/\D/g, ''); // Faqat raqamlarni olish
        return Number(cleanValue).toLocaleString('uz-UZ'); // O'zbek formatiga o'tkazish
    };

    // Input o'zgarishi
    const handleChange = (e) => {
        const inputValue = e.target.value.replace(/\D/g, ''); // Faqat raqamlarni olish
        setRepayData({ ...repayData, amount: inputValue ? Number(inputValue) : '' });
        setFormattedAmount(formatNumber(inputValue));
    };


    return (
        <div className="hgj-container">
            <div className="hgj-tab-navigation">
                <button
                    className={`hgj-tab ${activeTab === 'create' ? 'hgj-tab-active' : ''}`}
                    onClick={() => setActiveTab('create')}
                >
                    Qarz yaratish
                </button>
                <button
                    className={`hgj-tab ${activeTab === 'repay' ? 'hgj-tab-active' : ''}`}
                    onClick={() => setActiveTab('repay')}
                >
                    Qarz to‘lash
                </button>
                <button
                    className={`hgj-tab ${activeTab === 'list' ? 'hgj-tab-active' : ''}`}
                    onClick={() => setActiveTab('list')}
                >
                    Faol qarzlar
                </button>

            </div>

            <div className="hgj-content">
                {activeTab === 'create' && (
                    <div className="hgj-form-section">
                        <div className="hgj-form-header">
                            <h2 className="hgj-section-title">Yangi qarz yaratish</h2>
                            <p className="hgj-section-desc">Yangi qarz berish yoki olish yozuvini qo‘shing</p>
                        </div>

                        <div className="hgj-form-grid">
                            <div className="hgj-form-group">
                                <label className="hgj-label">Qarz turi</label>
                                <div className="hgj-radio-group">
                                    <label className="hgj-radio-item">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="lend"
                                            checked={debtData.type === 'lend'}
                                            onChange={(e) => setDebtData({ ...debtData, type: e.target.value })}
                                        />
                                        <span className="hgj-radio-custom"></span>
                                        <span className="hgj-radio-label">🤝 Qarz berish</span>
                                    </label>
                                    <label className="hgj-radio-item">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="borrow"
                                            checked={debtData.type === 'borrow'}
                                            onChange={(e) => setDebtData({ ...debtData, type: e.target.value })}
                                        />
                                        <span className="hgj-radio-custom"></span>
                                        <span className="hgj-radio-label">📋 Qarz olish</span>
                                    </label>
                                </div>
                            </div>

                            <div className="hgj-form-group">
                                <label className="hgj-label">Qarzdor/beruvchi</label>
                                <input
                                    className="hgj-input"
                                    type="text"
                                    placeholder="Shaxs/kompaniya nomini kiriting"
                                    value={debtData.counterparty}
                                    onChange={(e) => setDebtData({ ...debtData, counterparty: e.target.value })}
                                />
                            </div>

                            <div className="hgj-form-group">
                                <label className="hgj-label">Miqdor</label>
                                <input
                                    className="hgj-input"
                                    type="number"
                                    placeholder="0.00"
                                    value={debtData.amount}
                                    onChange={(e) => setDebtData({ ...debtData, amount: Number(e.target.value) })}
                                />
                            </div>

                            <div className="hgj-form-box">
                                <div className="hgj-form-group">
                                    <label className="hgj-label">To‘lov usuli</label>
                                    <select
                                        className="hgj-select"
                                        value={debtData.paymentMethod}
                                        onChange={(e) => setDebtData({ ...debtData, paymentMethod: e.target.value })}
                                    >
                                        <option value="naqt">💵 Naqd pul</option>
                                        <option value="bank">🏦 Bank o‘tkazmasi</option>
                                    </select>
                                </div>
                                <div className="hgj-form-group">
                                    <label className="hgj-label">Muddat</label>
                                    <input
                                        className="hgj-input"
                                        type="date"
                                        value={debtData.dueDate}
                                        onChange={(e) => setDebtData({ ...debtData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="hgj-form-group hgj-form-group-full">
                                <label className="hgj-label">Tavsif</label>
                                <textarea
                                    className="hgj-textarea"
                                    placeholder="Ixtiyoriy tavsif yoki eslatmalar"
                                    value={debtData.description}
                                    onChange={(e) => setDebtData({ ...debtData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>
                        </div>

                        <button
                            className="hgj-button hgj-button-primary"
                            onClick={handleCreateDebt}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <span className="hgj-spinner"></span>
                                    Yaratilmoqda...
                                </>
                            ) : (
                                <>
                                    <span className="hgj-button-icon">✅</span>
                                    Qarz yozuvini yaratish
                                </>
                            )}
                        </button>
                    </div>
                )}

                {activeTab === 'repay' && (
                    <div className="hgj-form-section">
                        <div className="hgj-form-header">
                            <h2 className="hgj-section-title">Qarzni to‘lash</h2>
                            <p className="hgj-section-desc">Mavjud qarz uchun to‘lovni amalga oshiring</p>
                        </div>

                        <div className="hgj-form-grid">
                            <div className="hgj-form-group">
                                <label className="hgj-label">Qarz ID</label>
                                <input
                                    className="hgj-input"
                                    type="text"
                                    placeholder="Qarz ID sini kiriting"
                                    value={repayData.debtId}
                                    onChange={(e) => setRepayData({ ...repayData, debtId: e.target.value })}
                                />
                            </div>

                            <div className="hgj-form-group">
                                <label className="hgj-label">To‘lov miqdori</label>
                                <input
                                    className="hgj-input"
                                    type="text"
                                    placeholder="0.00"
                                    value={formattedAmount}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="hgj-form-group">
                                <label className="hgj-label">To‘lov usuli</label>
                                <select
                                    className="hgj-select"
                                    value={repayData.paymentMethod}
                                    onChange={(e) => setRepayData({ ...repayData, paymentMethod: e.target.value })}
                                >
                                    <option value="naqt">💵 Naqd pul</option>
                                    <option value="bank">🏦 Bank o‘tkazmasi</option>
                                </select>
                            </div>

                            <div className="hgj-form-group hgj-form-group-full">
                                <label className="hgj-label">Izoh</label>
                                <textarea
                                    className="hgj-textarea"
                                    placeholder="To‘lov uchun izoh (ixtiyoriy)"
                                    value={repayData.note}
                                    onChange={(e) => setRepayData({ ...repayData, note: e.target.value })}
                                    rows="3"
                                />
                            </div>
                        </div>

                        <button
                            className="hgj-button hgj-button-success"
                            onClick={handleRepayDebt}
                            disabled={isRepaying}
                        >
                            {isRepaying ? (
                                <>
                                    <span className="hgj-spinner"></span>
                                    To‘lanmoqda...
                                </>
                            ) : (
                                <>
                                    <span className="hgj-button-icon">💳</span>
                                    To‘lovni amalga oshirish
                                </>
                            )}
                        </button>
                    </div>
                )}

                {activeTab === 'list' && (
                    <div className="hgj-debt-list">
                        <div className="hgj-form-header">
                            <div className="hgj-debt-summary">

                                <div className="hgj-summary-grid">
                                    {(() => {
                                        const debtSummary = activeDebts?.innerData?.reduce(
                                            (acc, debt) => {
                                                const type = debt.type || 'null';
                                                acc[type] = (acc[type] || 0) + debt.remainingAmount;
                                                return acc;
                                            },
                                            { lend: 0, borrow: 0 }
                                        ) || { lend: 0, borrow: 0 };

                                        return Object.entries(debtSummary).map(([type, amount]) => (
                                            <div key={type} className={`hgj-summary-card ${type === 'lend' ? 'hgj-summary-lend' : 'hgj-summary-borrow'}`}  >
                                                <span className="hgj-summary-type">
                                                    {debtTypes[type]}
                                                </span>
                                                <p className="hgj-summary-amount">{NumberFormat(amount)}</p>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>

                        {activeDebts?.innerData?.length > 0 ? (
                            <div className="hgj-debt-grid">
                                {activeDebts.innerData.map((debt) => (
                                    <div
                                        key={debt._id}
                                        className={`hgj-debt-card ${debt.type === 'lend' ? 'hgj-debt-lend' : 'hgj-debt-borrow'}`}
                                    >
                                        <div className="hgj-debt-header">
                                            <span className="hgj-debt-type">
                                                {debtTypes[debt.type]}
                                            </span>
                                            <span className="hgj-debt-method">
                                                {debt.paymentMethod === 'naqt' ? '💵' : debt.paymentMethod === 'bank' ? '🏦 Bank' : ' '}
                                            </span>
                                        </div>
                                        <div className="hgj-debt-info">
                                            <div className="hgj-debt-cont">
                                                <h3 className="hgj-debt-counterparty">{debt.counterparty}</h3>
                                                <p className="hgj-debt-amount">{NumberFormat(debt.remainingAmount)} so‘m</p>
                                            </div>
                                            <div
                                                className={`hgj-debt-id-container ${copiedId === debt._id ? 'copied' : ''}`}
                                                onClick={() => handleCopyId(debt._id)}
                                            >
                                                <p className="hgj-debt-id">ID: {debt._id}</p>
                                                <button className="hgj-copy-button" title="ID ni nusxalash">
                                                    📋
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="hgj-empty-state">
                                <div className="hgj-empty-icon">📝</div>
                                <h3>Faol qarzlar yo‘q</h3>
                                <p>Sizda hali faol qarz yozuvlari yo‘q.</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default DebtComponent;


