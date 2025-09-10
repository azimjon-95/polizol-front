import { api } from "./api";

export const customerApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // 📊 Mijoz statistikasini olish
        getCustomerStats: builder.query({
            query: (id) => `/customer/${id}/stats`,
            providesTags: (result, error, id) => [{ type: "Customer", id }],
        }),

        // ✏️ Mijozni yangilash
        updateCustomer: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/customer/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }],
        }),
    }),
});

export const {
    useGetCustomerStatsQuery,
    useUpdateCustomerMutation,
} = customerApi;
