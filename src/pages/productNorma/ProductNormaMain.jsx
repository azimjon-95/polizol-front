import React, { useState, useMemo, useCallback } from "react";
import { Tabs, Table, Form, Input, Button, Row, Col, Select, Space, Modal, Popconfirm, InputNumber } from "antd";
import { MinusCircleOutlined, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDeleteNormaMutation, useGetAllNormaQuery, useUpdateNormaMutation } from "../../context/normaApi";
import { useGetAllMaterialsQuery } from "../../context/materialApi";
import { NumberFormat } from "../../hook/NumberFormat";
import AddProductNorma from "./AddProductNorma";
import "./ProductNorma.css";
import { toast } from "react-toastify";
import { capitalizeFirstLetter } from "../../hook/CapitalizeFirstLitter";

const { Option } = Select;

const ProductNorma = () => {
  const [form] = Form.useForm();
  const [modalState, setModalState] = useState({
    isDescriptionOpen: false,
    isMaterialsOpen: false,
    isUpdateOpen: false,
    isViewOpen: true,
    selectedDescription: "",
    selectedMaterials: [],
    editingNormaId: null,
  });

  // RTK Query hooks
  const { data: normas, isLoading: normasLoading } = useGetAllNormaQuery();
  const { data: materialsData, isLoading: materialsLoading } = useGetAllMaterialsQuery();
  const [deleteProductNorma] = useDeleteNormaMutation();
  const [updateProductNorma, { isLoading: updateLoading }] = useUpdateNormaMutation();
  const [addModal, setAddModal] = useState(false);
  const materials = materialsData?.innerData || [];
  const normasData = useMemo(() => normas?.innerData || [], [normas]);

  // Memoized table columns
  const columns = useMemo(
    () => [
      { title: "Nomi", dataIndex: "productName", key: "productName" },
      {
        title: "Kategoriya", dataIndex: "category", key: "category",
        render: (category) => capitalizeFirstLetter(category)
      },
      {
        title: "Qo'shilgan sana",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date) => new Date(date).toLocaleDateString("uz-UZ"),
      },
      { title: "Sotuv narxi", dataIndex: "salePrice", key: "salePrice", render: (price) => NumberFormat(price) + " so'm" },
      {
        title: "Materiallar",
        dataIndex: "materials",
        key: "materials",
        render: (materials) => (
          <EyeOutlined
            style={{ cursor: "pointer" }}
            onClick={() => setModalState((prev) => ({ ...prev, isMaterialsOpen: true, selectedMaterials: materials }))}
          />
        ),
      },
      {
        title: "Amallar",
        render: (_, item) => (
          <Space className="norma_actions">
            <Popconfirm title="Rostdan ham o'chirmoqchimisiz?" onConfirm={() => handleDelete(item._id)}>
              <Button type="primary" danger icon={<DeleteOutlined />} />
            </Popconfirm>
            <EditOutlined onClick={() => handleEdit(item)} />
          </Space>
        ),
      },
    ],
    []
  );

  // Memoized material columns for the materials modal
  const materialColumns = useMemo(
    () => [
      { title: "Material nomi", dataIndex: "name", key: "name", render: (_, record) => record.materialId.name },
      { title: "Miqdor", dataIndex: "quantity", key: "quantity" },
      { title: "O'lchov birligi", dataIndex: "unit", key: "unit", render: (_, record) => record.materialId.unit },
    ],
    []
  );

  // Handle delete
  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteProductNorma(id).unwrap();
        toast.success("Norma o'chirildi");
      } catch (err) {
        toast.error(err?.data?.message || "Norma o'chirilmadi");
      }
    },
    [deleteProductNorma]
  );

  // Handle edit
  const handleEdit = useCallback(
    (norma) => {
      setModalState((prev) => ({ ...prev, editingNormaId: norma._id, isUpdateOpen: true }));
      form.setFieldsValue({
        productName: norma.productName,
        category: norma.category,
        size: norma.size,
        salePrice: norma.salePrice,
        description: norma.description || "",
        materials: norma.materials.map((m) => ({
          materialId: m.materialId?._id || m.materialId,
          quantity: m.quantity,
        })),
      });
    },
    [form]
  );

  // Handle form submission
  const onUpdateFinish = useCallback(
    async (values) => {
      try {
        const updateData = {
          productName: values.productName,
          category: values.category,
          size: values.size,
          salePrice: values.salePrice,
          materials: values.materials.map((newMaterial) => ({
            materialId: newMaterial.materialId,
            quantity: newMaterial.quantity,
          })),
        };

        const res = await updateProductNorma({ id: modalState.editingNormaId, body: updateData }).unwrap();
        toast.success(res.message || "Norma muvaffaqiyatli yangilandi");
        setModalState((prev) => ({ ...prev, isUpdateOpen: false, editingNormaId: null }));
        form.resetFields();
      } catch (error) {
        toast.error(error.data?.message || "Norma yangilashda xatolik");
      }
    },
    [updateProductNorma, modalState.editingNormaId, form]
  );

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isDescriptionOpen: false,
      isMaterialsOpen: false,
      isUpdateOpen: false,
      selectedDescription: "",
      selectedMaterials: [],
      editingNormaId: null,
    }));
    form.resetFields();
  }, [form]);

  // Render table based on category
  const renderTable = useCallback(
    (category) => (
      <Table
        columns={columns}
        dataSource={normasData.filter((norma) => norma.category === category)}
        loading={normasLoading}
        rowKey="_id"
        pagination={false}
        bordered
        size="small"
      />
    ),
    [columns, normasData, normasLoading]
  );

  return (
    <div className="product_norma">
      <Tabs
        tabBarExtraContent={{
          right: (
            <Button onClick={() => setAddModal(true)} type="primary">
              Qo'shish
            </Button>
          ),
        }}
        defaultActiveKey="ruberoid"
      >
        <Tabs.TabPane
          tab={<span onClick={() => setModalState((prev) => ({ ...prev, isViewOpen: true }))}>Ruberoid</span>}
          key="ruberoid"
        >
          {modalState.isViewOpen && renderTable("ruberoid")}
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={<span onClick={() => setModalState((prev) => ({ ...prev, isViewOpen: true }))}>Polizol</span>}
          key="polizol"
        >
          {modalState.isViewOpen && renderTable("polizol")}
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={<span onClick={() => setModalState((prev) => ({ ...prev, isViewOpen: true }))}>Folygoizol</span>}
          key="folygoizol"
        >
          {modalState.isViewOpen && renderTable("folygoizol")}
        </Tabs.TabPane>
      </Tabs>

      {/* Description Modal */}
      <Modal
        title="Tavsif"
        open={modalState.isDescriptionOpen}
        onOk={handleModalClose}
        onCancel={handleModalClose}
        okText="Yopish"
        footer={(_, { OkBtn }) => <OkBtn />}
      >
        {modalState?.selectedDescription?.cost ? (
          <div>
            <p><strong>Gas narxi (birlik uchun):</strong> {NumberFormat(modalState.selectedDescription.cost.gasPerUnit)} so‘m</p>
            <p><strong>Elektr narxi (birlik uchun):</strong> {NumberFormat(modalState.selectedDescription.cost.electricityPerUnit)} so‘m</p>
            <p><strong>Ish haqi:</strong> {NumberFormat(modalState.selectedDescription.cost.laborCost)} so‘m</p>
            <p><strong>Boshqa xarajatlar:</strong> {NumberFormat(modalState.selectedDescription.cost.otherExpenses)} so‘m</p>
          </div>
        ) : (
          <p>Tavsif mavjud emas</p>
        )}
      </Modal>

      {/* Materials Modal */}
      <Modal
        title="Materiallar"
        open={modalState.isMaterialsOpen}
        onOk={handleModalClose}
        onCancel={handleModalClose}
        okText="Yopish"
        footer={(_, { OkBtn }) => <OkBtn />}
      >
        <Table columns={materialColumns} dataSource={modalState.selectedMaterials} rowKey="_id" size="small" pagination={false} />
      </Modal>

      {/* Update Modal */}
      <Modal title="Normani tahrirlash" open={modalState.isUpdateOpen} onCancel={handleModalClose} footer={null} width={800}>
        <Form form={form} layout="vertical" onFinish={onUpdateFinish} initialValues={{ materials: [{ materialId: "", quantity: "" }] }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mahsulot nomi" name="productName" rules={[{ required: true, message: "Mahsulot nomini kiriting!" }]}>
                <Input placeholder="Masalan: Kichik sumka" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kategoriya" name="category" rules={[{ required: true, message: "Kategoriyani tanlang!" }]}>
                <Select placeholder="Kategoriyani tanlang">
                  <Option value="polizol">Polizol</Option>
                  <Option value="ruberoid">Ruberoid</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>

            <Col span={24}>
              <Form.Item name="salePrice" label="Sotuv narxi" rules={[{ required: true, message: "Sotuv narxini kiriting!" }]}>
                <InputNumber placeholder="Sotuv narxi" min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>

          </Row>
          <Form.List name="materials">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                    <Form.Item
                      {...restField}
                      name={[name, "materialId"]}
                      rules={[{ required: true, message: "Materialni tanlang!" }]}
                    >
                      <Select
                        placeholder="Materialni tanlang"
                        loading={materialsLoading}
                        style={{ width: 200 }}
                        showSearch
                        optionFilterProp="children"
                      >
                        {materials?.map((material) => (
                          <Option key={material._id} value={material._id}>
                            {material.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "quantity"]}
                    >
                      <InputNumber placeholder="Miqdor" min={1} style={{ width: 100 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Material qo‘shish
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateLoading}>
              {updateLoading ? "Yangilanmoqda..." : "Normani yangilash"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {addModal && <div className="addModalnorma">
        <AddProductNorma setAddModal={setAddModal} renderTable={renderTable} setModalState={setModalState} />
      </div>
      }
    </div>
  );
};

export default ProductNorma;



