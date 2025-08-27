import { api } from "./api";

export const salaryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllSalary: builder.query({
      query: ({ startDate, endDate } = {}) => {
        let queryStr = "/salary/getAll";
        if (startDate && endDate) {
          queryStr += `?startDate=${startDate}&endDate=${endDate}`;
        }
        return queryStr;
      },
      transformResponse: (res) => res.innerData,
      providesTags: ["Salary"],
    }),
    getSalaryBTM3: builder.query({
      query: ({ startDate, endDate } = {}) => {
        let queryStr = "/salary/getBTM3";
        if (startDate && endDate) {
          queryStr += `?startDate=${startDate}&endDate=${endDate}`;
        }
        return queryStr;
      },
      transformResponse: (res) => res.innerData,
      providesTags: ["Salary"],
    }),
  }),
});

export const { useGetAllSalaryQuery, useGetSalaryBTM3Query } = salaryApi;
