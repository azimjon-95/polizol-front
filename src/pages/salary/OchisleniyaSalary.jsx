import React from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
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
    const dateKey = dayjs(record.date).utc().format("YYYY-MM-DD");

    if (!productionMap[dateKey]) {
      productionMap[dateKey] = { produced: 0, loaded: 0, btm_5_sale: 0 };
    }
    productionMap[dateKey].produced += record.btm_3;
    productionMap[dateKey].loaded += record.btm_5;
    productionMap[dateKey].btm_5_sale += record.btm_5_sale;

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

  let totalProduced = data?.reduce((sum, record) => sum + record.btm_3, 0) || 0;

  let totalLoaded = data?.reduce((sum, record) => sum + record.btm_5, 0) || 0;

  let totalbtm5forSale =
    data?.reduce((sum, record) => sum + record.btm_5_sale, 0) || 0;

  let totalSum = data?.reduce((sum, record) => sum + record.totalSum, 0) || 0;

  return (
    <div className="salary-card">
      <table border={1}>
        <thead>
          <tr>
            <th rowSpan={4}>№</th>
            <th rowSpan={4}>Ism Familiya</th>
            {/* <th rowSpan={3}>Lavozim</th> */}
            <th>BT-3</th>
            {daysOfMonth.map((day) => (
              <th key={`prod-${day}`}>{productionMap[day]?.produced || ""}</th>
            ))}
            <th rowSpan={3}>Jami hisoblandi</th>
          </tr>
          <tr>
            <th>BT-5 olindi</th>
            {daysOfMonth.map((day) => (
              <th key={`load-${day}`}>{productionMap[day]?.loaded || ""}</th>
            ))}
          </tr>
          <tr>
            <th>BT-5 sotuv u-n </th>
            {daysOfMonth.map((day) => (
              <th key={`load-${day}`}>
                {productionMap[day]?.btm_5_sale || ""}
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
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          textAlign: "right",
        }}
      >
        <div className="salary_header_left"></div>
        <div className="salary_header_right">
          <p>
            BT-3 qozonga:{" "}
            <b>
              {totalProduced} kg - {(totalProduced * 25)?.toLocaleString()} so'm
            </b>{" "}
          </p>
          <p>
            BT-5 olindi:{" "}
            <b>
              {totalLoaded} kg - {(totalLoaded * 70)?.toLocaleString()} so'm{" "}
            </b>{" "}
          </p>
          <p>
            BT-5 sotuv uchun:{" "}
            <b>
              {totalbtm5forSale} kg -{" "}
              {(totalbtm5forSale * 150)?.toLocaleString()} so'm{" "}
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
