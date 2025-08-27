import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useGetWorkersQuery } from "../../context/workersApi";
import { Button, Table, Input } from "antd";
import {
  useMarkAttendanceMutation,
  useGetAllAttendanceQuery,
  useDeleteAttendanceMutation,
} from "../../context/attendanceApi";
import dayjs from "dayjs";
const { Search } = Input;

import { toast } from "react-toastify";

function DailyWorkers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [attendanceData, setAttendanceData] = useState({}); // Ob'ekt shaklida saqlanadi

  const [markAttendance] = useMarkAttendanceMutation();
  const [deleteAttendance] = useDeleteAttendanceMutation();
  const { data } = useGetWorkersQuery();
  let workers = data?.innerData?.filter((i) => i.paymentType === "kunlik");

  const { data: attendances } = useGetAllAttendanceQuery({
    startDate: selectedDate,
    endDate: selectedDate,
  });

  // Davomat ma'lumotlarini tayyorlash
  useEffect(() => {
    if (attendances) {
      const newAttendanceData = {};
      attendances.forEach((r) => {
        newAttendanceData[r.employee._id] = {
          department: r.department,
          percentage: r.percentage,
          attendanceId: r._id,
        };
      });
      setAttendanceData(newAttendanceData);
    }
  }, [attendances]);

  const LOCATION_ROLES = [
    "polizol ish boshqaruvchi",
    "Okisleniya ish boshqaruvchi",
    "rubiroid ish boshqaruvchi",
  ];

  const role = localStorage.getItem("role");
  const isLocationRole = role && LOCATION_ROLES.includes(role);

  const handleDateChange = useCallback((e) => {
    const formattedDate = e.target.value || dayjs().format("YYYY-MM-DD");
    setSelectedDate(formattedDate);
  }, []);

  const handleSave = useCallback(
    async (employee) => {
      try {
        await markAttendance({
          employeeId: employee._id,
          date: selectedDate,
          percentage: 1,
          department: employee?.unit,
        }).unwrap();
        toast.success("Davomat saqlandi", { autoClose: 3000 });
      } catch (err) {
        console.error(err);
        toast.error(err?.data?.message || "Xatolik yuz berdi", {
          autoClose: 3000,
        });
      }
    },
    [attendanceData, selectedDate]
  );

  const columns = [
    {
      title: "Ism",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Otasining ismi",
      dataIndex: "middleName",
      key: "middleName",
    },
    {
      title: "Familiya",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Telefon raqami",
      dataIndex: "phone",
      key: "phone",
    },
    { title: "Bo'lim", dataIndex: "unit", key: "unit" },
    {
      title: "Belgilash",
      render: (_, record) => {
        const isMarked = Boolean(attendanceData[record._id]);
        return (
          <Button
            onClick={() => handleSave(record)}
            type="primary"
            disabled={isMarked}
          >
            {isMarked ? "Davomat qilingan" : "Belgilash"}
          </Button>
        );
      },
    },
    {
      title: "O'chirish",
      render: (_, record) => {
        const isMarked = Boolean(attendanceData[record._id]);
        return (
          <Button
            danger
            disabled={!isMarked}
            onClick={() => handleDelete(record)}
          >
            O'chirish
          </Button>
        );
      },
    },
  ];

  const handleDelete = useCallback(
    async (employeeId) => {
      const record = attendanceData[employeeId._id];

      if (!record) {
        toast.warning("O'chirish uchun davomat topilmadi", { autoClose: 3000 });
        return;
      }

      try {
        await deleteAttendance({
          attendanceId: record.attendanceId,
          unit: record.department,
        }).unwrap();
        toast.success("Davomat o'chirildi", { autoClose: 3000 });
      } catch (err) {
        console.error(err);
        toast.error(err?.data?.message || "O'chirishda xatolik yuz berdi", {
          autoClose: 3000,
        });
      }
    },
    [attendanceData, deleteAttendance]
  );

  const filteredWorkers = useMemo(() => {
    if (!workers?.length) return [];
    return workers.filter((w) => {
      if (!searchTerm.trim()) return true;
      const fio = [w.firstName, w.lastName, w.middleName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fio.includes(searchTerm.trim().toLowerCase());
    });
  }, [workers, searchTerm]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
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
                width: 150,
                padding: "3.1px 11px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                fontSize: 14,
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
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={filteredWorkers || []}
        rowKey={(record) => record._id}
        pagination={false}
        size="small"
        bordered
      />
    </div>
  );
}

export default DailyWorkers;
