// import React from "react";
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// dayjs.extend(utc);
// import "./Salary.css";
// import { useGetAllCategoriesQuery } from "../../context/categoryApi";

// function Salary({ data }) {
//   const { data: categories } = useGetAllCategoriesQuery();
//   const productsPrices = categories?.innerData || [];
//   const btm_3_price = productsPrices.find(
//     (item) => item.name === "BN-3"
//   )?.qozongaTashlash;

//   let btm_5_price = productsPrices.find(
//     (item) => item.name === "BN-5"
//   )?.productionCost;

//   let btm_5_mel_price = productsPrices.find(
//     (item) => item.name === "BN-5 + mel"
//   )?.productionCost;

//   // UTC kunlar
//   const today = dayjs().utc();
//   const startOfMonth = today.startOf("month");
//   const totalDays = startOfMonth.daysInMonth();
//   const daysOfMonth = Array.from({ length: totalDays }, (_, i) =>
//     startOfMonth.add(i, "day").format("YYYY-MM-DD")
//   );

//   // Mapping
//   const productionMap = {};
//   const employeeMap = {};

//   data?.forEach((record) => {
//     const dateKey = dayjs(record.date).utc().format("YYYY-MM-DD");

//     if (!productionMap[dateKey]) {
//       productionMap[dateKey] = {
//         produced: 0,
//         loaded: 0,
//         btm_5: 0,
//         btm_5_sale: 0,
//         loadedCountKg: 0,
//       };
//     }
//     productionMap[dateKey].produced += record.btm_3;
//     productionMap[dateKey].btm_5 += record.btm_5;
//     productionMap[dateKey].btm_5_sale += record.btm_5_sale;
//     productionMap[dateKey].loadedCountKg += record.loadedCountKg;
//     productionMap[dateKey].loaded += record.loaded || 0;

//     record.workers.forEach((worker) => {
//       const fio = `${worker.employee?.lastName} ${worker.employee?.firstName}`;
//       const position = worker?.employee?.unit || "N/A";

//       if (!employeeMap[fio]) {
//         employeeMap[fio] = { position, days: {} };
//       }
//       employeeMap[fio].position = position; // har ehtimolga
//       employeeMap[fio].days[dateKey] =
//         (employeeMap[fio].days[dateKey] || 0) +
//         worker.amount +
//         worker.amountOfLoaded;
//     });
//   });

//   let totalProduced = data?.reduce((sum, record) => sum + record.btm_3, 0) || 0;

//   let totalLoaded = data?.reduce((sum, record) => sum + record.btm_5, 0) || 0;

//   let totalbtm5forSale =
//     data?.reduce((sum, record) => sum + record.btm_5_sale, 0) || 0;

//   const totalWorkerAmount = data?.reduce((total, record) => {
//     const workersTotal = record.workers.reduce(
//       (sum, worker) => sum + worker.amount,
//       0
//     );
//     return total + workersTotal;
//   }, 0);

//   const totalWorkerAmountOfLoaded = data?.reduce((total, record) => {
//     const workersTotal = record.workers.reduce(
//       (sum, worker) => sum + worker.amountOfLoaded,
//       0
//     );
//     return total + workersTotal;
//   }, 0);

//   let totalSum = totalWorkerAmount + totalWorkerAmountOfLoaded || 0;

//   return (
//     <div className="salary-card">
//       <table border={1}>
//         <thead>
//           <tr>
//             <th rowSpan={6}>№</th>
//             <th rowSpan={6}>Ism Familiya</th>
//             {/* <th rowSpan={3}>Lavozim</th> */}
//             <th>BT-3</th>
//             {daysOfMonth.map((day) => (
//               <th key={`prod-${day}`}>{productionMap[day]?.produced || ""}</th>
//             ))}
//             <th rowSpan={6}>Jami hisoblandi</th>
//           </tr>
//           <tr>
//             <th>BT-5 olindi</th>
//             {daysOfMonth.map((day) => (
//               <th key={`load-${day}`}>{productionMap[day]?.btm_5 || ""}</th>
//             ))}
//           </tr>
//           <tr>
//             <th>BT-5 sotuv u-n </th>
//             {daysOfMonth.map((day) => (
//               <th key={`load-${day}`}>
//                 {productionMap[day]?.btm_5_sale || ""}
//               </th>
//             ))}
//           </tr>
//           <tr>
//             <th>sotuv (kg) </th>
//             {daysOfMonth.map((day) => (
//               <th key={`load-${day}`}>
//                 {productionMap[day]?.loadedCountKg || ""}
//               </th>
//             ))}
//           </tr>
//           <tr>
//             <th>sotuv (dona) </th>
//             {daysOfMonth.map((day) => (
//               <th key={`load-${day}`}>
//                 {productionMap[day]?.loadedCount || ""}
//               </th>
//             ))}
//           </tr>
//           <tr>
//             <th>Sana</th>
//             {daysOfMonth.map((day) => (
//               <th key={`date-${day}`}>{day.slice(-2)}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {Object.entries(employeeMap).map(([fio, empObj], idx) => {
//             const total = daysOfMonth.reduce(
//               (sum, day) => sum + (empObj.days[day] || 0),
//               0
//             );
//             return (
//               <tr key={fio}>
//                 <td>{idx + 1}</td>
//                 <td>{fio}</td>
//                 <td>{empObj.position}</td>
//                 {/* {daysOfMonth.map((day) => (
//                   <td key={`amount-${fio}-${day}`}>
//                     {empObj.days[day] ? empObj.days[day].toLocaleString() : ""}
//                   </td>
//                 ))} */}
//                 {daysOfMonth.map((day) => {
//                   // Osha kun uchun recordni topamiz
//                   const record = data?.find(
//                     (rec) =>
//                       dayjs(rec.date)
//                         .tz("Asia/Tashkent")
//                         .format("YYYY-MM-DD") === day
//                   );

//                   // Agar recordda type: "cleaning" bo‘lsa, orange rang
//                   const isCleaning = record?.type === "cleaning";

//                   return (
//                     <td
//                       key={`amount-${fio}-${day}`}
//                       style={isCleaning ? { background: "orange" } : {}}
//                     >
//                       {empObj.days[day]
//                         ? empObj.days[day].toLocaleString()
//                         : ""}
//                     </td>
//                   );
//                 })}
//                 <td>{total ? total.toLocaleString() : ""}</td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//       <div
//         className="salary_header"
//         style={{
//           marginBottom: "20px",
//           display: "flex",
//           justifyContent: "space-between",
//           textAlign: "right",
//         }}
//       >
//         <div className="salary_header_left"></div>
//         <div className="salary_header_right">
//           <p>
//             BT-3 qozonga:{" "}
//             <b>
//               {totalProduced} kg -{" "}
//               {(totalProduced * btm_3_price)?.toLocaleString()} so'm
//             </b>{" "}
//           </p>
//           <p>
//             BT-5 olindi:{" "}
//             <b>
//               {totalLoaded} kg - {(totalLoaded * btm_5_price)?.toLocaleString()}{" "}
//               so'm{" "}
//             </b>{" "}
//           </p>
//           <p>
//             BT-5 sotuv uchun:{" "}
//             <b>
//               {totalbtm5forSale} kg -{" "}
//               {(totalbtm5forSale * btm_5_mel_price)?.toLocaleString()} so'm{" "}
//             </b>{" "}
//           </p>
//           <p>
//             Jami ishlab chiqarish summasi:{" "}
//             <b>{totalWorkerAmount?.toLocaleString()} so'm</b>{" "}
//           </p>
//           <p>
//             Jami sotuv summasi:{" "}
//             <b>{totalWorkerAmountOfLoaded?.toLocaleString()} so'm</b>{" "}
//           </p>
//           <p>
//             Jami hisoblandi: <b>{totalSum.toLocaleString()} so'm</b>{" "}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Salary;

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "./Salary.css";
import { Button } from "antd";
import { useGetAllCategoriesQuery } from "../../context/categoryApi";

dayjs.extend(utc);
dayjs.extend(timezone);

function Salary({ data }) {
  const tableRef = useRef(); // Jadvalni olish uchun ref
  const { data: categories } = useGetAllCategoriesQuery();
  const productsPrices = categories?.innerData || [];
  const btm_3_price = productsPrices.find(
    (item) => item.name === "BN-3"
  )?.qozongaTashlash;

  let btm_5_price = productsPrices.find(
    (item) => item.name === "BN-5"
  )?.productionCost;

  let btm_5_mel_price = productsPrices.find(
    (item) => item.name === "BN-5 + mel"
  )?.productionCost;

  // UTC kunlar
  const today = dayjs().utc();
  const startOfMonth = today.startOf("month");
  const totalDays = startOfMonth.daysInMonth();
  const daysOfMonth = Array.from({ length: totalDays }, (_, i) =>
    startOfMonth.add(i, "day").format("YYYY-MM-DD")
  );

  // Print funksiyasi
  const handlePrint = useReactToPrint({
    contentRef: tableRef,
    documentTitle: `Ochisleniya_Salary_${dayjs().format("YYYY_MM_DD")}`,
    pageStyle: `
      @page { 
        size: A3; 
        margin: 10mm; 
      }
    `,
  });

  // Mapping
  const productionMap = {};
  const employeeMap = {};

  data?.forEach((record) => {
    const dateKey = dayjs(record.date).utc().format("YYYY-MM-DD");

    if (!productionMap[dateKey]) {
      productionMap[dateKey] = {
        produced: 0,
        loaded: 0,
        btm_5: 0,
        btm_5_sale: 0,
        loadedCountKg: 0,
      };
    }
    productionMap[dateKey].produced += record.btm_3;
    productionMap[dateKey].btm_5 += record.btm_5;
    productionMap[dateKey].btm_5_sale += record.btm_5_sale;
    productionMap[dateKey].loadedCountKg += record.loadedCountKg;
    productionMap[dateKey].loaded += record.loaded || 0;

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

  let totalProduced = data?.reduce((sum, record) => sum + record.btm_3, 0) || 0;

  let totalLoaded = data?.reduce((sum, record) => sum + record.btm_5, 0) || 0;

  let totalbtm5forSale =
    data?.reduce((sum, record) => sum + record.btm_5_sale, 0) || 0;

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

  let totalSum = totalWorkerAmount + totalWorkerAmountOfLoaded || 0;

  return (
    <div>
      {/* Print tugmasi */}

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
          <h3>Okisleniya-{dayjs().format("YYYY-MM")}</h3>
          <Button type="primary" onClick={handlePrint}>
            Yuklab olish
          </Button>
        </div>
        <table border={1}>
          <thead>
            <tr>
              <th rowSpan={6}>№</th>
              <th rowSpan={6}>Ism Familiya</th>
              <th>BT-3</th>
              {daysOfMonth.map((day) => (
                <th key={`prod-${day}`}>
                  {productionMap[day]?.produced || ""}
                </th>
              ))}
              <th rowSpan={6}>Jami hisoblandi</th>
            </tr>
            <tr>
              <th>BT-5 olindi</th>
              {daysOfMonth.map((day) => (
                <th key={`load-${day}`}>{productionMap[day]?.btm_5 || ""}</th>
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
              <th>sotuv (kg) </th>
              {daysOfMonth.map((day) => (
                <th key={`load-${day}`}>
                  {productionMap[day]?.loadedCountKg || ""}
                </th>
              ))}
            </tr>
            <tr>
              <th>sotuv (dona) </th>
              {daysOfMonth.map((day) => (
                <th key={`load-${day}`}>
                  {productionMap[day]?.loadedCount || ""}
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
              BT-3 qozonga:{" "}
              <b>
                {totalProduced} kg -{" "}
                {(totalProduced * btm_3_price)?.toLocaleString()} so'm
              </b>{" "}
            </p>
            <p>
              BT-5 olindi:{" "}
              <b>
                {totalLoaded} kg -{" "}
                {(totalLoaded * btm_5_price)?.toLocaleString()} so'm{" "}
              </b>{" "}
            </p>
            <p>
              BT-5 sotuv uchun:{" "}
              <b>
                {totalbtm5forSale} kg -{" "}
                {(totalbtm5forSale * btm_5_mel_price)?.toLocaleString()} so'm{" "}
              </b>{" "}
            </p>
            <p>
              Jami ishlab chiqarish summasi:{" "}
              <b>{totalWorkerAmount?.toLocaleString()} so'm</b>{" "}
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
