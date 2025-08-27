import React from "react";
import { Table } from "antd";

const columns = [
  {
    title: "Xodim",
    dataIndex: "worker",
    key: "worker",
    render: (worker) =>
      worker ? `${worker.firstName} ${worker.lastName}` : "Ma'lumot yo'q",
  },
  {
    title: "Telefon",
    dataIndex: ["worker", "phone"],
    key: "phone",
  },
  {
    title: "Bo'lim",
    dataIndex: ["worker", "unit"],
    key: "unit",
  },
  {
    title: "Jami to'lov",
    dataIndex: "totalPayment",
    key: "totalPayment",
    render: (totalPayment) => `${Number(totalPayment).toLocaleString()}`,
  },
];

function WorkerPaymentsTable({ data }) {
  return <Table
    columns={columns}
    dataSource={data}
    bordered
    pagination={false}
    size="small"
    rowKey="workerId"
  />;
}

export default WorkerPaymentsTable;
