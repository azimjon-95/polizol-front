import { api } from "./api";

export const attendanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Hodimning davomat tarixini olish (query params bilan)
    getEmployeeHistory: builder.query({
      query: ({ employeeId, startDate, endDate }) => {
        let url = `/attendance?employeeId=${employeeId}`;
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        return url;
      },
      providesTags: ["Attendance"],
      transformResponse: (response) => response.innerData,
    }),

    // ✅ Barcha hodimlarning davomatlari (ikki sana oralig‘ida)
    getAllAttendance: builder.query({
      query: ({ startDate, endDate }) =>
        `/attendance/all?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ["Attendance"],
      transformResponse: (response) => response.innerData,
    }),

    // ✅ Davomat yaratish yoki yangilash
    markAttendance: builder.mutation({
      query: (data) => ({
        url: "/attendance",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Attendance", "Salary"],
      transformResponse: (response) => response.innerData,
    }),

    // ✅ Davomatni yangilash
    updateAttendance: builder.mutation({
      query: (data) => ({
        url: "/attendance",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Attendance", "Salary"],
      transformResponse: (response) => response.innerData,
    }),

    // ✅ Davomatni o'chirish
    deleteAttendance: builder.mutation({
      query: (data) => ({
        url: "/attendance",
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ["Attendance", "Salary"],
      transformResponse: (response) => response.innerData,
    }),
  }),
});

export const {
  useGetEmployeeHistoryQuery,
  useGetAllAttendanceQuery,
  useMarkAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
} = attendanceApi;
