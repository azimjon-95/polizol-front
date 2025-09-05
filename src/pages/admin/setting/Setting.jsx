import React, { useState } from 'react';
import { Factory, Clock, Zap, Flame, Settings, Save, List, Plus, Trash2, Edit3, Phone, Percent, MessageSquare } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './style.css';
import {
    useCreateFactoryMutation,
    useGetFactoriesQuery,
    useUpdateFactoryMutation,
    useDeleteFactoryMutation,
} from '../../../context/clinicApi';

const initialFormData = {
    factoryName: '',
    location: '',
    phone: '',
    workingHours: { startTime: '', endTime: '' },
    electricityPrice: '',
    methaneGasPrice: '',
    telegramApiUrl: { botToken: '', chatId: '' },
    nds: '',
};

const FactoryConfigPanel = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
    const navigate = useNavigate();

    // RTK Query hooks
    const { data: factories = [], isLoading, error } = useGetFactoriesQuery();
    const [createFactory, { isLoading: isCreating }] = useCreateFactoryMutation();
    const [updateFactory, { isLoading: isUpdating }] = useUpdateFactoryMutation();
    const [deleteFactory, { isLoading: isDeleting }] = useDeleteFactoryMutation();

    const handleInputChange = (e, field) => {
        const value = e.target.value;
        if (field.includes('.')) {
            const [parent, child, subChild] = field.split('.');
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: subChild ? { ...prev[parent][child], [subChild]: value } : value,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Convert string inputs to numbers where required
            const payload = {
                ...formData,
                electricityPrice: Number(formData.electricityPrice),
                methaneGasPrice: Number(formData.methaneGasPrice),
                nds: Number(formData.nds),
            };

            if (editingId) {
                await updateFactory({ id: editingId, ...payload }).unwrap();
                toast.success('Konfiguratsiya muvaffaqiyatli yangilandi!');
            } else {
                await createFactory(payload).unwrap();
                toast.success('Konfiguratsiya muvaffaqiyatli saqlandi!');
            }
            resetForm();
        } catch (err) {
            toast.error(`Xato yuz berdi: ${err.data.message || 'Server xatosi'}`);
        }
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingId(null);
    };

    const handleEdit = (config) => {
        setFormData({
            ...config,
            electricityPrice: String(config.electricityPrice),
            methaneGasPrice: String(config.methaneGasPrice),
            nds: String(config.nds),
            bitumenMarkFive: {
                costPrice: String(config.bitumenMarkFive.costPrice),
                profitMargin: String(config.bitumenMarkFive.profitMargin),
            },
            ruberoidBlackPaper: {
                costPrice: String(config.ruberoidBlackPaper.costPrice),
                profitMargin: String(config.ruberoidBlackPaper.profitMargin),
            },
        });
        setEditingId(config._id);
        setActiveTab('register');
    };

    const handleDelete = (id) => {
        const toastId = toast(
            <div>
                <p>Haqiqatan ham o'chirmoqchimisiz?</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                        style={{
                            padding: '5px 10px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                        onClick={async () => {
                            try {
                                await deleteFactory(id).unwrap();
                                toast.dismiss(toastId);
                                toast.success('Konfiguratsiya muvaffaqiyatli o\'chirildi!');
                            } catch (err) {
                                toast.dismiss(toastId);
                                toast.error(`O'chirishda xato: ${err.data.message || 'Server xatosi'}`);
                            }
                        }}
                    >
                        O'chirish
                    </button>
                    <button
                        style={{
                            padding: '5px 10px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                        onClick={() => toast.dismiss(toastId)}
                    >
                        Bekor
                    </button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                position: 'top-right',
            }
        );
    };


    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            <div className="qora-qogoz-zavod-konteyner">
                <div className="zavod-sarlavha-blok">
                    <div className="zavod-logo-qism">
                        <Factory className="zavod-ikonka" />
                        <h1 className="zavod-sarlavha-matn">Qora Qog'oz Zavodi Konfiguratsiya</h1>
                    </div>
                    <div className="zavod-tab-tugmalar">
                        <button
                            className={`zavod-tab-tugma ${activeTab === 'register' ? 'zavod-aktiv-tab' : ''}`}
                            onClick={() => setActiveTab('register')}
                        >
                            <Plus className="zavod-tab-ikonka" />
                            Ro'yxatga Olish
                        </button>
                        <button
                            className={`zavod-tab-tugma ${activeTab === 'list' ? 'zavod-aktiv-tab' : ''}`}
                            onClick={() => setActiveTab('list')}
                        >
                            <List className="zavod-tab-ikonka" />
                            Ro'yxat Ko'rish
                        </button>
                        <button
                            className={`zavod-tab-tugma ${activeTab === 'register' ? 'zavod-aktiv-tab' : ''}`}
                            onClick={() => navigate('/catigory')}
                        >
                            <Plus className="zavod-tab-ikonka" />
                            Maxsulotlar turi
                        </button>
                    </div>
                </div>

                {activeTab === 'register' && (
                    <div className="zavod-registr-panel">
                        <form onSubmit={handleSubmit} className="zavod-forma-konteyner">
                            <div className="zavod-forma-grid">
                                {/* Basic Information */}
                                <div className="zavod-karta-blok">
                                    <div className="zavod-karta-sarlavha">
                                        <Settings className="zavod-karta-ikonka" />
                                        <h3>Asosiy Ma'lumotlar</h3>
                                    </div>
                                    <div className="zavod-input-grid">
                                        <div className="zavod-input-guruh">
                                            <label className="zavod-yorliq">Zavod Nomi</label>
                                            <input
                                                type="text"
                                                className="zavod-input-maydoni"
                                                value={formData.factoryName}
                                                onChange={(e) => handleInputChange(e, 'factoryName')}
                                                placeholder="Zavod nomini kiriting"
                                                required
                                            />
                                        </div>
                                        <div className="zavod-input-guruh">
                                            <label className="zavod-yorliq">Joylashuv</label>
                                            <input
                                                type="text"
                                                className="zavod-input-maydoni"
                                                value={formData.location}
                                                onChange={(e) => handleInputChange(e, 'location')}
                                                placeholder="Zavod joylashuvini kiriting"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Working Hours and Contact */}
                                <div className="zavod-karta-container">
                                    <div className="zavod-karta-blok">
                                        <div className="zavod-karta-sarlavha">
                                            <Clock className="zavod-karta-ikonka" />
                                            <h3>Ish Vaqtlari</h3>
                                        </div>
                                        <div className="zavod-vaqt-grid">
                                            <div className="zavod-input-guruh">
                                                <label className="zavod-yorliq">Boshlanish Vaqti</label>
                                                <input
                                                    type="time"
                                                    className="zavod-vaqt-input"
                                                    value={formData.workingHours.startTime}
                                                    onChange={(e) => handleInputChange(e, 'workingHours.startTime')}
                                                    required
                                                />
                                            </div>
                                            <span className="zavod-vaqt-ajratgich">-</span>
                                            <div className="zavod-input-guruh">
                                                <label className="zavod-yorliq">Tugash Vaqti</label>
                                                <input
                                                    type="time"
                                                    className="zavod-vaqt-input"
                                                    value={formData.workingHours.endTime}
                                                    onChange={(e) => handleInputChange(e, 'workingHours.endTime')}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="zavod-karta-blok">
                                        <div className="zavod-karta-sarlavha">
                                            <Phone className="zavod-karta-ikonka" />
                                            <h3>Aloqa uchun</h3>
                                        </div>
                                        <div className="zavod-input-grid">
                                            <div className="zavod-input-guruh">
                                                <label className="zavod-yorliq">Tel</label>
                                                <input
                                                    type="tel"
                                                    className="zavod-input-maydoni"
                                                    value={formData.phone}
                                                    onChange={(e) => handleInputChange(e, 'phone')}
                                                    placeholder="+998901234567"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Energy and Tax Prices */}
                                <div className="zavod-karta-blok">
                                    <div className="zavod-karta-sarlavha">
                                        <Zap className="zavod-karta-ikonka" />
                                        <h3>Energiya va Soliq Narxlari</h3>
                                    </div>
                                    <div className="zavod-input-grid">
                                        <div className="zavod-input-guruh">
                                            <label className="zavod-yorliq">Elektr Energiya (1 kVt/soat)</label>
                                            <div className="zavod-narx-input">
                                                <input
                                                    type="number"
                                                    className="zavod-input-maydoni"
                                                    value={formData.electricityPrice}
                                                    onChange={(e) => handleInputChange(e, 'electricityPrice')}
                                                    placeholder="0"
                                                    required
                                                    min="0"
                                                />
                                                <span className="zavod-valyuta-belgi">so'm</span>
                                            </div>
                                        </div>
                                        <div className="zavod-input-guruh">
                                            <label className="zavod-yorliq">
                                                <Flame className="zavod-inline-ikonka" />
                                                Metan Gaz (1 m³)
                                            </label>
                                            <div className="zavod-narx-input">
                                                <input
                                                    type="number"
                                                    className="zavod-input-maydoni"
                                                    value={formData.methaneGasPrice}
                                                    onChange={(e) => handleInputChange(e, 'methaneGasPrice')}
                                                    placeholder="0"
                                                    required
                                                    min="0"
                                                />
                                                <span className="zavod-valyuta-belgi">so'm</span>
                                            </div>
                                        </div>
                                        <div className="zavod-input-guruh">
                                            <label className="zavod-yorliq">
                                                <Percent className="zavod-inline-ikonka" />
                                                NDS Foizi
                                            </label>
                                            <div className="zavod-narx-input">
                                                <input
                                                    type="number"
                                                    className="zavod-input-maydoni"
                                                    value={formData.nds}
                                                    onChange={(e) => handleInputChange(e, 'nds')}
                                                    placeholder="0"
                                                    required
                                                    min="0"
                                                    max="100"
                                                />
                                                <span className="zavod-valyuta-belgi">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Telegram Integration */}
                                <div className="zavod-karta-blok">
                                    <div className="zavod-karta-sarlavha">
                                        <MessageSquare className="zavod-karta-ikonka" />
                                        <h3>Telegram Integratsiyasi</h3>
                                    </div>
                                    <div className="zavod-input-grid">
                                        <div className="zavod-input-guruh">
                                            <label className="zavod-yorliq">Bot Token</label>
                                            <input
                                                type="text"
                                                className="zavod-input-maydoni"
                                                value={formData.telegramApiUrl?.botToken}
                                                onChange={(e) => handleInputChange(e, 'telegramApiUrl.botToken')}
                                                placeholder="Bot tokenini kiriting"
                                                required
                                            />
                                        </div>
                                        <div className="zavod-input-guruh">
                                            <label className="zavod-yorliq">Chat ID</label>
                                            <input
                                                type="text"
                                                className="zavod-input-maydoni"
                                                value={formData.telegramApiUrl?.chatId}
                                                onChange={(e) => handleInputChange(e, 'telegramApiUrl.chatId')}
                                                placeholder="Chat ID ni kiriting"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="zavod-tugma-konteyner">
                                <button
                                    type="submit"
                                    className="zavod-saqlash-tugma"
                                    disabled={isCreating || isUpdating}
                                >
                                    <Save className="zavod-tugma-ikonka" />
                                    {editingId ? 'Yangilash' : 'Saqlash'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        className="zavod-bekor-tugma"
                                        onClick={resetForm}
                                    >
                                        Bekor Qilish
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'list' && (
                    <div className="zavod-royxat-panel">
                        <div className="zavod-royxat-sarlavha">
                            <h3>Saqlangan Konfiguratsiyalar</h3>
                            <span className="zavod-royxat-soni">{factories?.innerData?.length} ta konfiguratsiya</span>
                        </div>

                        {isLoading ? (
                            <p>Yuklanmoqda...</p>
                        ) : factories?.innerData?.length === 0 ? (
                            <div className="zavod-bosh-holat">
                                <Factory className="zavod-bosh-ikonka" />
                                <p>Hali hech qanday konfiguratsiya yo'q</p>
                            </div>
                        ) : (
                            <div className="zavod-jadval-konteyner">
                                <table className="zavod-jadval">
                                    <thead>
                                        <tr>
                                            <th>Zavod Nomi</th>
                                            <th>Joylashuv</th>
                                            <th>Ish Vaqti</th>
                                            <th>Tel</th>
                                            <th>Elektr Narxi</th>
                                            <th>Gaz Narxi</th>
                                            <th>NDS</th>
                                            <th>Telegram Bot</th>
                                            <th>Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {factories?.innerData?.map((config) => (
                                            <tr key={config._id}>
                                                <td>
                                                    <span className="zavod-nomi-ustun">
                                                        <Factory className="zavod-jadval-ikonka" />
                                                        {config.factoryName}
                                                    </span>
                                                </td>
                                                <td>{config.location}</td>
                                                <td>{`${config.workingHours.startTime} - ${config.workingHours.endTime}`}</td>
                                                <td>{config.phone || '-'}</td>
                                                <td>
                                                    <span className="zavod-nomi-ustun">
                                                        <Zap className="zavod-jadval-ikonka" />
                                                        {config.electricityPrice} so'm
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="zavod-nomi-ustun">
                                                        <Flame className="zavod-jadval-ikonka" />
                                                        {config.methaneGasPrice} so'm
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="zavod-nomi-ustun">
                                                        <Percent className="zavod-jadval-ikonka" />
                                                        {config.nds}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="zavod-nomi-ustun">
                                                        <MessageSquare className="zavod-jadval-ikonka" />
                                                        {config.telegramApiUrl?.chatId}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="zavod-nomi-ustun">
                                                        <button
                                                            className="zavod-tahrir-tugma"
                                                            onClick={() => handleEdit(config)}
                                                            title="Tahrirlash"
                                                            disabled={isDeleting}
                                                        >
                                                            <Edit3 className="zavod-amal-ikonka" />
                                                        </button>
                                                        <button
                                                            className="zavod-ochir-tugma"
                                                            onClick={() => handleDelete(config._id)}
                                                            title="O'chirish"
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="zavod-amal-ikonka" />
                                                        </button>
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default FactoryConfigPanel;