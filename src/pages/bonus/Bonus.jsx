import React, { useMemo, useState, useEffect } from "react";
import {
  Table,
  Space,
  Button,
  Popconfirm,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Card,
  Typography,
  Tag,
  Avatar,
} from "antd";
import dayjs from "dayjs";
import {
  useDeleteBonusMutation,
  useUpdateBonusMutation,
} from "../../context/bonusApi";
import { toast, ToastContainer } from "react-toastify";
import {
  DeleteOutlined,
  EditOutlined,
  GiftOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TrophyOutlined,
  StarOutlined,
} from "@ant-design/icons";
import './style.css';

const { Title, Text } = Typography;
const monthFormat = "YYYY-MM";

function getEmployeeName(emp) {
  if (!emp) return "-";
  if (typeof emp === "string") return emp;
  const parts = [emp.lastName, emp.firstName, emp.middleName].filter(Boolean);
  return parts.join(" ") || emp._id || "-";
}

function getEmployeeInitials(emp) {
  if (!emp) return "?";
  if (typeof emp === "string") return emp.charAt(0).toUpperCase();
  const firstName = emp.firstName || "";
  const lastName = emp.lastName || "";
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
}

export default function Bonus({ data = [] }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [deleteBonus] = useDeleteBonusMutation();
  const [updateBonus] = useUpdateBonusMutation();

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        amount: editing.amount,
        period: dayjs(editing.period, monthFormat),
        description: editing.description || "",
      });
    } else {
      form.resetFields();
    }
  }, [editing, form]);

  const columns = useMemo(
    () => [
      {
        title: (
          <Space>
            <span className="bon-table-header-number">#</span>
          </Space>
        ),
        key: "index",
        width: 60,
        render: (_v, _r, i) => (
          <span className="bon-row-number">{i + 1}</span>
        ),
      },
      {
        title: (
          <Space>
            <UserOutlined className="bon-icon-header" />
            <span className="bon-table-header">Hodim</span>
          </Space>
        ),
        key: "employee",
        render: (_, record) => (
          <div className="bon-employee-cell">
            <Avatar
              className="bon-employee-avatar"
              size="small"
              icon={<UserOutlined />}
            >
              {getEmployeeInitials(record.employeeId)}
            </Avatar>
            <span className="bon-employee-name">
              {getEmployeeName(record.employeeId)}
            </span>
          </div>
        ),
      },
      {
        title: (
          <Space>
            <DollarOutlined className="bon-icon-header" />
            <span className="bon-table-header">Miqdori</span>
          </Space>
        ),
        dataIndex: "amount",
        key: "amount",
        render: (v) => (
          <Tag
            className="bon-amount-tag"
            color="success"
            icon={<GiftOutlined />}
          >
            {typeof v === "number" ? `${v.toLocaleString()} so'm` : v}
          </Tag>
        ),
      },
      {
        title: (
          <Space>
            <CalendarOutlined className="bon-icon-header" />
            <span className="bon-table-header">Oy uchun</span>
          </Space>
        ),
        dataIndex: "period",
        key: "period",
        render: (period) => (
          <div className="bon-period-cell">
            <CalendarOutlined className="bon-period-icon" />
            <span>{period}</span>
          </div>
        ),
      },
      {
        title: (
          <Space>
            <FileTextOutlined className="bon-icon-header" />
            <span className="bon-table-header">Izoh</span>
          </Space>
        ),
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (desc) => (
          <Text className="bon-description" ellipsis={{ tooltip: desc }}>
            {desc || "—"}
          </Text>
        ),
      },
      {
        title: (
          <Space>
            <span className="bon-table-header">Amallar</span>
          </Space>
        ),
        key: "actions",
        fixed: "right",
        width: 120,
        render: (_, record) => (
          <Space className="bon-actions-space">
            <Button
              onClick={() => {
                setEditing(record);
                setOpenEdit(true);
              }}
              className="bon-edit-btn"
              type="primary"
              size="small"
              icon={<EditOutlined />}
            />
            <Popconfirm
              title={
                <div className="bon-confirm-title">
                  <DeleteOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                  O'chirishni tasdiqlaysizmi?
                </div>
              }
              okText="Ha"
              cancelText="Yo'q"
              okButtonProps={{ className: "bon-confirm-ok" }}
              cancelButtonProps={{ className: "bon-confirm-cancel" }}
              onConfirm={() => handleDelete(record._id)}
            >
              <Button
                className="bon-delete-btn"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  // Handle delete action
  const handleDelete = async (id) => {
    try {
      await deleteBonus(id).unwrap();
      toast.success("🎉 Muvaffaqiyatli o'chirildi!");
    } catch (e) {
      toast.error(`❌ Xatolik: ${e?.data.message || "O'chirishda xatolik"}`);
    }
  };

  const onEditFinish = async (values) => {
    if (!editing?._id) return;

    const payload = {
      amount: Number(values.amount),
      period: values.period?.format(monthFormat),
      description: values.description || "",
    };

    try {
      await updateBonus({ id: editing?._id, data: payload });
      toast.success("✅ Muvaffaqiyatli yangilandi!");
      setOpenEdit(false);
      setEditing(null);
    } catch (e) {
      toast.error(`❌ Xatolik: ${e?.message || "Yangilashda xatolik"}`);
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card className="bon-empty-card">
        <div className="bon-empty-content">
          <TrophyOutlined className="bon-empty-icon" />
          <Title level={4} className="bon-empty-title">
            Bonus ma'lumotlari topilmadi
          </Title>
          <Text className="bon-empty-text">
            Hozircha hech qanday bonus ma'lumotlari mavjud emas
          </Text>
        </div>
      </Card>
    );
  }

  const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="bon-container">
      <ToastContainer
        position="top-right"
        className="bon-toast-container"
      />

      <Card className="bon-main-card">
        <div className="bon-header">
          <div className="bon-header-left">
            <GiftOutlined className="bon-header-icon" />
            <Title level={3} className="bon-header-title">
              Bonus va Rag'batlantirish Puli
            </Title>
          </div>
          <div className="bon-header-right">
            <div className="bon-stats">
              <div className="bon-stat-item">
                <StarOutlined className="bon-stat-icon" />
                <div className="bon-stat-content">
                  <Text className="bon-stat-label">Jami bonuslar</Text>
                  <Title level={4} className="bon-stat-value">
                    {data.length}
                  </Title>
                </div>
              </div>
              <div className="bon-stat-divider" />
              <div className="bon-stat-item">
                <DollarOutlined className="bon-stat-icon" />
                <div className="bon-stat-content">
                  <Text className="bon-stat-label">Jami miqdor</Text>
                  <Title level={4} className="bon-stat-value">
                    {totalAmount.toLocaleString()} so'm
                  </Title>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Table
          className="bon-table"
          rowKey="_id"
          columns={columns}
          dataSource={data}
          pagination={false}
          scroll={{ x: 900 }}
          size="small"
        />
      </Card>

      <Modal
        title={
          <div className="bon-modal-title">
            <EditOutlined className="bon-modal-icon" />
            <span>Bonusni tahrirlash</span>
          </div>
        }
        open={openEdit}
        onCancel={() => {
          setOpenEdit(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        destroyOnClose
        className="bon-modal"
        okText="Saqlash"
        cancelText="Bekor qilish"
        okButtonProps={{ className: "bon-modal-ok" }}
        cancelButtonProps={{ className: "bon-modal-cancel" }}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onEditFinish}
          className="bon-form"
        >
          <Form.Item
            name="amount"
            label={
              <span className="bon-form-label">
                <DollarOutlined className="bon-form-icon" />
                Miqdor (so'm)
              </span>
            }
            rules={[{ required: true, message: "Miqdorni kiriting" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              className="bon-form-input"
              placeholder="Bonus miqdorini kiriting"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="period"
            label={
              <span className="bon-form-label">
                <CalendarOutlined className="bon-form-icon" />
                Davr (oy/yil)
              </span>
            }
            rules={[{ required: true, message: "Oy tanlang" }]}
          >
            <DatePicker
              picker="month"
              style={{ width: "100%" }}
              className="bon-form-input"
              placeholder="Oy tanlang"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="bon-form-label">
                <FileTextOutlined className="bon-form-icon" />
                Izoh
              </span>
            }
          >
            <Input.TextArea
              rows={3}
              placeholder="Bonus haqida qo'shimcha ma'lumot (ixtiyoriy)"
              className="bon-form-textarea"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}