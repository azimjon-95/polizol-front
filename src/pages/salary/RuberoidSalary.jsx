import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Button } from "antd";

dayjs.extend(utc);
dayjs.extend(timezone);
import "./Salary.css";

function Salary({ data }) {
  console.log(data);

  const tableRef = useRef(); // Jadvalni olish uchun ref

  // Print funksiyasi
  const handlePrint = useReactToPrint({
    contentRef: tableRef,
    documentTitle: `Ruberoid_Salary_${dayjs().format("YYYY_MM_DD")}`,
    pageStyle: `
      @page { 
        size: A3; 
        margin: 10mm; 
      }
    `,
  });

  // // UTC kunlar
  // const today = dayjs().utc();
  // const startOfMonth = today.startOf("month");
  // const totalDays = startOfMonth.daysInMonth();
  // const daysOfMonth = Array.from({ length: totalDays }, (_, i) =>
  //   startOfMonth.add(i, "day").format("YYYY-MM-DD")
  // );

  const today = dayjs().utc();

  // Data mavjud bo'lsa, birinchi recorddan oyni olamiz
  const referenceDate =
    data && data.length > 0 ? dayjs(data[0].date).tz("Asia/Tashkent") : today;

  const startOfMonth = referenceDate.startOf("month");
  const totalDays = startOfMonth.daysInMonth();
  const daysOfMonth = Array.from({ length: totalDays }, (_, i) =>
    startOfMonth.add(i, "day").format("YYYY-MM-DD")
  );

  // Mapping
  const productionMap = {};
  const employeeMap = {};

  data?.forEach((record) => {
    const dateKey = dayjs(record.date).tz("Asia/Tashkent").format("YYYY-MM-DD");

    if (!productionMap[dateKey]) {
      productionMap[dateKey] = { produced: 0, loaded: 0, loadedKg: 0 };
    }
    productionMap[dateKey].produced += record.producedCount;
    productionMap[dateKey].loaded += record.loadedCount;
    productionMap[dateKey].loadedKg += record.loadedCountKg;

    record.workers.forEach((worker) => {
      const fio = `${worker.employee?.lastName} ${worker.employee?.firstName}`;
      const position = worker?.employee?.unit || "N/A";

      if (!employeeMap[fio]) {
        employeeMap[fio] = { position, days: {} };
      }
      employeeMap[fio].position = position; // har ehtimolga
      employeeMap[fio].days[dateKey] =
        (employeeMap[fio].days[dateKey] || 0) +
        worker.amount +
        worker.amountOfLoaded;
    });
  });

  let totalProduced =
    data?.reduce((sum, record) => sum + record.producedCount, 0) || 0;

  let totalLoaded =
    data?.reduce((sum, record) => sum + record.loadedCount, 0) || 0;

  let totalLoadedKg =
    data?.reduce((sum, record) => sum + record.loadedCountKg, 0) || 0;

  const totalWorkerAmount = data?.reduce((total, record) => {
    const workersTotal = record.workers.reduce(
      (sum, worker) => sum + worker.amount,
      0
    );
    return total + workersTotal;
  }, 0);

  const totalWorkerAmountOfLoaded = data?.reduce((total, record) => {
    const workersTotal = record.workers.reduce(
      (sum, worker) => sum + worker.amountOfLoaded,
      0
    );
    return total + workersTotal;
  }, 0);

  let totalSum = (totalWorkerAmount || 0) + (totalWorkerAmountOfLoaded || 0);

  return (
    <div>
      {/* Jadvalni o'rab olish */}
      <div ref={tableRef} className="salary-card">
        <div
          style={{
            display: "flex",
            padding: "10px 0",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3>Ruberoid-{dayjs().format("YYYY-MM")}</h3>
          <Button type="primary" onClick={handlePrint}>
            Yuklab olish
          </Button>
        </div>
        <table border={1}>
          <thead>
            <tr>
              <th rowSpan={4}>№</th>
              <th rowSpan={4}>Ism Familiya</th>
              <th>Ishlab chiqarish</th>
              {daysOfMonth.map((day) => (
                <th key={`prod-${day}`}>
                  {productionMap[day]?.produced || ""}
                </th>
              ))}
              <th rowSpan={4}>Jami hisoblandi</th>
            </tr>
            <tr>
              <th>Sotuv (dona)</th>
              {daysOfMonth.map((day) => (
                <th key={`load-${day}`}>{productionMap[day]?.loaded || ""}</th>
              ))}
            </tr>
            <tr>
              <th>Sotuv (kg)</th>
              {daysOfMonth.map((day) => (
                <th key={`load-${day}`}>
                  {productionMap[day]?.loadedKg || ""}
                </th>
              ))}
            </tr>
            <tr>
              <th>Sana</th>
              {daysOfMonth.map((day) => (
                <th key={`date-${day}`}>{day.slice(-2)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(employeeMap).map(([fio, empObj], idx) => {
              const total = daysOfMonth.reduce(
                (sum, day) => sum + (empObj.days[day] || 0),
                0
              );
              return (
                <tr key={fio}>
                  <td>{idx + 1}</td>
                  <td>{fio}</td>
                  <td>{empObj.position}</td>
                  {daysOfMonth.map((day) => {
                    const record = data?.find(
                      (rec) =>
                        dayjs(rec.date)
                          .tz("Asia/Tashkent")
                          .format("YYYY-MM-DD") === day
                    );

                    const isCleaning = record?.type === "cleaning";

                    return (
                      <td
                        key={`amount-${fio}-${day}`}
                        style={isCleaning ? { background: "orange" } : {}}
                      >
                        {empObj.days[day]
                          ? empObj.days[day].toLocaleString()
                          : ""}
                      </td>
                    );
                  })}
                  <td>{total ? total.toLocaleString() : ""}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={3}>Jami</th>
              {daysOfMonth.map((day) => {
                // Har bir kun uchun barcha ishchilarning summasini hisoblash
                const dayTotal = Object.values(employeeMap).reduce(
                  (sum, empObj) => sum + (empObj.days[day] || 0),
                  0
                );
                return (
                  <th key={`total-${day}`}>
                    {dayTotal ? dayTotal.toLocaleString() : ""}
                  </th>
                );
              })}
              <th>{totalSum.toLocaleString()}</th>
            </tr>
          </tfoot>
        </table>

        <div
          className="salary_header"
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "space-between",
            textAlign: "right",
          }}
        >
          <div className="salary_header_left"></div>
          <div className="salary_header_right">
            <p>
              Jami ishlab chiqarish:{" "}
              <b>
                {totalProduced} ta - {totalWorkerAmount?.toLocaleString()} so'm
              </b>{" "}
            </p>
            <p>
              Jami sotuv chiqarish(<b>dona</b>): <b>{totalLoaded}</b>{" "}
            </p>
            <p>
              Jami sotuv chiqarish(<b>kg</b>): <b>{totalLoadedKg}</b>{" "}
            </p>
            <p>
              Jami sotuv summasi:{" "}
              <b>{totalWorkerAmountOfLoaded?.toLocaleString()} so'm</b>{" "}
            </p>
            <p>
              Jami hisoblandi: <b>{totalSum.toLocaleString()} so'm</b>{" "}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Salary;
