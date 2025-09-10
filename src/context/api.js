import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";

// Bazaviy query — token bilan avtomatik headerga qo‘shiladi
const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:5050/api", // API bazaviy manzili
  // baseUrl: "https://poppolizol-api.vercel.app/api", // API bazaviy manzili
  baseUrl: "https://polizolserver.medme.uz/api",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`); // Diqqat: ko‘p API-larda "Authorization" bo‘ladi, sizda "authentication" bo‘lsa ham, tekshiring
    }
    return headers;
  },
});

// Retry bilan o‘rash — 2 marta qayta urinish imkoniyati
const baseQueryWithRetry = retry(baseQuery, { maxRetries: 3 });

// RTK Query API obyektini yaratish
export const api = createApi({
  reducerPath: "splitApi",
  baseQuery: baseQueryWithRetry,
  tagTypes: [
    "Debts",
    "Balance",
    "Transport",
    "CustomerSales",
    "Workers",
    "Inventory",
    "Plans",
    "Incomes",
    "Factory",
    "Firms",
    "FinishedProducts",
    "ProductionHistory",
    "Norma",
    "Expenses",
    "Salary",
  ], // kerakli taglar
  endpoints: () => ({}), // endpointlar keyinchalik qo‘shiladi
});
