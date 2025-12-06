import React, { useState, useRef, useMemo, useCallback } from "react";
import { Modal, Form, Typography, Divider, Input, Select, Button, Row, Col } from 'antd';
import { LuPackagePlus, LuTruck } from 'react-icons/lu';
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { toast } from 'react-toastify';
import { useGetFactoriesQuery } from "../../context/clinicApi";
import { useGetOkisleniyaWorkersQuery } from "../../context/workersApi";
import { useGetFirmsQuery, useCreateIncomeMutation } from "../../context/materialApi";
import { useGetTransportQuery } from '../../context/cartSaleApi';
import './style/incom.css'

const { Option } = Select;
const { Text } = Typography;

const numberFormat = (value) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value).replace(/,/g, ' ');
};

const FormattedInput = ({ value, onChange, max, min, ...props }) => {
    const [displayValue, setDisplayValue] = useState(value ? numberFormat(value) : '');

    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/[^0-9.]/g, '');
        const parsedValue = parseFloat(rawValue) || 0;
        if ((max !== undefined && parsedValue > max) || (min !== undefined && parsedValue < min)) {
            return;
        }
        setDisplayValue(rawValue ? numberFormat(parsedValue) : '');
        onChange(parsedValue);
    };

    const handleBlur = () => {
        setDisplayValue(value ? numberFormat(value) : '');
    };

    return <Input value={displayValue} onChange={handleChange} onBlur={handleBlur} {...props} />;
};

const EditMaterialModal = ({ refetch, setIsIncomeModalOpen, isIncomeModalOpen }) => {
    const [createIncome, { isLoading: createIncomeLoading }] = useCreateIncomeMutation();
    const { data: factories } = useGetFactoriesQuery();
    const { data: firms, refetch: isRefetch, isLoading: firmsLoading } = useGetFirmsQuery();
    const firmsData = firms?.innerData || [];
    const [incomeForm] = Form.useForm();
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentType, setPaymentType] = useState("naqt");
    const [vatPercentage, setVatPercentage] = useState(factories?.innerData?.[0]?.nds || 12);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [transportCost, setTransportCost] = useState(0);
    const { data: getOkisleniyaWorkers } = useGetOkisleniyaWorkersQuery();
    const workersData = getOkisleniyaWorkers?.innerData?.employees || [];
    const [firmLabel, setFirmLabel] = useState("Firmani tanlang");
    const inputRef = useRef(null);
    const [isTransportDropdownOpen, setIsTransportDropdownOpen] = useState(false);
    const formatNumber = (num) => (num || num === 0 ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '');
    const { data: transport = { innerData: [] } } = useGetTransportQuery();
    const dropdownRef = useRef(null);
    const [customerTransport, setCustomerTransport] = useState("");

    const toggleTransportDropdown = useCallback(() => {
        setIsTransportDropdownOpen((prev) => !prev);
    }, []);
    const formattedTransportCost = useMemo(() => formatNumber(transportCost), [transportCost]);


    const handleTransportCostChange = useCallback((e) => {
        const raw = e.target.value.replace(/\D/g, '');
        const numberValue = Number(raw) || 0;
        setTransportCost(numberValue);
    }, []);

    const handleAddMaterialToIncome = () => {
        setSelectedMaterials([
            ...selectedMaterials,
            {
                id: Date.now(),
                name: "",
                quantity: 0,
                price: 0,
                currency: "sum",
                category: "Boshqalar",
                unit: "kilo",
            },
        ]);
    };

    const handleRemoveMaterialFromIncome = (id) => {
        setSelectedMaterials(selectedMaterials.filter((m) => m.id !== id));
    };

    const handleMaterialChange = (id, field, value) => {
        setSelectedMaterials(
            selectedMaterials.map((m) => (m.id === id ? { ...m, [field]: value } : m))
        );
    };

    const handleWorkerChange = (workerIds) => {
        setSelectedWorkers(workerIds);
    };

    const handleFormValuesChange = (changedValues) => {
        if (changedValues.firmId) {
            const selectedFirm = firmsData.find((firm) => firm._id === changedValues.firmId);
            setFirmLabel(
                selectedFirm
                    ? `${selectedFirm.name} | ${numberFormat(Math.abs(Math.round(selectedFirm.debt)))} | ${selectedFirm.debt < 0 ? "Haqdorlik" : "Qarzdorlik"}`
                    : "Firmani tanlang"
            );
        }
    };


    const calculateWorkerPayments = () => {
        const bn3Material = selectedMaterials.find((m) => m.category === "BN-3" && m.unit === "kilo");
        if (!bn3Material || selectedWorkers.length === 0) return [];
        const totalPayment = Number(bn3Material.quantity) * 25;
        const paymentPerWorker = totalPayment / selectedWorkers.length;
        return selectedWorkers.map((workerId) => {
            const worker = workersData.find((w) => w._id === workerId);
            return {
                workerId,
                name: worker ? `${worker.firstName} ${worker.lastName}` : "Unknown",
                payment: paymentPerWorker,
            };
        });
    };

    const calculateMaterialCosts = () => {
        const workerPayments = calculateWorkerPayments();
        const totalWorkerPayment = workerPayments.reduce((sum, wp) => sum + wp.payment, 0);
        const totalMaterialValue = selectedMaterials.reduce(
            (sum, material) => sum + Number(material.quantity) * Number(material.price),
            0
        );

        return selectedMaterials.map((material) => {
            const materialValue = Number(material.quantity) * Number(material.price);
            const transportShare = totalMaterialValue > 0 ? (materialValue / totalMaterialValue) * transportCost : 0;
            const transportCostPerUnit = Number(material.quantity) > 0 ? transportShare / Number(material.quantity) : 0;
            const workerCostPerUnit = (material.category === "BN-3" && material.unit === "kilo" && totalWorkerPayment > 0)
                ? totalWorkerPayment / Number(material.quantity)
                : 0;
            return { ...material, transportCostPerUnit, workerCostPerUnit };
        });
    };

    const calculateMaterialFinancials = (material) => {
        const materialBasePrice = Number(material.quantity) * Number(material.price);
        const materialVatAmount = paymentType === "bank"
            ? (materialBasePrice * Number(vatPercentage)) / (100 + Number(vatPercentage))
            : 0;
        const materialTotalWithoutVat = materialBasePrice - materialVatAmount;
        const materialQuantity = Number(material.quantity);
        const materialPricePerUnitWithoutVat = materialQuantity > 0 ? materialTotalWithoutVat / materialQuantity : 0;
        const materialVatPerUnit = materialQuantity > 0 ? materialVatAmount / materialQuantity : 0;
        const totalPricePerUnit = Number(material.price) + Number(material.transportCostPerUnit) + Number(material.workerCostPerUnit);

        return {
            materialBasePrice,
            materialVatAmount,
            materialTotalWithoutVat,
            materialPricePerUnitWithoutVat,
            materialVatPerUnit,
            totalPricePerUnit,
        };
    };

    const handleIncomeSubmit = async () => {
        try {
            const values = await incomeForm.validateFields();

            if (selectedMaterials.length === 0) {
                toast.error("Hech bo'lmaganda bitta material qo'shing");
                return;
            }

            for (const material of selectedMaterials) {
                if (!material.name || !material.quantity || !material.price || !material.unit || !material.category) {
                    toast.error("Barcha materiallar to'liq to'ldirilishi kerak");
                    return;
                }
            }

            const bn3Material = selectedMaterials.find((m) => m.category === "BN-3" && m.unit === "kilo");
            if (bn3Material && selectedWorkers.length === 0) {
                toast.error("BN-3 materiallari uchun kamida bitta ishchi tanlang");
                return;
            }

            const selectedFirm = firmsData.find((firm) => firm._id === values.firmId);
            if (!selectedFirm) {
                toast.error("Firma topilmadi");
                return;
            }

            const materialsWithCosts = calculateMaterialCosts();
            const baseTotal = materialsWithCosts.reduce(
                (sum, material) => sum + Number(material.quantity) * Number(material.price),
                0
            );

            const vatAmount = paymentType === "bank" ? (baseTotal * Number(vatPercentage)) / (100 + Number(vatPercentage)) : 0;
            const totalWithoutVat = baseTotal - vatAmount;
            const workerPayments = calculateWorkerPayments();

            const incomeData = {
                firm: {
                    name: selectedFirm.name,
                    phone: selectedFirm.phone,
                    address: selectedFirm.address,
                    _id: selectedFirm._id
                },
                materials: materialsWithCosts.map((material) => ({
                    name: material.name,
                    quantity: Number(material.quantity),
                    price: Number(material.price) + Number(material.transportCostPerUnit) + Number(material.workerCostPerUnit),
                    currency: "sum",
                    unit: material.unit,
                    category: material.category,
                    transportCostPerUnit: Number(material.transportCostPerUnit),
                    workerCostPerUnit: Number(material.workerCostPerUnit),
                })),
                price: Number(paidAmount) || 0,
                paymentType: paymentType || "naqt",
                vatPercentage: paymentType === "bank" ? Number(vatPercentage) : 0,
                totalWithVat: Number(baseTotal),
                totalWithoutVat: Number(totalWithoutVat),
                vatAmount: Number(vatAmount),
                totalTransportCost: Number(transportCost),
                customerTransport: customerTransport || "",
                totalWorkerCost: workerPayments.reduce((sum, wp) => sum + wp.payment, 0),
                workerPayments: workerPayments.map((wp) => ({
                    workerId: wp.workerId,
                    payment: wp.payment,
                })),
            };

            await createIncome(incomeData).unwrap();
            refetch();
            isRefetch();
            toast.success("Kirim muvaffaqiyatli qo'shildi");
            setIsIncomeModalOpen(false);
            setCustomerTransport("");
            setSelectedMaterials([]);
            setSelectedWorkers([]);
            setPaidAmount(0);
            setTransportCost(0);
            setPaymentType("naqt");
            setVatPercentage(factories?.innerData?.[0]?.nds || 12);
            incomeForm.resetFields();
        } catch (error) {
            toast.error(error?.data?.message || "Kirim qo'shishda xatolik yuz berdi");
        }
    };

    const materialsWithCosts = calculateMaterialCosts();
    const hasBn3Material = selectedMaterials.some((m) => m.category === "BN-3" && m.unit === "kilo");
    const workerPayments = calculateWorkerPayments();

    const handleTransportSelect = useCallback((transport) => {
        setCustomerTransport(transport);
        setIsTransportDropdownOpen(false);
    }, []);

    return (
        <Modal
            title={<Text style={{ color: "#000000", textAlign: "center", fontSize: "18px" }}>Yangi Material Keldi</Text>}
            open={isIncomeModalOpen}
            onCancel={() => {
                setIsIncomeModalOpen(false);
                setSelectedMaterials([]);
                setSelectedWorkers([]);
                setPaidAmount(0);
                setTransportCost(0);
                setPaymentType("naqt");
                setVatPercentage(factories?.innerData?.[0]?.nds || 12);
                incomeForm.resetFields();
            }}
            footer={null}
            className="warehouse-modal"
            width={transportCost > 0 || hasBn3Material ? 1150 : 900}
        >
            <div
                className="warehouse-modal_left"
                style={{ gap: (transportCost > 0 || hasBn3Material) ? "20px" : "0px" }}
            >
                <div className="warehouse-modal_right">
                    <Form
                        form={incomeForm}
                        layout="vertical"
                        onFinish={handleIncomeSubmit}
                        onValuesChange={handleFormValuesChange}
                        className="warehouse-add-form"
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={12}>
                                <Form.Item
                                    label={firmLabel}
                                    name="firmId"
                                    rules={[{ required: true, message: "Firmani tanlash shart" }]}
                                    className="warehouse-form-item"
                                >
                                    <Select
                                        placeholder="Firmani tanlang"
                                        className="warehouse-select"
                                        loading={firmsLoading}
                                    >
                                        {firmsData.map((firm) => (
                                            <Option key={firm._id} value={firm._id}>
                                                {firm.name} | {firm.phone}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={12}>
                                <div className="mjl-invoice-delivery-box">
                                    <div className="mjl-card-summary-row">
                                        <span style={{ marginBottom: "8px" }}>
                                            <LuTruck style={{ marginRight: 8 }} />
                                            Transportni tanlang
                                        </span>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={customerTransport}
                                            // customerTransport, setCustomerTransport
                                            onChange={(e) => setCustomerTransport(e.target.value)}
                                            onClick={toggleTransportDropdown}
                                            className="mjl-card-price-input"
                                            style={{ width: '100%', height: "40px", border: '1px solid #d9d9d9' }}
                                            aria-label="Transport details"
                                            placeholder="50ZZ500Z Fura..."
                                        />
                                        {isTransportDropdownOpen && (
                                            <div ref={dropdownRef} className="mjl-isTransportDropdownOpen">
                                                {transport.innerData.map((item, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleTransportSelect(item.transport)}
                                                        className="mjl-card-transport-option"
                                                    >
                                                        {item.transport}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mjl-card-summary-row">
                                        <span style={{ marginBottom: "8px" }}>
                                            <LuTruck style={{ marginRight: 8 }} />Transport harajati: (so'm)</span>
                                        <span>
                                            <input
                                                type="text"
                                                value={formattedTransportCost}
                                                onChange={handleTransportCostChange}
                                                className="mjl-card-price-input"
                                                style={{ width: '100%', height: "40px", border: '1px solid #d9d9d9' }}
                                                aria-label="Transport cost"
                                                placeholder="0"
                                            />
                                        </span>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Divider className="warehouse-divider">Materiallar</Divider>

                        {materialsWithCosts.map((material) => {
                            const {
                                materialBasePrice,
                                materialVatAmount,
                                materialTotalWithoutVat,
                                materialPricePerUnitWithoutVat,
                                materialVatPerUnit,
                                totalPricePerUnit,
                            } = calculateMaterialFinancials(material);

                            return (
                                <div key={material.id} style={{ marginBottom: 16 }}>
                                    <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
                                        <Col xs={24} sm={12} md={8}>
                                            <Input
                                                placeholder="Material nomini kiriting"
                                                value={material.name}
                                                onChange={(e) => handleMaterialChange(material.id, "name", e.target.value)}
                                                className="warehouse-input"
                                                prefix={<LuPackagePlus />}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item
                                                name={`quantity_${material.id}`}
                                                initialValue={material.quantity}
                                                rules={[{ required: true, message: "Miqdor kiritish shart" }]}
                                                className="warehouse-form-item"
                                            >
                                                <FormattedInput
                                                    placeholder="Miqdor"
                                                    value={material.quantity}
                                                    onChange={(value) => handleMaterialChange(material.id, "quantity", value)}
                                                    className="warehouse-input"
                                                    min={0}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item
                                                name={`price_${material.id}`}
                                                initialValue={material.price}
                                                rules={[{ required: true, message: "Narx kiritish shart" }]}
                                                className="warehouse-form-item"
                                            >
                                                <FormattedInput
                                                    placeholder="Narx"
                                                    value={material.price}
                                                    onChange={(value) => handleMaterialChange(material.id, "price", value)}
                                                    className="warehouse-input"
                                                    min={0}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={12} md={8}>
                                            <Select
                                                placeholder="Birlikni tanlang"
                                                value={material.unit}
                                                onChange={(value) => handleMaterialChange(material.id, "unit", value)}
                                                className="warehouse-selectoption"
                                            >
                                                <Option value="kilo">Kilogram (kg)</Option>
                                                <Option value="dona">Dona</Option>
                                                <Option value="metr">Metr (m)</Option>
                                                <Option value="litr">Litr</Option>
                                            </Select>
                                        </Col>
                                        <Col xs={24} sm={12} md={8}>
                                            <Select
                                                placeholder="Kategoriyani tanlang"
                                                value={material.category}
                                                onChange={(value) => handleMaterialChange(material.id, "category", value)}
                                                className="warehouse-selectoption"
                                            >
                                                <Option value="BN-3">BN-3</Option>
                                                <Option value="razbavitel">Razbavitel</Option>
                                                <Option value="BN-5">BN-5</Option>
                                                <Option value="Mel">Mel</Option>
                                                <Option value="ip">Ip</Option>
                                                <Option value="kraf">Kraf qog'oz</Option>
                                                <Option value="qop">Qop</Option>
                                                <Option value="chelak">Temir Chelak</Option>
                                                <Option value="nakleyka">Nakleyka</Option>
                                                <Option value="Others">Boshqalar</Option>
                                            </Select>
                                        </Col>
                                        <Col xs={24} sm={12} md={8}>
                                            <Button
                                                type="primary"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleRemoveMaterialFromIncome(material.id)}
                                                className="warehouse-delete-btn"
                                                style={{ width: "100%", height: "38px" }}
                                            />
                                        </Col>
                                    </Row>
                                    <div style={{ margin: "16px 0px", padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                                        {paymentType === "bank" && vatPercentage > 0 ? (
                                            <>
                                                <Text strong style={{ color: '#1890ff' }}>
                                                    Jami summa: {numberFormat(Math.round(materialBasePrice))} so'm
                                                </Text><br />
                                                <Text strong style={{ color: '#52c41a' }}>
                                                    Umumiy NDSsiz summa: <strong>{numberFormat(Math.round(materialTotalWithoutVat))}</strong> so'm
                                                </Text><br />
                                                <Text strong style={{ color: '#fa541c' }}>
                                                    Umumiy NDS miqdori ({vatPercentage}%): <strong>{numberFormat(Math.round(materialVatAmount))}</strong> so'm
                                                </Text><br />
                                                {material.quantity > 0 && (
                                                    <>
                                                        <Text style={{ color: '#722ed1' }}>
                                                            1 {material.unit} NDSsiz narx: <strong>{numberFormat(materialPricePerUnitWithoutVat.toFixed(2))}</strong> so'm
                                                        </Text><br />
                                                        <Text style={{ color: '#eb2f96' }}>
                                                            1 {material.unit} uchun NDS miqdori: <strong>{numberFormat(materialVatPerUnit.toFixed(2))}</strong> so'm
                                                        </Text><br />
                                                        <div style={{ width: "100%", height: "1px", margin: '5px 0', background: "#00000021" }} />
                                                        <Text style={{ color: '#fa8c16' }}>
                                                            1 {material.unit} jami narx (transport va ishchi bilan): <strong>{numberFormat(totalPricePerUnit.toFixed(2))}</strong> so'm
                                                        </Text><br />
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Text strong style={{ color: '#1890ff' }}>
                                                    Jami summa: {numberFormat(Math.round(materialBasePrice))} so'm
                                                </Text><br />
                                                {material.quantity > 0 && (
                                                    <>
                                                        <div style={{ width: "100%", height: "1px", margin: '5px 0', background: "#00000021" }} />
                                                        <Text style={{ color: '#fa8c16' }}>
                                                            1 {material.unit} jami narx (transport va ishchi bilan): <strong>{numberFormat(totalPricePerUnit.toFixed(2))}</strong> so'm
                                                        </Text><br />
                                                    </>
                                                )}
                                            </>
                                        )}
                                        {material.workerCostPerUnit > 0 && (
                                            <Text style={{ color: '#13c2c2' }}>
                                                1 {material.unit} ishchi xarajati: <strong>{numberFormat(material.workerCostPerUnit.toFixed(2))}</strong> so'm
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <Button
                            type="dashed"
                            onClick={handleAddMaterialToIncome}
                            block
                            icon={<PlusOutlined />}
                            className="warehouse-add-material-btn"
                            style={{ marginBottom: 24 }}
                        >
                            Material Qo'shish
                        </Button>
                        <Row gutter={[16, 16]}>
                            {/* <Col xs={24} sm={12} md={paymentType === "bank" ? 14 : 12}>
                                <Form.Item
                                    label="To'langan summa"
                                    name="paidAmount"
                                    className="warehouse-form-item"
                                >
                                    <FormattedInput
                                        placeholder="To'langan summani kiriting"
                                        value={paidAmount}
                                        onChange={setPaidAmount}
                                        className="warehouse-input"
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>*/}
                            <Col xs={24} sm={12} md={paymentType === "bank" ? 19 : 24}>
                                <Form.Item
                                    label="To'lov turi"
                                    name="paymentType"
                                    initialValue="naqt"
                                    className="warehouse-form-item"
                                >
                                    <Select
                                        className="warehouse-select"
                                        onChange={setPaymentType}
                                    >
                                        <Option value="naqt">Naqt</Option>
                                        <Option value="bank">Bank</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            {paymentType === "bank" && (
                                <Col xs={24} sm={12} md={5}>
                                    <Form.Item
                                        label="NDS (%)"
                                        name="vatPercentage"
                                        initialValue={factories?.innerData?.[0]?.nds || 12}
                                        rules={[{ required: true, message: "NDS foiz kiritish shart" }]}
                                        className="warehouse-form-item"
                                    >
                                        <FormattedInput
                                            placeholder="NDS foiz"
                                            value={vatPercentage}
                                            onChange={setVatPercentage}
                                            max={100}
                                            min={0}
                                            className="warehouse-input"
                                        />
                                    </Form.Item>
                                </Col>
                            )}
                        </Row>
                        <Button
                            type="primary"
                            style={{ width: "100%", margin: "15px 0" }}
                            htmlType="submit"
                            loading={createIncomeLoading}
                            disabled={createIncomeLoading}
                            icon={<PlusOutlined />}
                            size="large"
                            className="warehouse-submit-btn"
                        >
                            Saqlash
                        </Button>
                    </Form>
                </div>
                <div>
                    {hasBn3Material && (
                        <>
                            <Divider className="warehouse-divider">BN-3 Materiallari uchun Ishchilar</Divider>
                            <Form.Item
                                label="Ishchilarni tanlang (BN-3 tushirish uchun)"
                                name="workers"
                                rules={[{ required: true, message: "Kamida bitta ishchi tanlash shart" }]}
                                className="warehouse-form-item"
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Ishchilarni tanlang"
                                    value={selectedWorkers}
                                    onChange={handleWorkerChange}
                                    className="warehouse-select"
                                    style={{ width: "100%", maxWidth: "100%", minHeight: "auto" }}
                                    maxTagCount="responsive"
                                >
                                    {workersData.map((worker) => (
                                        <Select.Option key={worker._id} value={worker._id}>
                                            {worker.firstName} {worker.lastName}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            {workerPayments.length > 0 && (
                                <div style={{ margin: "16px 0px", padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                                    <Text strong style={{ color: '#1890ff' }}>Ishchilar uchun to'lovlar:</Text>
                                    {workerPayments.map((wp) => (
                                        <div key={wp.workerId}>
                                            <Text style={{ color: '#13c2c2' }}>
                                                {wp.name}: <strong>{numberFormat(wp.payment)}</strong> so'm
                                            </Text>
                                        </div>
                                    ))}
                                    <Text strong style={{ color: '#1890ff' }}>
                                        Umumiy ishchi xarajati: <strong>{numberFormat(workerPayments.reduce((sum, wp) => sum + wp.payment, 0))}</strong> so'm
                                    </Text>
                                </div>
                            )}
                        </>
                    )}
                    {transportCost > 0 && (
                        <>
                            <Divider className="warehouse-divider">Transport Harajatlari Hisoboti</Divider>
                            <div style={{ margin: "16px 0px", padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                                <Text strong style={{ color: '#1890ff' }}>
                                    Umumiy transport harajati: <strong>{numberFormat(transportCost)}</strong> so'm
                                </Text><br />
                                {materialsWithCosts.map((material) => (
                                    <div key={material.id}>
                                        <Text style={{ color: '#fa8c16' }}>
                                            {material.name} ({numberFormat(material.quantity)} {material.unit}):{' '}
                                            <strong>{numberFormat(material.transportCostPerUnit.toFixed(2))}</strong> so'm/{material.unit},{' '}<br />
                                            Jami narx: <strong>{numberFormat((Number(material.price) + Number(material.transportCostPerUnit) + Number(material.workerCostPerUnit)).toFixed(2))}</strong> so'm/{material.unit}
                                        </Text>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Modal >
    );
};

export default EditMaterialModal;





