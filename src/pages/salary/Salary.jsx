import React, { useState } from "react";
import { Tabs, DatePicker } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

import {
  useGetAllSalaryQuery,
  useGetSalaryBTM3Query,
} from "../../context/salaryApi";
import { useGetBonusesQuery } from "../../context/bonusApi";

import PolizolSalary from "./PolizolSalary";
import OchisleniyaSalary from "./OchisleniyaSalary";
import RuberoidSalary from "./RuberoidSalary";
import WorkerPaymentsTable from "./Bitum3";
import Bonus from "../bonus/Bonus";

import "./Salary.css";
import { skipToken } from "@reduxjs/toolkit/query/react";

const { RangePicker } = DatePicker;

function Salary() {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const startDate = dateRange?.[0]
    ? dateRange[0].startOf("day").toISOString()
    : undefined;

  const endDate = dateRange?.[1]
    ? dateRange[1].endOf("day").toISOString()
    : undefined;

  const noDates = !startDate || !endDate;

  const salaryQ = useGetAllSalaryQuery(
    noDates ? skipToken : { startDate, endDate }
  );
  const btm3Q = useGetSalaryBTM3Query(
    noDates ? skipToken : { startDate, endDate }
  );
  const bonusQ = useGetBonusesQuery(
    noDates ? skipToken : { startDate, endDate }
  );

  // 404 bo'lsa => bo'sh; aks holda currentData (yangi) yoki data (kesh)
  const safeData = (q) =>
    q.isError && q.error?.status === 404 ? [] : q.currentData ?? q.data ?? [];

  // Asosiy kolleksiyalar
  const allSalary = safeData(salaryQ);
  const dataBTM3 = safeData(btm3Q);
  const bonuses = safeData(bonusQ);

  // Filtrlab tabs'ga beramiz
  const OchisleniyaData = allSalary.filter(
    (r) => r.department === "Okisleniya"
  );
  const PolizolData = allSalary.filter((r) => r.department === "polizol");
  const RuberoidData = allSalary.filter((r) => r.department === "ruberoid");

  // Bonuslarda siz ilgari innerData ishlatgansiz; agar server to'g'ridan-to'g'ri massiv qaytarsa:
  const BonusData = Array.isArray(bonuses?.innerData)
    ? bonuses.innerData
    : bonuses;

  const tabBarExtraContent = (
    <div>
      <RangePicker
        value={dateRange}
        onChange={(values) =>
          setDateRange(
            values || [dayjs().startOf("month"), dayjs().endOf("month")]
          )
        }
      />
    </div>
  );

  return (
    <div style={{ padding: "5px 15px" }}>
      <Tabs
        defaultActiveKey="1"
        style={{
          marginBottom: "15px",
        }}
        size="small"
        tabBarExtraContent={tabBarExtraContent}
      >
        <Tabs.TabPane tab="Polizol" key="1">
          <PolizolSalary data={PolizolData} />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Okisleniya" key="2">
          <OchisleniyaSalary data={OchisleniyaData} />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Ruberoid" key="3">
          <RuberoidSalary data={RuberoidData} />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Bitum-3M" key="4">
          <WorkerPaymentsTable data={dataBTM3} />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Bonuslar" key="5">
          <Bonus data={BonusData} />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default Salary;
