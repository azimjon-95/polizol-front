import { api } from "./api";

export const planSaleApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Sotuvchilar ro'yxatini olish
        getSalesEmployees: builder.query({
            query: () => "/sales-employees",
            providesTags: ["SalesEmployees"],
        }),

        // Rejalarni olish
        getAllPlans: builder.query({
            query: () => "/plans",
            providesTags: ["Plans"],
        }),

        // Bitta reja (ID orqali) olish
        getPlanById: builder.query({
            query: (id) => `/plans/${id}`,
            providesTags: (result, error, id) => [{ type: "Plans", id }],
        }),

        // Reja yaratish
        createPlan: builder.mutation({
            query: (newPlan) => ({
                url: "/plans",
                method: "POST",
                body: newPlan,
            }),
            invalidatesTags: ["Plans"],
        }),

        // Rejani yangilash
        updatePlan: builder.mutation({
            query: ({ id, updatedPlan }) => ({
                url: `/plans/${id}`,
                method: "PUT",
                body: updatedPlan,
            }),
            invalidatesTags: (result, error, { id }) => [
                "Plans",
                { type: "Plans", id },
            ],
        }),

        // Rejani o'chirish
        deletePlan: builder.mutation({
            query: (id) => ({
                url: `/plans/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Plans"],
        }),
    }),
});

export const {
    useGetSalesEmployeesQuery,
    useGetAllPlansQuery,
    useGetPlanByIdQuery,
    useCreatePlanMutation,
    useUpdatePlanMutation,
    useDeletePlanMutation,
} = planSaleApi;
