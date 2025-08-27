import { api } from "./api";

export const bonusApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBonuses: builder.query({
      query: ({ startDate, endDate }) =>
        `/bonus/all?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ["Balance", "Bonuses"],
    }),

    getBonusById: builder.query({
      query: (id) => `/bonus/${id}`,
      providesTags: ["Balance", "Bonuses"],
    }),

    createBonus: builder.mutation({
      query: (body) => ({
        url: "/bonus/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Bonuses", "Balance", "Expenses", "Salary"],
    }),

    updateBonus: builder.mutation({
      query: ({ id, data }) => ({
        url: `/bonus/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Balance", "Bonuses", "Salary"],
    }),

    deleteBonus: builder.mutation({
      query: (id) => ({
        url: `/bonus/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Balance", "Bonuses", "Expenses", "Salary"],
    }),
  }),
});

export const {
  useGetBonusesQuery,
  useGetBonusByIdQuery,
  useCreateBonusMutation,
  useUpdateBonusMutation,
  useDeleteBonusMutation,
} = bonusApi;
