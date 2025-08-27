import React from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import "./Salary.css";

function Salary({ data }) {
  // UTC kunlar
  const today = dayjs().utc();
  const startOfMonth = today.startOf("month");
  const totalDays = startOfMonth.daysInMonth();
  const daysOfMonth = Array.from({ length: totalDays }, (_, i) =>
    startOfMonth.add(i, "day").format("YYYY-MM-DD")
  );

  // Mapping
  const productionMap = {};
  const employeeMap = {};

  data?.forEach((record) => {
    // const dateKey = dayjs(record.date).utc().format("YYYY-MM-DD");
    const dateKey = dayjs(record.date).tz("Asia/Tashkent").format("YYYY-MM-DD");

    if (!productionMap[dateKey]) {
      productionMap[dateKey] = { produced: 0, loaded: 0 };
    }
    productionMap[dateKey].produced += record.producedCount;
    productionMap[dateKey].loaded += record.loadedCount;

    record.workers.forEach((worker) => {
      const fio = `${worker.employee?.lastName} ${worker.employee?.firstName}`;
      const position = worker?.employee?.unit || "N/A";

      if (!employeeMap[fio]) {
        employeeMap[fio] = { position, days: {} };
      }
      employeeMap[fio].position = position; // har ehtimolga
      employeeMap[fio].days[dateKey] =
        (employeeMap[fio].days[dateKey] || 0) + worker.amount;
    });
  });

  let totalProduced =
    data?.reduce((sum, record) => sum + record.producedCount, 0) || 0;

  let totalLoaded =
    data?.reduce((sum, record) => sum + record.loadedCount, 0) || 0;

  let totalSum = data?.reduce((sum, record) => sum + record.totalSum, 0) || 0;

  return (
    <div className="salary-card">
      <table border={1}>
        <thead>
          <tr>
            <th rowSpan={3}>№</th>
            <th rowSpan={3}>Ism Familiya</th>
            {/* <th rowSpan={3}>Lavozim</th> */}
            <th>Ishlab chiqarish</th>
            {daysOfMonth.map((day) => (
              <th key={`prod-${day}`}>{productionMap[day]?.produced || ""}</th>
            ))}
            <th rowSpan={3}>Jami hisoblandi</th>
          </tr>
          <tr>
            <th>Sotuv</th>
            {daysOfMonth.map((day) => (
              <th key={`load-${day}`}>{productionMap[day]?.loaded || ""}</th>
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
                {/* {daysOfMonth.map((day) => (
                  <td key={`amount-${fio}-${day}`}>
                    {empObj.days[day] ? empObj.days[day].toLocaleString() : ""}
                  </td>
                ))} */}
                {daysOfMonth.map((day) => {
                  // Osha kun uchun recordni topamiz
                  const record = data?.find(
                    (rec) =>
                      dayjs(rec.date)
                        .tz("Asia/Tashkent")
                        .format("YYYY-MM-DD") === day
                  );

                  // Agar recordda type: "cleaning" bo‘lsa, orange rang
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
              {totalProduced} ta - {(totalProduced * 2800)?.toLocaleString()}{" "}
              so'm
            </b>{" "}
          </p>
          <p>
            Jami sotuv chiqarish:{" "}
            <b>
              {totalLoaded} ta - {(totalLoaded * 400)?.toLocaleString()} so'm{" "}
            </b>{" "}
          </p>
          <p>
            Jami hisoblandi: <b>{totalSum.toLocaleString()} so'm</b>{" "}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Salary;
