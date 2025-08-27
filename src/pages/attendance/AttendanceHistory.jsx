import React, { useState, useMemo } from "react";
import { useGetAllAttendanceQuery } from "../../context/attendanceApi";
import { Spin, Modal, Table, Button, Select } from "antd";
import moment from "moment";
import { skipToken } from "@reduxjs/toolkit/query";
import './style.css';

function AttendanceHistory() {
  const [dateRange, setDateRange] = useState([
    moment().startOf("month"),
    moment().endOf("month"),
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dateFilter, setDateFilter] = useState('full'); // 'full', 'firstHalf', 'secondHalf'
  const [selectedUnit, setSelectedUnit] = useState(null);

  const validRange = dateRange && dateRange[0] && dateRange[1];
  const { data, isLoading } = useGetAllAttendanceQuery(
    validRange
      ? {
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
      }
      : skipToken
  );

  const dateHeaders = useMemo(() => {
    if (!validRange) return [];
    const dates = [];
    let start = moment(dateRange[0]);
    let end = moment(dateRange[1]);

    if (dateFilter === 'firstHalf') {
      end = moment(start).date(15);
    } else if (dateFilter === 'secondHalf') {
      start = moment(start).date(15);
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
    if (!data) return [];
    const units = new Set(data.map((record) => record.unit).filter(Boolean));
    return Array.from(units).map((unit) => ({
      value: unit,
      label: unit,
    }));
  }, [data]);

  const processedData = useMemo(() => {
    if (!data || !validRange) return [];

    const employeeMap = {};

    data.forEach((record) => {
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
          totalShifts: 0, // Umumiy smenalar uchun yangi xususiyat
          presentDays: 0,
          percentage: 0,
        };
      }

      employeeMap[employeeId].attendance[date] = record;
      employeeMap[employeeId].presentDays += 1;
      // Har bir sanaga mos percentage ni qo'shish
      employeeMap[employeeId].totalShifts += record.percentage || 0;
    });

    Object.values(employeeMap).forEach((employee) => {
      employee.percentage = employee.presentDays > 0
        ? Math.round((employee.presentDays / dateHeaders.length) * 100)
        : 0;
    });

    return Object.values(employeeMap);
  }, [data, dateHeaders, validRange, dateFilter, selectedUnit]);

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
    } else {
      setDateRange([moment().startOf("month"), moment().endOf("month")]);
    }
  };

  const handleUnitChange = (value) => {
    setSelectedUnit(value);
  };

  const handleResetFilter = () => {
    if (dateFilter !== 'full') {
      setDateFilter('full');
    }
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

  return (
    <div className="xsd-attendance-history-container">
      <div className="xsd-attendance-header">
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
            className="xsd-unit-picker"
            showSearch
            optionFilterProp="label"
            style={{ width: 150 }}
          />
          {validRange && (
            <div className="xsd-date-filter-buttons">
              <Button
                type={dateFilter === 'firstHalf' ? 'primary' : 'default'}
                onClick={() => setDateFilter('firstHalf')}
              >
                1-15
              </Button>
              <Button
                type={dateFilter === 'secondHalf' ? 'primary' : 'default'}
                onClick={() => setDateFilter('secondHalf')}
              >
                15-{moment(dateRange[1]).format('DD')}
              </Button>
              <Button
                onClick={handleResetFilter}
                disabled={dateFilter === 'full'}
              >
                X
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="xsd-attendance-table-wrapper">
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
              </tr>
            ))}
          </tbody>
        </table>

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