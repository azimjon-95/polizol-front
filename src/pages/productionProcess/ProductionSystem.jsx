import React, { useState, useEffect } from "react";
import { Tabs, Modal, Form, Input, Button, Checkbox } from "antd";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Factory, History, Archive } from "lucide-react";
import { GiOilDrum } from "react-icons/gi";
import {
  useGetFinishedProductsQuery,
  useUpdateFinishedMutation,
  useDeleteFinishedMutation,
} from "../../context/productionApi";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import BitumProductionSystem from "./bitumProduction/BitumProductionSystem";
import InventoryTable from "./bitumProduction/InventoryTable";
import ProductionHistoryTable from "./productionHistory/ProductionHistoryTable";
import CustomModal from "./mod/CustomModal";
import BiproPraymer from "./bitumProduction/BiproPraymer";
import ProductionTable from "./praymerHistory/ProductionTable";
import StockInventory from "./FinishedProducts";
import RuberoidPolizolProduction from "./RuberoidPolizolProduction";
import "./style.css";

const { TabPane } = Tabs;

const ProductionSystem = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDefective, setIsDefective] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();
  const role = localStorage.getItem("role");
  const [activeTab, setActiveTab] = useState(() => {
    return (
      sessionStorage.getItem("activeTab") ||
      (role === "direktor" ? "finished" : "production")
    );
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentDate = new Date();
    return `${currentDate.getFullYear()}.${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;
  });

  useEffect(() => {
    sessionStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const {
    data: finishedProducts,
    isLoading: productsLoading,
    error: productsError,
  } = useGetFinishedProductsQuery();
  const [updateFinished, { isLoading: updateLoading }] = useUpdateFinishedMutation();
  const [deleteFinished, { isLoading: deleteLoading }] = useDeleteFinishedMutation();

  if (productsError) {
    toast.error(
      productsError.data?.message || "Tayyor mahsulotlar ma'lumotlarini olishda xatolik yuz berdi",
      { toastId: "products-error" }
    );
  }

  const handleDelete = (productId) => {
    setDeletingId(productId);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteFinished(deletingId).unwrap();
      toast.success("Mahsulot muvaffaqiyatli o‘chirildi");
    } catch (err) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setModalOpen(false);
      setDeletingId(null);
    }
  };

  const handleModalSubmit = async (values) => {
    try {
      await updateFinished({
        id: selectedProduct._id,
        quantity: parseFloat(values.quantity),
        productionCost: parseFloat(values.productionCost),
        isDefective: values.isDefective || false,
        defectiveInfo: values.isDefective
          ? {
            defectiveReason: values.defectiveReason || "",
            defectiveDescription: values.defectiveDescription || "",
            defectiveDate: values.isDefective ? new Date() : null,
          }
          : {
            defectiveReason: "",
            defectiveDescription: "",
            defectiveDate: null,
          },
      }).unwrap();
      toast.success("Mahsulot muvaffaqiyatli yangilandi");
      setIsModalOpen(false);
      form.resetFields();
      setSelectedProduct(null);
    } catch (error) {
      toast.error(error.data?.message || "Mahsulotni yangilashda xatolik yuz berdi");
    }
  };

  const today = new Date();
  const defaultStart = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.01`;
  const defaultEnd = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const handleStartChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndChange = (e) => {
    setEndDate(e.target.value);
  };
  const tabBarExtraContent = (
    <div className="month-filter-container">
      <input
        type="text"
        value={startDate}
        onChange={handleStartChange}
        placeholder="YYYY.MM.DD"
        className="month-filter-input"
      />
      <span style={{ margin: "8px 5px 0  5px" }}>
        <FaArrowRightArrowLeft />
      </span>
      <input
        type="text"
        value={endDate}
        onChange={handleEndChange}
        placeholder="YYYY.MM.DD"
        className="month-filter-input"
      />
    </div>
  );

  return (
    <div className="production-system-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <CustomModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmDelete}
      />

      <Modal
        title="Mahsulotni Tahrirlash"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setSelectedProduct(null);
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleModalSubmit} layout="vertical">
          <Form.Item
            label="Miqdor"
            name="quantity"
            rules={[
              { required: true, message: "Iltimos, miqdorni kiriting" },
              { type: "number", min: 1, message: "Miqdor 1 dan kichik bo'lmasligi kerak" },
            ]}
          >
            <Input type="number" min="1" step="1" />
          </Form.Item>
          <Form.Item
            label="Tannarx (so'm)"
            name="productionCost"
            rules={[
              { required: true, message: "Iltimos, tannarxni kiriting" },
              { type: "number", min: 0, message: "Tannarx manfiy bo'lmasligi kerak" },
            ]}
          >
            <Input type="number" min="0" step="1000" />
          </Form.Item>
          <Form.Item name="isDefective" valuePropName="checked">
            <Checkbox onChange={(e) => setIsDefective(e.target.checked)}>
              Brak mahsulot
            </Checkbox>
          </Form.Item>
          {isDefective && (
            <>
              <Form.Item
                label="Brak sababi"
                name="defectiveReason"
                rules={[{ required: true, message: "Iltimos, brak sababini kiriting" }]}
              >
                <Input placeholder="Sababni kiriting" />
              </Form.Item>
              <Form.Item label="Brak tavsifi" name="defectiveDescription">
                <Input.TextArea placeholder="Tavsifni kiriting" rows={4} />
              </Form.Item>
            </>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateLoading}>
              Saqlash
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Tabs
        className="custom-tabs"
        defaultActiveKey={activeTab}
        activeKey={activeTab}
        onChange={setActiveTab}
      >
        {role !== "direktor" && (
          <TabPane
            tab={
              <span style={{ display: "flex", alignItems: "center" }}>
                <Factory size={20} style={{ marginRight: 8 }} />
                Ruberoid va Polizol Ishlab Chiqarish
              </span>
            }
            key="production"
          >
            <RuberoidPolizolProduction />
          </TabPane>
        )}
        {role !== "direktor" && (
          <TabPane
            tab={
              <span style={{ display: "flex", alignItems: "center" }}>
                <GiOilDrum size={20} style={{ marginRight: 8 }} />
                BN-5 Ishlab Chiqarish
              </span>
            }
            key="bitum"
          >
            <BitumProductionSystem />
          </TabPane>
        )}
        {role !== "direktor" && (
          <TabPane
            tab={
              <span style={{ display: "flex", alignItems: "center" }}>
                <GiOilDrum size={20} style={{ marginRight: 8 }} />
                Praymer va Mastika ishlab chiqarish
              </span>
            }
            key="bipro"
          >
            <BiproPraymer />
          </TabPane>
        )}
        <TabPane
          tab={
            <span style={{ display: "flex", alignItems: "center" }}>
              <Archive size={20} style={{ marginRight: 8 }} />
              Tayyor Mahsulotlar
            </span>
          }
          key="finished"
        >
          <StockInventory />
        </TabPane>
        <TabPane
          tab={
            <span style={{ display: "flex", alignItems: "center" }}>
              <History size={20} style={{ marginRight: 8 }} />
              Tarix
            </span>
          }
          key="history"
        >
          <Tabs
            tabBarExtraContent={tabBarExtraContent}
            defaultActiveKey="productionrb"
            className="custom-tabs"
          >
            <TabPane
              tab={
                <span style={{ display: "flex", alignItems: "center" }}>
                  <Factory size={20} style={{ marginRight: 8 }} />
                  Ruberoid va Polizol Ishlab Chiqarish Tarixi
                </span>
              }
              key="productionrb"
            >
              <div className="history-card">
                <ProductionHistoryTable startDate={startDate} endDate={endDate} />
              </div>
            </TabPane>
            <TabPane
              tab={
                <span style={{ display: "flex", alignItems: "center" }}>
                  <Factory size={20} style={{ marginRight: 8 }} />
                  BN-5 Ishlab Chiqarish Tarixi
                </span>
              }
              key="productionbn"
            >
              <InventoryTable startDate={startDate} endDate={endDate} />
            </TabPane>
            <TabPane
              tab={
                <span style={{ display: "flex", alignItems: "center" }}>
                  <Factory size={20} style={{ marginRight: 8 }} />
                  Praymer Ishlab Chiqarish Tarixi
                </span>
              }
              key="praymerbn"
            >
              <ProductionTable startDate={startDate} endDate={endDate} />
            </TabPane>
          </Tabs>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ProductionSystem;


