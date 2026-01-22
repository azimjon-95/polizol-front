// src/pages/MaterialIncomeTable.jsx
import React from "react";
import { useGetMaterialByNameQuery } from "../../../../context/materialApi";
import "./material-income-table.css";

const MaterialIncomeTable = ({ materialName }) => {
    // const { data, isLoading } = useGetMaterialByNameQuery(materialName)
    const {
        data, isLoading
    } = useGetMaterialByNameQuery(materialName, {
        skip: !materialName,
    });
    console.log(data);
    console.log(materialName);

    if (isLoading) return <div className="table-loading">Yuklanmoqda...</div>;

    return (
        <div className="excel-wrapper">
            <table className="excel-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Sana</th>
                        <th>Firma</th>
                        <th>Miqdor</th>
                        <th>Summa</th>
                        <th>Qarz</th>
                        <th>Holat</th>
                    </tr>
                </thead>
                <tbody>
                    {data?.innerData?.map((item, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{new Date(item.lastDate).toLocaleDateString()}</td>
                            <td className="firm-name">{item.firmName}</td>
                            <td>{item.totalQuantity}</td>
                            <td>{item.totalSum.toLocaleString()}</td>
                            <td className={item.debtRemaining > 0 ? "debt" : "paid"}>
                                {item.debtRemaining.toLocaleString()}
                            </td>
                            <td>
                                <span className={`status ${item.debtStatus}`}>
                                    {item.debtStatus === "pending" ? "To'lanmagan" : "To'langan"}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MaterialIncomeTable;
