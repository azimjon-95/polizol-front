import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  useMarkAttendanceMutation,
  useGetAllAttendanceQuery,
  useDeleteAttendanceMutation,
} from "../../context/attendanceApi";
import { BsCheck2Circle } from "react-icons/bs";
import { useGetProductionEmployeesQuery } from "../../context/workersApi";
import { capitalizeFirstLetter } from "../../hook/CapitalizeFirstLitter";
import {
  Button,
  Card,
  Select,
  Table,
  Spin,
  Tabs,
  Input,
  Popconfirm,
  Checkbox,
} from "antd";
import { toast, ToastContainer } from "react-toastify";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import AttendanceHistory from "./AttendanceHistory";
import DailyWorkers from "./DailyWorkers";

const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

const PERCENTAGE_OPTIONS = {
  transport: [{ value: 0.33, label: "33%" }],
  Okisleniya: [
    { value: 0.33, label: "33%" },
    { value: 0.5, label: "50%" },
    { value: 0.75, label: "75%" },
    { value: 1, label: "100%" },
  ],
  default: [
    { value: 0.33, label: "33%" },
    { value: 0.5, label: "50%" },
    { value: 0.75, label: "75%" },
    { value: 1, label: "100%" },
    { value: 1.5, label: "1.5 kun" },
    { value: 2, label: "2 kun" },
  ],
};

const DEPARTMENT_OPTIONS = [
  { value: "polizol", label: "Polizol" },
  { value: "rubiroid", label: "Rubiroid" },
  { value: "Okisleniya", label: "Okisleniya" },
];
const LOCATION_ROLES = [
  "polizol ish boshqaruvchi",
  "Okisleniya ish boshqaruvchi",
  "rubiroid ish boshqaruvchi",
];

function Attendance() {
  const [attendanceData, setAttendanceData] = useState({});
  const [markedToday, setMarkedToday] = useState({});
  const [filterUnit, setFilterUnit] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [loadingStates, setLoadingStates] = useState({}); // New state for button-specific loading
  const [markAttendance] = useMarkAttendanceMutation();
  const [deleteAttendance] = useDeleteAttendanceMutation();
  const { data: workers, isLoading: isWorkersLoading } =
    useGetProductionEmployeesQuery();
  const role = localStorage.getItem("role");
  const isLocationRole = role && LOCATION_ROLES.includes(role);
  const navigate = useNavigate();

  const { data: existingRecords, refetch } = useGetAllAttendanceQuery({
    startDate: selectedDate,
    endDate: selectedDate,
  });

  useEffect(() => {
    if (existingRecords) {
      const newMarkedToday = {};
      const newAttendanceData = {};
      existingRecords.forEach((r) => {
        const key = r.department
          ? `${r.employee._id}_${r.department}`
          : r.employee._id;
        newMarkedToday[key] = true;
        newAttendanceData[key] = {
          department: r.department,
          percentage: r.percentage,
          attendanceId: r._id,
          cleaning: r.cleaning,
        };
      });
      setMarkedToday(newMarkedToday);
      setAttendanceData((prev) => ({ ...newAttendanceData, ...prev }));
    }
  }, [existingRecords]);

  useEffect(() => {
    setAttendanceData({});
    setLoadingStates({}); // Reset loading states when filterUnit or selectedDate changes
  }, [filterUnit, selectedDate]);

  const handleChange = useCallback((key, field, value) => {
    setAttendanceData((prev) => {
      if (!value && field !== "cleaning") {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: { ...prev[key], [field]: value },
      };
    });
  }, []);

  const handleDateChange = useCallback((e) => {
    const formattedDate = e.target.value || dayjs().format("YYYY-MM-DD");
    setSelectedDate(formattedDate);
  }, []);

  const handleSave = useCallback(
    async (employeeId, department) => {
      const key = department ? `${employeeId}_${department}` : employeeId;
      const record = attendanceData[key];
      if (!record?.percentage) {
        toast.warning("Foiz tanlanmagan", { autoClose: 3000 });
        return;
      }

      setLoadingStates((prev) => ({ ...prev, [`save_${key}`]: true }));
      try {
        await markAttendance({
          employeeId,
          date: selectedDate,
          percentage: record.percentage,
          department: department ?? record.department ?? filterUnit,
          cleaning: record.cleaning,
        }).unwrap();
        refetch();

        toast.success("Davomat saqlandi", { autoClose: 3000 });
        setMarkedToday((prev) => ({ ...prev, [key]: true }));
      } catch (err) {
        toast.error(err?.data?.message || "Xatolik yuz berdi");
      } finally {
        setLoadingStates((prev) => {
          const { [`save_${key}`]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [attendanceData, filterUnit, markAttendance, selectedDate]
  );

  const handleDelete = useCallback(
    async (employeeId, department) => {
      const existingRecord = existingRecords?.find(
        (r) => r.employee._id === employeeId
      );

      if (!existingRecord) {
        toast.warning("O‘chirish uchun davomat topilmadi", { autoClose: 3000 });
        return;
      }

      setLoadingStates((prev) => ({ ...prev, [employeeId]: true }));
      try {
        await deleteAttendance({
          attendanceId: existingRecord._id,
          unit: department ?? existingRecord.department ?? filterUnit,
        }).unwrap();
        refetch();
        toast.success("Davomat o‘chirildi", { autoClose: 3000 });
      } catch (err) {
        console.error(err);
        toast.error(err?.data?.message || "O‘chirishda xatolik yuz berdi", {
          autoClose: 3000,
        });
      } finally {
        setLoadingStates((prev) => {
          const { [employeeId]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [attendanceData, deleteAttendance, filterUnit, existingRecords]
  );

  const filteredWorkers = useMemo(() => {
    if (!workers?.innerData) return [];
    return workers.innerData
      .filter(
        (w) =>
          filterUnit === "all" ||
          w.unit?.toLowerCase().includes(filterUnit?.toLowerCase())
      )
      .filter((w) => {
        if (!searchTerm.trim()) return true;
        const fio = [w.firstName, w.lastName, w.middleName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return fio.includes(searchTerm.trim().toLowerCase());
      });
  }, [workers, filterUnit, searchTerm]);

  const renderAvtoKaraSelect = useCallback(
    (record, department) => {
      const existingForEmployee = existingRecords?.filter(
        (i) => i.employee._id === record._id
      );
      const existingRecordForUnit = existingForEmployee?.find(
        (i) => i.unit === department
      );
      const key = `${record._id}_${department}`;
      const isDisabled =
        Boolean(existingRecordForUnit) || loadingStates[`delete_${key}`];

      return (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Select
            placeholder="Foiz tanlang"
            style={{ width: 120 }}
            value={
              existingRecordForUnit?.percentage ??
              attendanceData[key]?.percentage
            }
            onChange={(value) => handleChange(key, "percentage", value)}
            disabled={isDisabled}
            allowClear
            size="small"
          >
            {PERCENTAGE_OPTIONS.default.map((opt, i) => (
              <Option key={i} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </div>
      );
    },
    [attendanceData, handleChange, existingRecords, loadingStates]
  );

  const renderAvtoKaraActions = useCallback(
    (record, department) => {
      const existingForEmployee = existingRecords?.filter(
        (i) => i.employee?._id === record._id
      );
      const existingRecordForUnit = existingForEmployee?.find(
        (i) => i.unit === department
      );
      const key = `${record._id}_${department}`;
      const isMarked = Boolean(existingRecordForUnit);

      return (
        <div style={{ display: "flex", gap: 8, alignItems: "Lean" }}>
          {isMarked ? (
            <BsCheck2Circle style={{ color: "green", fontSize: "20px" }} />
          ) : (
            <Button
              type="primary"
              onClick={() => handleSave(record._id, department)}
              loading={loadingStates[`save_${key}`]}
              disabled={loadingStates[`delete_${key}`]}
              size="small"
            >
              Saqlash
            </Button>
          )}
        </div>
      );
    },
    [handleSave, loadingStates, existingRecords]
  );

  const renderAvtoKaraDelete = useCallback(
    (record, department) => {
      const existingForEmployee = existingRecords?.filter(
        (i) => i.employee._id === record._id
      );
      const existingRecordForUnit = existingForEmployee?.find(
        (i) => i.unit === department
      );
      const key = `${record._id}_${department}`;
      const isMarked = Boolean(existingRecordForUnit);

      return isMarked && !isLocationRole ? (
        <Popconfirm
          title={`${
            DEPARTMENT_OPTIONS.find((opt) => opt.value === department)?.label
          } bo‘limi davomatini o‘chirishni xohlaysizmi?`}
          onConfirm={() => handleDelete(record._id, department)}
          okText="Ha"
          cancelText="Yo‘q"
          disabled={
            loadingStates[`save_${key}`] || loadingStates[`delete_${key}`]
          }
        >
          <Button
            type="primary"
            danger
            loading={loadingStates[`delete_${key}`]}
            disabled={loadingStates[`save_${key}`]}
          >
            O‘chirish
          </Button>
        </Popconfirm>
      ) : (
        <i style={{ fontSize: "13px", color: "grey" }}>Mavjud emas</i>
      );
    },
    [handleDelete, loadingStates, existingRecords, isLocationRole]
  );

  const baseColumns = useMemo(
    () => [
      {
        title: "Ism",
        dataIndex: "firstName",
        render: (_, record) =>
          `${capitalizeFirstLetter(record.firstName)} ${record.lastName}`,
      },
      {
        title: "Bo'limi",
        dataIndex: "unit",
        render: (_, record) => capitalizeFirstLetter(record.unit),
      },
      {
        title: "Davomat %",
        render: (_, record) => {
          if (record.unit?.toLowerCase() === "avto kara") {
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {DEPARTMENT_OPTIONS.map((dept) =>
                  renderAvtoKaraSelect(record, dept.value)
                )}
              </div>
            );
          }

          const isTransport = record.unit === "transport";
          const isOkisleniya = record.unit === "Okisleniya";
          const isDisabled =
            (!isTransport && markedToday[record._id]) ||
            loadingStates[`delete_${record._id}`];
          const options = isTransport
            ? PERCENTAGE_OPTIONS.transport
            : isOkisleniya
            ? PERCENTAGE_OPTIONS.Okisleniya
            : PERCENTAGE_OPTIONS.default;

          return (
            <Select
              placeholder="Foiz tanlang"
              style={{ width: 120 }}
              value={attendanceData[record._id]?.percentage}
              onChange={(value) =>
                handleChange(record._id, "percentage", value)
              }
              disabled={isDisabled}
              allowClear
              size="small"
            >
              {options.map((opt, index) => (
                <Option key={index} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          );
        },
      },
      {
        title: "Shanbalik",
        render: (_, record) => {
          const isDisabled =
            markedToday[record._id] || loadingStates[`delete_${record._id}`];
          return (
            <Checkbox
              checked={attendanceData[record._id]?.cleaning ?? false}
              onChange={(e) =>
                handleChange(record._id, "cleaning", e.target.checked)
              }
              disabled={isDisabled}
            />
          );
        },
      },
      {
        title: "Saqlash",
        render: (_, record) => {
          if (record.unit?.toLowerCase() === "avto kara") {
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {DEPARTMENT_OPTIONS.map((dept) =>
                  renderAvtoKaraActions(record, dept.value)
                )}
              </div>
            );
          }

          const isDisabled =
            (record.unit !== "transport" && markedToday[record._id]) ||
            loadingStates[`delete_${record._id}`];

          return (
            <div style={{ display: "flex", gap: 8 }}>
              {markedToday[record._id] ? (
                <BsCheck2Circle style={{ color: "green", fontSize: "25px" }} />
              ) : (
                <Button
                  type="primary"
                  onClick={() => handleSave(record._id)}
                  loading={loadingStates[`save_${record._id}`]}
                  disabled={isDisabled}
                  size="small"
                >
                  Saqlash
                </Button>
              )}
            </div>
          );
        },
      },
      ...(isLocationRole
        ? []
        : [
            {
              title: "O‘chirish",
              render: (i, record) => {
                if (record.unit?.toLowerCase() === "avto kara") {
                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {DEPARTMENT_OPTIONS.map((dept) =>
                        renderAvtoKaraDelete(record, dept.value)
                      )}
                    </div>
                  );
                }

                return markedToday[record._id] ? (
                  <Popconfirm
                    title="Davomatni o‘chirishni xohlaysizmi?"
                    onConfirm={() => handleDelete(record._id, "")}
                    okText="Ha"
                    cancelText="Yo‘q"
                    disabled={
                      loadingStates[`save_${record._id}`] ||
                      loadingStates[`delete_${record._id}`]
                    }
                  >
                    <Button
                      type="primary"
                      danger
                      size="small"
                      loading={loadingStates[`delete_${record._id}`]}
                      disabled={loadingStates[`save_${record._id}`]}
                    >
                      O‘chirish
                    </Button>
                  </Popconfirm>
                ) : (
                  <i style={{ fontSize: "13px", color: "grey" }}>Mavjud emas</i>
                );
              },
            },
          ]),
    ],
    [
      attendanceData,
      handleChange,
      handleSave,
      handleDelete,
      loadingStates,
      markedToday,
      isLocationRole,
      existingRecords,
      renderAvtoKaraSelect,
      renderAvtoKaraActions,
      renderAvtoKaraDelete,
    ]
  );

  const departmentColumn = useMemo(
    () => ({
      title: "Boshqa bo‘limga yo'naltrish",
      render: (_, record) => {
        if (record.unit?.toLowerCase() === "avto kara") {
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {DEPARTMENT_OPTIONS.map((dept, index) => (
                <span key={index} style={{ color: "gray" }}>
                  {dept.label}
                </span>
              ))}
            </div>
          );
        }

        // Find the existing record for this employee on the selected date
        const existingRecord = existingRecords?.find(
          (r) => r.employee._id === record._id && r.date === selectedDate
        );

        // Prioritize department from server (existingRecords), then attendanceData, then filterUnit
        const defaultDepartment =
          existingRecord?.department ??
          (filterUnit !== "all" &&
          DEPARTMENT_OPTIONS.some((opt) => opt.value === filterUnit)
            ? filterUnit
            : attendanceData[record._id]?.department);

        const isDisabled =
          (record.unit !== "transport" && markedToday[record._id]) ||
          loadingStates[`delete_${record._id}`];

        return (
          <Select
            placeholder="Bo‘lim tanlang"
            style={{ width: 180 }}
            value={defaultDepartment}
            onChange={(value) => handleChange(record._id, "department", value)}
            disabled={isDisabled}
            allowClear
            size="small"
          >
            {DEPARTMENT_OPTIONS.map((opt, i) => (
              <Option key={i} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );
      },
    }),
    [
      attendanceData,
      filterUnit,
      handleChange,
      markedToday,
      loadingStates,
      existingRecords,
      selectedDate,
    ]
  );
  const columns = useMemo(
    () =>
      filterUnit === "all"
        ? [
            ...baseColumns.slice(0, 2),
            departmentColumn,
            ...baseColumns.slice(2),
          ]
        : baseColumns,
    [baseColumns, departmentColumn, filterUnit]
  );

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Tizimdan chiqildi", { autoClose: 2000 });
    navigate("/login");
  };

  if (isWorkersLoading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );

  return (
    <div style={{ padding: "0rem 1rem" }} className="atend-boxx">
      <ToastContainer />
      <Tabs
        defaultActiveKey="1"
        tabBarExtraContent={
          isLocationRole && (
            <Button type="primary" onClick={handleLogout}>
              Tizimdan chiqish
            </Button>
          )
        }
      >
        <TabPane tab="Davomat" key="1">
          {/* <div> */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span>Bugungi davomat</span>
            <div style={{ display: "flex", gap: 8 }}>
              {!isLocationRole && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  style={{
                    width: "150px",
                    padding: "3.1px 11px",
                    border: "1px solid #d9d9d9",
                    fontSize: "14px",
                    borderRadius: "6px",
                    lineHeight: "1.5715",
                    outline: "none",
                    transition: "border-color 0.3s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#40a9ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#d9d9d9")}
                />
              )}
              <Search
                placeholder="Qidiruv"
                style={{ width: 200 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                enterButton
              />
              <Select
                style={{ width: 150 }}
                value={filterUnit}
                onChange={setFilterUnit}
              >
                <Option value="all">Barchasi</Option>
                {DEPARTMENT_OPTIONS.map((opt, i) => (
                  <Option key={i} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
          <div className="att-boxin">
            <Table
              rowKey={(record, index) => record._id || index}
              dataSource={filteredWorkers}
              columns={columns}
              pagination={false}
              size="small"
              bordered
            />
          </div>
          {/* </div> */}
        </TabPane>
        {!isLocationRole && (
          <TabPane tab="Kunlik xodimlar" key="3">
            <DailyWorkers />
          </TabPane>
        )}
        <TabPane tab="Davomat tarixi" key="2">
          <AttendanceHistory />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default Attendance;
