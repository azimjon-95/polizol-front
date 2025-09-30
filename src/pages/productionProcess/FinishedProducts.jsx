import React, { useState, useMemo } from "react";
import { Select, Modal, Button, Form, InputNumber, message } from "antd";
import { Archive } from "lucide-react";
import { GiEmptyMetalBucketHandle } from "react-icons/gi";
import { FiEdit } from "react-icons/fi";
import ruberoid from "../../assets/ruberoid.jpg";
import folgizol from "../../assets/folgizol.jpg";
import polizol from "../../assets/polizol.jpg";
import praymer from "../../assets/praymer.png";
import betumImg from "../../assets/betum.png";
import stakanBNI from "../../assets/stakanBN.png";
import bn5 from "../../assets/bn5.png";
import { useGetFinishedProductsQuery, useUpdateFinishedMutation } from "../../context/productionApi";
import { capitalizeFirstLetter } from "../../hook/CapitalizeFirstLitter";
import { NumberFormat } from "../../hook/NumberFormat";
import "./style.css";

const { Option } = Select;

const StockInventory = () => {
    const [filterValue, setFilterValue] = useState("all");
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isDefectiveModalOpen, setIsDefectiveModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedReturnProduct, setSelectedReturnProduct] = useState(null);
    const [selectedDefectiveProduct, setSelectedDefectiveProduct] = useState(null);
    const [selectedEditProduct, setSelectedEditProduct] = useState(null);
    const [formValues, setFormValues] = useState({
        quantity: 0,
        productionCost: 0,
        sellingPrice: 0,
    });
    const [form] = Form.useForm();

    const {
        data: finishedProducts,
        isLoading: productsLoading,
        error: productsError,
        refetch,
    } = useGetFinishedProductsQuery();

    const [updateFinishedProduct, { isLoading: updateLoading }] = useUpdateFinishedMutation();

    const productOptions = useMemo(() => {
        const options = [
            { value: "all", label: "Barchasi" },
            { value: "returned", label: "Mijozdan qaytgan" },
            { value: "defective", label: "Brak mahsulot" },
        ];

        const productMap = new Map();
        finishedProducts?.forEach((product) => {
            const key = `${product.productName}|${product.category}`;
            if (!productMap.has(key)) {
                productMap.set(key, {
                    value: key,
                    label: `${capitalizeFirstLetter(product.productName)} (${product.category})`,
                });
            }
        });

        return [...options, ...Array.from(productMap.values())];
    }, [finishedProducts]);

    const filteredProducts = useMemo(() => {
        if (filterValue === "all") {
            return finishedProducts;
        } else if (filterValue === "returned") {
            return finishedProducts?.filter((product) => product.isReturned);
        } else if (filterValue === "defective") {
            return finishedProducts?.filter((product) => product.isDefective);
        } else {
            const [productName, category] = filterValue.split("|");
            return finishedProducts?.filter(
                (product) =>
                    product.productName === productName && product.category === category
            );
        }
    }, [finishedProducts, filterValue]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("uz-UZ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleShowReturnInfo = (product) => {
        setSelectedReturnProduct(product);
        setIsReturnModalOpen(true);
    };

    const handleShowDefectiveInfo = (product) => {
        setSelectedDefectiveProduct(product);
        setIsDefectiveModalOpen(true);
    };

    const handleShowEditModal = (product) => {
        setSelectedEditProduct(product);
        setFormValues({
            quantity: product.quantity || 0,
            productionCost: product.productionCost || 0,
            sellingPrice: product.sellingPrice || 0,
        });
        form.setFieldsValue({
            quantity: product.quantity || 0,
            productionCost: product.productionCost || 0,
            sellingPrice: product.sellingPrice || 0,
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedEditProduct(null);
        setFormValues({
            quantity: 0,
            productionCost: 0,
            sellingPrice: 0,
        });
        form.resetFields();
    };

    const handleFormValuesChange = (changedValues) => {
        setFormValues((prev) => ({
            ...prev,
            ...changedValues,
        }));
    };

    const handleUpdateProduct = async () => {
        try {
            // Validate form fields before submission
            await form.validateFields();
            const updatedProduct = {
                quantity: formValues.quantity,
                productionCost: formValues.productionCost,
                sellingPrice: formValues.sellingPrice,
            };


            const response = await updateFinishedProduct({
                id: selectedEditProduct._id,
                data: updatedProduct,
            }).unwrap();

            message.success("Mahsulot muvaffaqiyatli yangilandi!");
            handleCloseEditModal();
            refetch();
        } catch (error) {

            message.error(`Yangilashda xatolik yuz berdi: ${error.message || "Noma'lum xato"}`);
        }
    };

    return (
        <div className="finished-products-wrapper">
            <div className="history-header-section">
                <div className="history-title-container">
                    <div className="history-icon-wrapper">
                        <Archive className="history-title-icon" />
                    </div>
                    <div>
                        <h2 className="header-title">Tayyor Mahsulotlar Ombori</h2>
                        <p className="header-description">
                            Xom ashyo va tayyor mahsulotlarni boshqaring
                        </p>
                    </div>
                </div>
                <div className="Select_mki-summary">
                    <Select
                        value={filterValue}
                        onChange={(value) => setFilterValue(value)}
                        style={{ width: 250 }}
                    >
                        {productOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                    <div className="mki-summary-section">
                        <div className="mki-summary-item">
                            <span className="mki-summary-icon">📦</span>
                            <span className="mki-summary-label">Mahsulotlar soni: </span>
                            <span className="mki-summary-value">
                                {filteredProducts?.length || 0} ta
                            </span>
                        </div>
                        <div className="mki-summary-item">
                            <span className="mki-summary-icon">💸</span>
                            <span className="mki-summary-label">Qimati: </span>
                            <span className="mki-summary-value">
                                {NumberFormat(
                                    filteredProducts?.reduce(
                                        (total, product) =>
                                            total + product.sellingPrice * product.quantity,
                                        0
                                    ) || 0
                                )}{" "}
                                so'm
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="finished-products-grid">
                {productsLoading ? (
                    <p className="loading-text">Yuklanmoqda...</p>
                ) : productsError ? (
                    <p className="error-text">Xatolik: {productsError.message}</p>
                ) : filteredProducts?.length > 0 ? (

                    filteredProducts.map((product, inx) => {
                        const categoryConfig = {
                            "BN-5": { img: bn5, className: "product-imagepolizol" },
                            ruberoid: { img: ruberoid, className: "product-imagepolizol" },
                            polizol: { img: polizol, className: "product-imagepolizol" },
                            Praymer: { img: praymer, className: "product-imageBIPRO", extra: `${NumberFormat(product.quantity * 18)} kg` },
                            Stakan: { img: stakanBNI, className: "product-imagebnStak" },
                            Qop: { img: betumImg, className: "product-imagebn" },
                            default: { img: folgizol, className: "product-image" },
                        };

                        const { img, className, extra } = categoryConfig[product.category] || categoryConfig.default;

                        return (
                            <div key={inx} className="product-card-container">
                                <button type="primary" onClick={() => handleShowEditModal(product)}>
                                    <FiEdit />
                                </button>

                                <div className={className}>
                                    <img src={img} alt={product.category} />

                                    {product.isReturned && (
                                        <div className="return-info">
                                            <p style={{ color: "#d32f2f", fontWeight: "bold" }}>Mijozdan qaytgan</p>
                                            <Button
                                                type="link"
                                                onClick={() => handleShowReturnInfo(product)}
                                                style={{ padding: 0, color: "#fff" }}
                                            >
                                                Batafsil
                                            </Button>
                                        </div>
                                    )}

                                    {product.isDefective && (
                                        <div className="defective-info">
                                            <p style={{ color: "#333", fontWeight: "bold" }}>Brak mahsulot</p>
                                            <Button
                                                type="link"
                                                onClick={() => handleShowDefectiveInfo(product)}
                                                style={{ padding: 0, color: "#fff" }}
                                            >
                                                Batafsil
                                            </Button>
                                        </div>
                                    )}

                                    {extra && <p className="praymerKgs">{extra}</p>}
                                </div>

                                <h3 className="product-name">{capitalizeFirstLetter(product.productName)}</h3>
                                <p className="product-category">
                                    📂 Kategoriya: <span>{product.category}</span>
                                </p>

                                <div className="product-quantity-block">
                                    {product.category === "Praymer" ? (
                                        <span className="product-quantity">
                                            {NumberFormat(product.quantity)} <GiEmptyMetalBucketHandle />
                                        </span>
                                    ) : ["Stakan", "Qop", "BN-5"].includes(product.category) ? (
                                        <span className="product-quantity">{NumberFormat(product.quantity)} kg</span>
                                    ) : (
                                        <span className="product-quantity">{NumberFormat(product.quantity)} dona</span>
                                    )}
                                    <span className="product-Cost">
                                        Narxi: {NumberFormat(Math.floor(product.sellingPrice))} so'm
                                    </span>
                                </div>
                            </div>
                        );
                    })


                ) : (
                    <div className="empty-state-container">
                        <Archive size={48} className="empty-icon" />
                        <p className="empty-text">Hozircha tayyor mahsulotlar yo'q</p>
                    </div>
                )}
            </div>

            <Modal
                title="Qaytarilgan Mahsulot Ma'lumotlari"
                open={isReturnModalOpen}
                onCancel={() => {
                    setIsReturnModalOpen(false);
                    setSelectedReturnProduct(null);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setIsReturnModalOpen(false);
                            setSelectedReturnProduct(null);
                        }}
                    >
                        Yopish
                    </Button>,
                ]}
            >
                {selectedReturnProduct ? (
                    <div>
                        <p>
                            <strong>Mahsulot Nomi:</strong>{" "}
                            {capitalizeFirstLetter(selectedReturnProduct.productName)}
                        </p>
                        <p>
                            <strong>Kategoriya:</strong> {selectedReturnProduct.category}
                        </p>
                        <p>
                            <strong>Qaytarilgan Sana:</strong>{" "}
                            {formatDate(selectedReturnProduct.returnInfo.returnDate)}
                        </p>
                        <p>
                            <strong>Qaytarish Sababi:</strong>{" "}
                            {selectedReturnProduct.returnInfo.returnReason}
                        </p>
                    </div>
                ) : (
                    <p>Yuklanmoqda...</p>
                )}
            </Modal>

            <Modal
                title="Brak Mahsulot Ma'lumotlari"
                open={isDefectiveModalOpen}
                onCancel={() => {
                    setIsDefectiveModalOpen(false);
                    setSelectedDefectiveProduct(null);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setIsDefectiveModalOpen(false);
                            setSelectedDefectiveProduct(null);
                        }}
                    >
                        Yopish
                    </Button>,
                ]}
            >
                {selectedDefectiveProduct ? (
                    <div>
                        <p>
                            <strong>Mahsulot Nomi:</strong>{" "}
                            {capitalizeFirstLetter(selectedDefectiveProduct.productName)}
                        </p>
                        <p>
                            <strong>Kategoriya:</strong> {selectedDefectiveProduct.category}
                        </p>
                        <p>
                            <strong>Brak Sababi:</strong>{" "}
                            {selectedDefectiveProduct.defectiveInfo?.defectiveReason || "Noma'lum"}
                        </p>
                        <p>
                            <strong>Brak Tavsifi:</strong>{" "}
                            {selectedDefectiveProduct.defectiveInfo?.defectiveDescription ||
                                "Tavsif yo'q"}
                        </p>
                        <p>
                            <strong>Brak Sanasi:</strong>{" "}
                            {selectedDefectiveProduct.defectiveInfo?.defectiveDate
                                ? formatDate(selectedDefectiveProduct.defectiveInfo.defectiveDate)
                                : "Noma'lum"}
                        </p>
                    </div>
                ) : (
                    <p>Yuklanmoqda...</p>
                )}
            </Modal>

            <Modal
                title="Mahsulotni Tahrirlash"
                open={isEditModalOpen}
                onCancel={handleCloseEditModal}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateProduct}
                    onValuesChange={handleFormValuesChange}
                >
                    <Form.Item
                        name="quantity"
                        label="Miqdori"
                        rules={[{ required: true, message: "Miqdorni kiriting" }]}
                    >
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="productionCost"
                        label="Ishlab Chiqarish Narxi"
                        rules={[{ required: true, message: "Ishlab chiqarish narxini kiriting" }]}
                    >
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="sellingPrice"
                        label="Sotish Narxi"
                        rules={[{ required: true, message: "Sotish narxini kiriting" }]}
                    >
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={updateLoading}>
                            Saqlash
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default StockInventory;



