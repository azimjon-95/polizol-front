import React, { useState, useMemo, useEffect, useRef } from "react";
import SignaturePad from "react-signature-canvas";
import { useGetAllAttendanceQuery } from "../../context/attendanceApi";
import { Spin, Modal, Table, Button, Select } from "antd";
import { useReactToPrint } from "react-to-print";
import {
  useGetAllEmployeesSalaryInfoQuery
} from "../../context/alarApi";
import moment from "moment";
import { skipToken } from "@reduxjs/toolkit/query";
import './style.css';

function AttendanceHistory() {
  const sigPad = useRef();
  const [dateRange, setDateRange] = useState([
    moment().startOf("month"),
    moment().endOf("month"),
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dateFilter, setDateFilter] = useState('full'); // 'full', 'firstHalf', 'secondHalf'
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showPrintButton, setShowPrintButton] = useState(false);
  const printRef = useRef(null); // Ref for printable content
  const [employees, setEmployees] = useState([]);

  // Oy va yilni dateRange[0] dan olamiz (startOf("month"))
  const selectedMonth = dateRange[0].month() + 1; // momentda month() 0 dan boshlanadi
  const selectedYear = dateRange[0].year();

  const {
    data: employeesData
  } = useGetAllEmployeesSalaryInfoQuery({
    month: selectedMonth.toString().padStart(2, "0"), // 04 format
    year: selectedYear.toString(), // 2001 format
  });
  const validRange = dateRange && dateRange[0] && dateRange[1];
  const { data, isLoading } = useGetAllAttendanceQuery(
    validRange
      ? {
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
      }
      : skipToken
  );

  const mergedData = useMemo(() => {
    if (!data || !employees) return [];

    return data.map((att) => {
      const emp = employees?.find((e) => e._id === att.employee._id);
      return {
        ...att,
        employee: {
          ...att.employee,
          salary: emp ? emp.salary : 0, // agar topilmasa 0
        },
      };
    });
  }, [data, employees]);

  console.log("mergedData", mergedData);

  useEffect(() => {
    if (employeesData) {
      const all = [
        ...(employeesData?.innerData?.monthly || []),
        ...(employeesData?.innerData?.daily || []),
      ];
      setEmployees(all);
    }
  }, [employeesData]);
  // react-to-print setup - TUZATILGAN VERSIYA
  const handlePrint = useReactToPrint({
    contentRef: printRef, // content o'rniga contentRef ishlatildi
    documentTitle: `Davomat ro'yxati - ${dateRange[0].format("MMMM YYYY")}`,
    pageStyle: `
      @page { 
        size: A3; 
        margin: 10mm; 
      }
    `,
    onAfterPrint: () => {
      console.log("Print muvaffaqiyatli yakunlandi");
    },
    onPrintError: (errorLocation, error) => {
      console.error("Print xatosi:", errorLocation, error);
    }
  });


  const dateHeaders = useMemo(() => {
    if (!validRange) return [];
    const dates = [];
    let start = moment(dateRange[0]);
    let end = moment(dateRange[1]);

    if (dateFilter === 'firstHalf') {
      end = moment(start).date(15);
    } else if (dateFilter === 'secondHalf') {
      start = moment(start).date(16); // 15 o'rniga 16 dan boshlash
      end = moment(end).endOf('month');
    }

    let current = moment(start);
    while (current.isSameOrBefore(end, 'day')) {
      dates.push(moment(current));
      current = current.add(1, 'day');
    }
    return dates;
  }, [dateRange, validRange, dateFilter]);

  const unitOptions = useMemo(() => {
    if (!mergedData) return [];
    const units = new Set(mergedData.map((record) => record.unit).filter(Boolean));
    return Array.from(units).map((unit) => ({
      value: unit,
      label: unit,
    }));
  }, [mergedData]);

  const processedData = useMemo(() => {
    if (!mergedData || !validRange) return [];

    const employeeMap = {};

    mergedData.forEach((record) => {
      const employeeId = record.employee?._id;
      const date = moment(record.date).format("YYYY-MM-DD");

      if (selectedUnit && record.unit !== selectedUnit) return;
      const recordDate = moment(record.date);
      if (dateFilter === 'firstHalf' && recordDate.date() > 15) return;
      if (dateFilter === 'secondHalf' && recordDate.date() <= 15) return;

      if (!employeeMap[employeeId]) {
        employeeMap[employeeId] = {
          id: employeeId,
          firstName: record.employee?.firstName,
          lastName: record.employee?.lastName,
          position: record.employee?.position,
          unit: record.unit,
          attendance: {},
          totalShifts: 0,
          presentDays: 0,
          percentage: 0,
        };
      }

      employeeMap[employeeId].attendance[date] = record;
      employeeMap[employeeId].presentDays += 1;
      employeeMap[employeeId].totalShifts += record.percentage || 0;
    });

    Object.values(employeeMap).forEach((employee) => {
      employee.percentage = employee.presentDays > 0
        ? Math.round((employee.presentDays / dateHeaders.length) * 100)
        : 0;
    });

    return Object.values(employeeMap);
  }, [mergedData, dateHeaders, validRange, dateFilter, selectedUnit]);

  const handleCellClick = (employee, date) => {
    const dateStr = date.format("YYYY-MM-DD");
    const attendance = employee.attendance[dateStr];
    if (attendance) {
      setSelectedEmployee(employee);
      setSelectedDate(dateStr);
      setModalOpen(true);
    }
  };

  const modalColumns = [
    { title: "Ma'lumot", dataIndex: "label", key: "label" },
    { title: "Qiymat", dataIndex: "value", key: "value" },
  ];

  const modalData = selectedEmployee && selectedDate ? [
    { label: "Ism", value: selectedEmployee.firstName },
    { label: "Familiya", value: selectedEmployee.lastName },
    { label: "Bo'lim", value: selectedEmployee.unit },
    { label: "Sana", value: selectedDate },
    {
      label: "Davomat",
      value: selectedEmployee.attendance[selectedDate]
        ? `${selectedEmployee.attendance[selectedDate].percentage}%`
        : "Ma'lumot yo'q",
    },
    { label: "Jami smena", value: selectedEmployee.totalShifts.toFixed(2) },
  ] : [];

  const uzbekMonths = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
  ];

  const yearMonthOptions = useMemo(() => {
    const options = [];
    const startYear = 2020;
    const endYear = moment().year();
    for (let year = startYear; year <= endYear; year++) {
      uzbekMonths.forEach((month, index) => {
        const monthIndex = index + 1;
        const value = `${year}-${monthIndex < 10 ? `0${monthIndex}` : monthIndex}`;
        options.push({
          value,
          label: `${month} ${year}`,
        });
      });
    }
    return options;
  }, []);

  const handleMonthChange = (value) => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      const startOfMonth = moment(`${year}-${month}-01`);
      const endOfMonth = moment(startOfMonth).endOf('month');
      setDateRange([startOfMonth, endOfMonth]);
      setDateFilter('full');
      setShowPrintButton(false);
    } else {
      setDateRange([moment().startOf("month"), moment().endOf("month")]);
      setShowPrintButton(false);
    }
  };

  const handleUnitChange = (value) => {
    setSelectedUnit(value);
  };

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    setShowPrintButton(true);
  };

  const handleResetFilter = () => {
    if (dateFilter !== 'full') {
      setDateFilter('full');
      setShowPrintButton(false);
    }
  };

  // Print tugmasini bosganda tekshirish
  const handlePrintClick = () => {
    if (!printRef.current) {
      console.error("Print ref topilmadi!");
      return;
    }

    if (processedData.length === 0) {
      console.warn("Print qilish uchun ma'lumot yo'q!");
      alert("Print qilish uchun ma'lumot yo'q!");
      return;
    }

    handlePrint();
  };

  const monthValue = dateRange[0] ? dateRange[0].format('YYYY-MM') : undefined;

  if (isLoading) return <div className="xsd-loading-container"><Spin size="large" /></div>;

  const weekdayMap = {
    Mo: "Du",
    Tu: "Se",
    We: "Ch",
    Th: "Pa",
    Fr: "Ju",
    Sa: "Sh",
    Su: "Ya",
  };


  const clear = () => {
    sigPad.current.clear();
  };

  const save = () => {
    const dataURL = sigPad.current.getTrimmedCanvas().toDataURL("image/png");
    console.log("Imzo PNG:", dataURL); // serverga yuborish mumkin
  };

  return (
    <div className="xsd-attendance-history-container">
      <div className="xsd-attendance-header no-print">
        <span className="xsd-subject-label">{monthValue} - Davomat ro'yxati</span>
        <div className="xsd-additional-info">
          <Select
            value={monthValue}
            onChange={handleMonthChange}
            options={yearMonthOptions}
            placeholder="Oy va yilni tanlang"
            allowClear
            className="xsd-date-picker"
            showSearch
            optionFilterProp="label"
            style={{ width: 150 }}
          />
          <Select
            value={selectedUnit}
            onChange={handleUnitChange}
            options={unitOptions}
            placeholder="Bo'limni tanlang"
            allowClear
            className="xsd-attendance-unit-picker"
            showSearch
            optionFilterProp="label"
            style={{ width: 150 }}
          />
          {validRange && (
            <div className="xsd-date-filter-buttons">
              <Button
                type={dateFilter === 'firstHalf' ? 'primary' : 'default'}
                onClick={() => handleDateFilterChange('firstHalf')}
              >
                1-15
              </Button>
              <Button
                type={dateFilter === 'secondHalf' ? 'primary' : 'default'}
                onClick={() => handleDateFilterChange('secondHalf')}
              >
                16-{moment(dateRange[1]).format('DD')}
              </Button>
              <Button
                onClick={handleResetFilter}
                disabled={dateFilter === 'full'}
              >
                ✕
              </Button>
              {showPrintButton && (
                <Button
                  type="primary"
                  onClick={handlePrintClick}
                  disabled={!processedData.length}
                >
                  🖨️ Chop etish
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="xsd-attendance-table-wrapper">
        <div className="print-header">
          <h2>
            {selectedUnit && `${selectedUnit} bo'limi - `}
            {monthValue} - Davomat ro'yxati
            {dateFilter !== 'full' && ` (${dateFilter === 'firstHalf' ? '1-15' : '16-' + moment(dateRange[1]).format('DD')})`}
          </h2>
        </div>

        {processedData.length > 0 ? (
          <table className="xsd-attendance-table">
            <thead>
              <tr className="xsd-table-header-row">
                <th className="xsd-table-header-cell xsd-student-number-header">№</th>
                <th className="xsd-table-header-cell xsd-student-name-header">To'liq ism</th>
                {dateHeaders.map((date, index) => (
                  <th key={index} className="xsd-table-header-cell xsd-date-header">
                    <div className="xsd-date-header-content">
                      <div className="xsd-date-day">{date.format('DD')}</div>
                      <div className="xsd-date-weekday">{weekdayMap[date.format("dd")]}</div>
                    </div>
                  </th>
                ))}
                <th className="xsd-table-header-cell xsd-stats-header">Jami smena</th>
                {showPrintButton && (
                  <th className="xsd-table-header-cell xsd-stats-header">Maosh</th>
                )}
                {showPrintButton && (
                  <th className="xsd-table-header-cell xsd-stats-header">Imzo</th>
                )}
              </tr>
            </thead>
            <tbody>
              {processedData.map((employee, index) => (
                <tr key={employee.id} className="xsd-table-body-row">
                  <td className="xsd-table-body-cell xsd-student-number-cell">
                    {index + 1}
                  </td>
                  <td className="xsd-table-body-cell xsd-student-name-cell">
                    {employee.firstName} {employee.lastName}
                  </td>
                  {dateHeaders.map((date, dateIndex) => {
                    const attendance = employee.attendance[date.format("YYYY-MM-DD")];
                    return (
                      <td
                        key={dateIndex}
                        className="xsd-table-body-cell"
                        onClick={() => handleCellClick(employee, date)}
                        style={{ cursor: attendance ? 'pointer' : 'default' }}
                      >
                        {attendance && (
                          <div className="xsd-attendance-badge">
                            {attendance.percentage}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="xsd-table-body-cell xsd-stats-cell">
                    {employee.totalShifts.toFixed(2)}
                  </td>
                  {showPrintButton && (
                    <td className="xsd-table-body-cell xsd-student-name-cell">
                      {employee.salary || 0}
                    </td>
                  )}
                  {showPrintButton && (
                    <td className="xsd-table-body-imzo xsd-stats-cell">
                      {showPrintButton && (
                        // <td className="xsd-table-body-imzo xsd-stats-cell">
                        <SignaturePad
                          ref={sigPad}
                          penColor="#000a73"        // chiziq rangi
                          minWidth={0.5}          // eng ingichka chiziq qalinligi
                          maxWidth={1.5}
                          canvasProps={{
                            width: "90px",
                            height: 30,
                            className: "sigCanvas",
                            style: {    // yumaloqlash // fon
                              cursor: "url('https://cdn-icons-png.flaticon.com/512/1827/1827951.png') 0 24, auto"
                            },
                          }}
                        />
                        // </td>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Ma'lumot topilmadi
          </div>
        )}
      </div>

      <Modal
        title={`${selectedDate} - Davomat ma'lumotlari`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
        className="xsd-attendance-modal"
      >
        <Table
          size="small"
          rowKey="label"
          columns={modalColumns}
          dataSource={modalData}
          pagination={false}
          className="xsd-modal-table"
        />
      </Modal>
    </div>
  );
}

export default AttendanceHistory;