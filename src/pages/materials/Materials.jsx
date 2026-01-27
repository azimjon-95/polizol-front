import React, { useState } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Popconfirm, Card, Row, Col, Space, Tag, Typography,
} from "antd";
import {
  useGetAllMaterialsQuery, useDeleteMaterialMutation, useUpdateMaterialMutation,
  useGetFirmsQuery, useCreateFirmMutation
} from "../../context/materialApi";
import { capitalizeFirstLetter } from "../../hook/CapitalizeFirstLitter";
import { useSelector } from "react-redux";
import { DeleteOutlined, EditOutlined, PlusOutlined, ShopOutlined, BarChartOutlined, BuildOutlined, SafetyOutlined, CopyOutlined } from "@ant-design/icons";
import { LuPackagePlus } from "react-icons/lu";
import { toast } from "react-toastify";
import FormattedInput from "../../components/FormattedInput";
import IncomeListModal from "./IncomeListModal";
import "./Materials.css";
import EditMaterialModal from "./EditMaterialModal";
import MaterialIncomeTable from "./style/incomeTable/MaterialIncomeTable";

const { Option } = Select;
const { Title, Text } = Typography;

// Optimized numberFormat function to handle fractional quantities
const numberFormat = (number, decimals = 2) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  // Round to specified decimals to avoid floating-point precision issues
  const roundedNumber = Number(number.toFixed(decimals));
  // Format with commas for thousands and ensure decimal places
  const [integerPart, decimalPart] = roundedNumber.toString().split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPart ? `${formattedInteger}.${decimalPart.padEnd(decimals, '0')}` : formattedInteger;
};

const WarehouseManagement = () => {
  const [materialForm] = Form.useForm();
  const [firmForm] = Form.useForm();
  const role = localStorage.getItem("role")

  // API Hooks
  const { data: materials, refetch, isLoading: materialsLoading } = useGetAllMaterialsQuery();
  const { data: firms, isLoading: firmsLoading } = useGetFirmsQuery();
  const [updateMaterial, { isLoading: updateMaterialLoading }] = useUpdateMaterialMutation();
  const [deleteMaterial] = useDeleteMaterialMutation();
  const [createFirm, { isLoading: createFirmLoading }] = useCreateFirmMutation();

  // Data
  const materialsData = materials?.innerData || [];
  const firmsData = firms?.innerData || [];
  const searchTextValue = useSelector((s) => s.search.searchQuery);

  // State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFirmModalOpen, setIsFirmModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isIncomeListModalOpen, setIsIncomeListModalOpen] = useState(true);
  const [incomeSearchText, setIncomeSearchText] = useState("");
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isIncomeTableModalOpen, setIsIncomeTableModalOpen] = useState(false);
  const [selectedMaterialName, setSelectedMaterialName] = useState("");

  // Handlers
  const handleDeleteMaterial = async (id) => {
    try {
      await deleteMaterial(id).unwrap();
      refetch();
      toast.success("Material muvaffaqiyatli o'chirildi");
    } catch (error) {
      toast.error(error?.data?.message || "Materialni o'chirishda xatolik yuz berdi");
    }
  };

  const handleUpdateMaterial = async (values) => {
    try {
      const updatedValues = {
        ...values,
        quantity: Number(values.quantity),
        price: Number(values.price),
        currency: "sum",
      };

      await updateMaterial({ id: editingMaterial._id, body: updatedValues }).unwrap();
      toast.success("Material muvaffaqiyatli tahrirlandi");
      setIsEditModalOpen(false);
      setEditingMaterial(null);
      refetch();
      materialForm.resetFields();
    } catch (error) {
      toast.error(error?.data?.message || "Materialni tahrirlashda xatolik yuz berdi");
    }
  };

  const handleCreateFirm = async (values) => {
    try {
      await createFirm(values).unwrap();
      toast.success("Firma muvaffaqiyatli qo'shildi");
      firmForm.resetFields();
      refetch();
      setIsFirmModalOpen(false);
    } catch (error) {
      toast.error(error?.data?.message || "Firma qo'shishda xatolik yuz berdi");
    }
  };

  const handleCopyMaterialName = (name) => {
    navigator.clipboard.writeText(name).then(() => {
      toast.success(
        <span>
          <strong>{capitalizeFirstLetter(name)}</strong> nomli material nusxalandi
        </span>,
        {
          autoClose: 2000,
          className: 'warehouse-toast-copy',
        }
      );
    }).catch(() => {
      toast.error("Nusxalashda xatolik yuz berdi");
    });
  };

  const materialColumns = [
    {
      title: "Material",
      dataIndex: "name",
      key: "name",
      className: "warehouse-table-cell-primary",
      render: (text) => (
        <div className="warehouse-material-name">
          <LuPackagePlus className="warehouse-material-icon" />
          <Text strong>{capitalizeFirstLetter(text)}</Text>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => handleCopyMaterialName(text)}
            className="warehouse-copy-btn"
          />
        </div>
      ),
    },
    {
      title: "Birlik narxi",
      dataIndex: "price",
      key: "price",
      className: "warehouse-table-cell-price",
      render: (price, record) => (
        <Tag className={`warehouse-price-tag warehouse-price-tag-${record.currency}`}>
          {numberFormat(price, 2)} <Text type="secondary">so'm</Text>
        </Tag>
      ),
    },
    {
      title: "Umumiy summa",
      key: "totalPrice",
      className: "warehouse-table-cell-price",
      render: (_, record) => {
        // Ensure precise calculation for total price
        const totalPrice = Number((record.price * record.quantity).toFixed(2));
        return (
          <Tag className={`warehouse-price-tag warehouse-price-tag-${record.currency}`}>
            {numberFormat(totalPrice, 2)} <Text type="secondary"> so'm</Text>
          </Tag>
        );
      },
    },
    {
      title: "Miqdor",
      dataIndex: "quantity",
      key: "quantity",
      className: "warehouse-table-cell-quantity",
      render: (quantity, record) => (
        <div className="warehouse-quantity-display">
          <Text strong className="warehouse-quantity-number">{numberFormat(quantity, 3)}</Text>
        </div>
      ),
    },
    {
      title: "Birlik",
      dataIndex: "unit",
      key: "unit",
      className: "warehouse-table-cell-unit",
      render: (unit) => (
        <Tag className={`warehouse-unit-tag warehouse-unit-tag-${unit}`}>
          {unit}
        </Tag>
      ),
    },
    ...[role !== "direktor" && (
      {
        title: "Harakatlar",
        key: "actions",
        className: "warehouse-table-cell-actions",
        render: (_, record) => (
          <Space className="warehouse-action-buttons">
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              className="warehouse-edit-btn"
              onClick={() => {
                setEditingMaterial(record);
                setIsEditModalOpen(true);
                materialForm.setFieldsValue({
                  ...record,
                  price: record.avgPrice,
                });
              }}
            />
            <Popconfirm
              title="Materialni o'chirish"
              description="Haqiqatan ham bu materialni o'chirmoqchimisiz?"
              okText="Ha"
              cancelText="Yo'q"
              onConfirm={() => handleDeleteMaterial(record._id)}
              okButtonProps={{ className: "warehouse-confirm-btn" }}
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                className="warehouse-delete-btn"
              />
            </Popconfirm>
          </Space>
        ),
      })
    ].filter(Boolean),

    {
      title: "Kirimlar",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => {
              setSelectedMaterialName(record.name);
              setIsIncomeTableModalOpen(true);
            }}
          />
        </Space>
      ),
    }
  ];

  // Filter materials and incomes
  const filteredMaterials = materialsData.filter((material) =>
    material.name.toLowerCase().includes(searchTextValue.toLowerCase())
  );

  // Calculate statistics
  const totalMaterials = materialsData.length;
  const totalValue = materialsData.reduce(
    (sum, material) => sum + Number(((material.price || 0) * material.quantity).toFixed(2)),
    0
  );
  const lowStockMaterials = materialsData.filter((m) => m.quantity < 10).length;

  return (
    <>
      <Modal
        open={isIncomeTableModalOpen}
        onCancel={() => setIsIncomeTableModalOpen(false)}
        footer={null}
        width={1000}
        title={`${capitalizeFirstLetter(selectedMaterialName)} – kirimlar`}
      >
        <MaterialIncomeTable materialName={selectedMaterialName} />
      </Modal>
      {
        isIncomeListModalOpen === true &&
        <div className="warehouse-container">
          <div className="warehouse-main-content">
            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="warehouse-stats-row">
              <Col xs={12} sm={12} lg={6}>
                <Card className="warehouse-stat-card warehouse-stat-card-primary">
                  <div className="warehouse-stat-content">
                    <div className="warehouse-stat-icon">
                      <LuPackagePlus />
                    </div>
                    <div className="warehouse-stat-info">
                      <Text className="warehouse-stat-number">{totalMaterials}</Text>
                      <Text className="warehouse-stat-label">Jami materiallar</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Card className="warehouse-stat-card warehouse-stat-card-success">
                  <div className="warehouse-stat-content">
                    <div className="warehouse-stat-icon">
                      <BarChartOutlined />
                    </div>
                    <div className="warehouse-stat-info">
                      <Text className="warehouse-stat-number">{numberFormat(Math.floor(totalValue), 2)} so'm</Text>
                      <Text className="warehouse-stat-label">Umumiy qiymat</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Card className="warehouse-stat-card warehouse-stat-card-warning">
                  <div className="warehouse-stat-content">
                    <div className="warehouse-stat-icon">
                      <SafetyOutlined />
                    </div>
                    <div className="warehouse-stat-info">
                      <Text className="warehouse-stat-number">{lowStockMaterials}</Text>
                      <Text className="warehouse-stat-label">Kam qolgan</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Card className="warehouse-stat-card warehouse-stat-card-info">
                  <div className="warehouse-stat-content">
                    <div className="warehouse-stat-icon">
                      <ShopOutlined />
                    </div>
                    <div className="warehouse-stat-info">
                      <Text className="warehouse-stat-number">{firmsData.length}</Text>
                      <Text className="warehouse-stat-label">Hamkor firmalar</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
            {/* Materials Table */}
            <Card className="warehouse-table-card">
              <div className="warehouse-table-header">
                <Title level={4} className="warehouse-table-title">
                  <BuildOutlined /> Ombordagi Materiallar
                </Title>
                <Space>
                  {role !== "direktor" &&

                    <>
                      <Button
                        type="primary" Transportni tanlang
                        icon={<PlusOutlined />}
                        className="warehouse-add-btn"
                        onClick={() => setIsIncomeModalOpen(true)}
                      >
                        Yangi material keldi
                      </Button>
                      <Button
                        type="primary"
                        icon={<ShopOutlined />}
                        className="warehouse-add-btn"
                        onClick={() => setIsFirmModalOpen(true)}
                      >
                        Firma qo'shish
                      </Button>
                    </>
                  }
                  <Button
                    type="primary"
                    // icon={<Bar12 BarChartOutlined />}
                    className="warehouse-add-btn warehouse-income-list-btn"
                    onClick={() => setIsIncomeListModalOpen(!isIncomeListModalOpen)}
                  >
                    Kirimlar tarixi
                  </Button>
                </Space>
              </div>
              <Table
                columns={materialColumns}
                dataSource={filteredMaterials}
                loading={materialsLoading}
                rowKey="_id"
                pagination={false}
                className="warehouse-materials-table"
                size="small"
                bordered
              />

            </Card>
          </div>

          {/* Edit Material Modal */}
          <Modal
            title={<span style={{ color: "#fff" }}>Materialni Tahrirlash</span>}
            open={isEditModalOpen}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingMaterial(null);
              materialForm.resetFields();
            }}
            footer={null}
            className="warehouse-modal"
          >
            <Form
              form={materialForm}
              layout="vertical"
              onFinish={handleUpdateMaterial}
              className="warehouse-add-form"
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Material nomi"
                    name="name"
                    rules={[{ required: true, message: "Material nomi kiritish shart" }]}
                    className="warehouse-form-item"
                  >
                    <Input
                      placeholder="Material nomini kiriting"
                      className="warehouse-input"
                      prefix={<LuPackagePlus />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="O'lchov birligi"
                    name="unit"
                    rules={[{ required: true, message: "O'lchov birligini tanlash shart" }]}
                    className="warehouse-form-item"
                  >
                    <Select placeholder="Birlikni tanlang" className="warehouse-select">
                      <Option value="kilo">Kilogram (kg)</Option>
                      <Option value="dona">Dona</Option>
                      <Option value="metr">Metr (m)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Kategoriya"
                    name="category"
                    rules={[{ required: true, message: "Kategoriyani tanlash shart" }]}
                    className="warehouse-form-item"
                  >
                    <Select placeholder="Kategoriyani tanlang" className="warehouse-select">
                      <Option value="BN-3">BN-3</Option>
                      <Option value="razbavitel">Razbavitel</Option>
                      <Option value="BN-5">BN-5</Option>
                      <Option value="Mel">Mel</Option>
                      <Option value="ip">Ip</Option>
                      <Option value="kraf">Kraf qog'oz</Option>
                      <Option value="qop">Qop</Option>
                      <Option value="chelak">Temir Chelak</Option>
                      <Option value="kaustik">Kaustik</Option>
                      <Option value="lesitin">Lesitin</Option>
                      <Option value="nafta">Nafta</Option>
                      <Option value="nefras">Nefras</Option>
                      <Option value="nakleyka">Nakleyka</Option>
                      <Option value="Others">Boshqalar</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Miqdori"
                    name="quantity"
                    rules={[
                      { required: true, message: "Miqdor kiritish shart" },
                      {
                        validator: (_, value) =>
                          value && !isNaN(value) && Number(value) >= 0
                            ? Promise.resolve()
                            : Promise.reject("Miqdor musbat raqam bo'lishi kerak"),
                      },
                    ]}
                    className="warehouse-form-item"
                  >
                    <FormattedInput placeholder="Miqdorini kiriting" className="warehouse-input" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[24, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Narxi"
                    name="price"
                    rules={[
                      { required: true, message: "Narxini kiritish shart" },
                      {
                        validator: (_, value) =>
                          value && !isNaN(value) && Number(value) >= 0
                            ? Promise.resolve()
                            : Promise.reject("Narx musbat raqam bo'lishi kerak"),
                      },
                    ]}
                    className="warehouse-form-item"
                  >
                    <FormattedInput placeholder="Narxini kiriting" className="warehouse-input" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item className="warehouse-form-submit">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updateMaterialLoading}
                  disabled={updateMaterialLoading}
                  icon={<EditOutlined />}
                  size="large"
                  className="warehouse-submit-btn"
                >
                  Saqlash
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title={<span style={{ color: "#fff" }}>Firma Qo'shish</span>}
            open={isFirmModalOpen}
            onCancel={() => {
              setIsFirmModalOpen(false);
              firmForm.resetFields();
            }}
            footer={null}
            className="warehouse-modal"
          >
            <Form
              form={firmForm}
              layout="vertical"
              onFinish={handleCreateFirm}
              className="warehouse-add-form"
            >
              <Form.Item
                label="Firma nomi"
                name="name"
                rules={[{ required: true, message: "Firma nomi kiritish shart" }]}
                className="warehouse-form-item"
              >
                <Input
                  placeholder="Firma nomini kiriting"
                  className="warehouse-input"
                  prefix={<ShopOutlined />}
                />
              </Form.Item>
              <Form.Item
                label="Telefon raqami"
                name="phone"
                rules={[{ required: true, message: "Telefon raqami kiritish shart" }]}
                className="warehouse-form-item"
              >
                <Input placeholder="Telefon raqamini kiriting" className="warehouse-input" />
              </Form.Item>
              <Form.Item
                label="Manzil"
                name="address"
                rules={[{ required: true, message: "Manzil kiritish shart" }]}
                className="warehouse-form-item"
              >
                <Input placeholder="Manzilni kiriting" className="warehouse-input" />
              </Form.Item>
              <Form.Item className="warehouse-form-submit">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createFirmLoading}
                  icon={<PlusOutlined />}
                  size="large"
                  className="warehouse-submit-btn"
                >
                  Firma Qo'shish
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* Income Material Modal */}
          <EditMaterialModal refetch={refetch} setIsIncomeModalOpen={setIsIncomeModalOpen} firmsLoading={firmsLoading} isIncomeModalOpen={isIncomeModalOpen} />

        </div>
      }
      {
        isIncomeListModalOpen === false &&
        <IncomeListModal
          setIsIncomeListModalOpen={setIsIncomeListModalOpen}
          incomeSearchText={incomeSearchText}
          setIncomeSearchText={setIncomeSearchText}
        />
      }
    </>
  );
};

export default WarehouseManagement;