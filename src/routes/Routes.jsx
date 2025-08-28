import React from "react";
import Dashboard from "../pages/admin/Dashboard/Dashboard";
import Workers from "../pages/admin/workers/Workers";
import ExpenseManager from "../pages/reseption/expense/ExpenseManager";
import Materials from "../pages/materials/Materials";
import Norma from "../pages/productNorma/ProductNormaMain";
import ProductionSystem from "../pages/productionProcess/ProductionSystem";
import FactoryConfigPanel from "../pages/admin/setting/Setting";
import FactorySalesSystem from "../pages/reseption/salesDepartment/SalesDepartment";
import Atendance from "../pages/attendance/Atendance";
import CatigoryManagement from "../pages/admin/setting/CategoryManagement";
import Salary from "../pages/salary/Salary";
import SalaryManagement from "../pages/reseption/salary/SalaryManagement";

export const rolePaths = {
  "polizol ish boshqaruvchi": "/attendance",
  "rubiroid ish boshqaruvchi": "/attendance",
  "okisleniya ish boshqaruvchi": "/attendance",

  direktor: "/dashboard",
  buxgalteriya: "/dashboard",
  menejir: "/dashboard",

  sotuvchi: "/saler",
  "sotuvchi eksport": "/saler",
  "sotuvchi menejir": "/saler",
};

export const routes = [
  {
    path: "/dashboard",
    element: <Dashboard />,
    role: ["direktor", "buxgalteriya", "menejir"],
    private: true,
  },
  {
    path: "/workers",
    element: <Workers />,
    role: ["direktor", "buxgalteriya", "menejir"],
    private: true,
  },
  {
    path: "/expense",
    element: <ExpenseManager />,
    role: ["direktor", "buxgalteriya", "menejir", "sotuvchi menejir"],
    private: true,
  },
  {
    path: "/warehouse",
    element: <Materials />,
    role: ["direktor", "buxgalteriya", "menejir"],
    private: true,
  },
  {
    path: "/norma",
    element: <Norma />,
    role: ["direktor", "buxgalteriya", "menejir"],
    private: true,
  },
  {
    path: "/production",
    element: <ProductionSystem />,
    role: ["direktor", "buxgalteriya", "menejir"],
    private: true,
  },
  {
    path: "/setting",
    element: <FactoryConfigPanel />,
    role: ["direktor", "buxgalteriya", "menejir"],
    private: true,
  },
  {
    path: "/sales",
    element: <FactorySalesSystem />,
    role: ["direktor", "buxgalteriya", "menejir"],
    private: true,
  },
  {
    path: "/catigory",
    element: <CatigoryManagement />,
    role: ["direktor", "buxgalteriya"],
    private: true,
  },
  {
    path: "/saler",
    element: <FactorySalesSystem />,
    role: ["sotuvchi", "sotuvchi eksport", "sotuvchi menejir"],
    private: true,
  },
  {
    path: "/attendance",
    element: <Atendance />,
    role: [
      "direktor",
      "buxgalteriya",
      "polizol ish boshqaruvchi",
      "rubiroid ish boshqaruvchi",
      "okisleniya ish boshqaruvchi",
    ],
    private: true,
  },
  {
    path: "/salary",
    element: <Salary />,
    role: ["direktor", "buxgalteriya", "menejir"],
    private: true,
  },
  {
    path: "/oylik",
    element: <SalaryManagement />,
    role: ["direktor", "buxgalteriya", "menejir"],
    private: true,
  },
];
