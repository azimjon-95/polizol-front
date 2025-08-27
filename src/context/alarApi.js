import { api } from "./api";

export const alarApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllEmployeesSalaryInfo: builder.query({
      query: ({ month, year }) => `/employees/${month}/${year}`,
      providesTags: ["Salary"],
    }),
    getEmployeeSalaryInfo: builder.query({
      query: ({ employeeId, month, year }) =>
        `/employee/${employeeId}/${month}/${year}`,
      providesTags: ["Salary"],
    }),
    paySalary: builder.mutation({
      query: (data) => ({
        url: "/pay",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Salary"],
    }),
    addPenalty: builder.mutation({
      query: (data) => ({
        url: "/penalty",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Salary"],
    }),
    getMonthlySalaryReport: builder.query({
      query: ({ month, year }) => `/report/${month}/${year}`,
      providesTags: ["Salary"],
    }),
    getEmployeePenalties: builder.query({
      query: ({ employeeId, month, year }) =>
        `/penalties/${employeeId}/${month}/${year}`,
      providesTags: ["Salary"],
    }),
    handleOverpayment: builder.mutation({
      query: (data) => ({
        url: "/overpayment",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Salary"],
    }),


    // New endpoint to get employee finance history
    getEmployeeFinanceHistory: builder.query({
      query: (employeeId) => `/finance-history/${employeeId}`,
      providesTags: ["Salary"],
    }),
  }),
});

export const {
  useGetAllEmployeesSalaryInfoQuery,
  useGetEmployeeSalaryInfoQuery,
  usePaySalaryMutation,
  useAddPenaltyMutation,
  useGetMonthlySalaryReportQuery,
  useGetEmployeePenaltiesQuery,
  useHandleOverpaymentMutation,
  useGetEmployeeFinanceHistoryQuery
} = alarApi;
