import { api } from "./api";

export const praymerApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Create a new production
        createProduction: builder.mutation({
            query: (productionData) => ({
                url: '/praymer/',
                method: 'POST',
                body: productionData,
            }),
            invalidatesTags: [{ type: 'Production', id: 'LIST' }],
        }),

        // Get all productions
        getAllProductions: builder.query({
            query: () => ({
                url: '/praymer/',
                method: 'GET',
            }),
            providesTags: [{ type: 'Production', id: 'LIST' }],
        }),

        // Get production by ID
        getProductionById: builder.query({
            query: (id) => ({
                url: `/praymer/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Production', id }],
        }),

        // Update production by ID
        updateProduction: builder.mutation({
            query: ({ id, ...productionData }) => ({
                url: `/praymer/${id}`,
                method: 'PUT',
                body: productionData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Production', id },
                { type: 'Production', id: 'LIST' },
            ],
        }),

        // Delete production by ID
        deleteProduction: builder.mutation({
            query: (id) => ({
                url: `/praymer/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Production', id },
                { type: 'Production', id: 'LIST' },
            ],
        }),

        // Get one month data
        getOneMonthData: builder.query({
            query: ({ startDate, endDate }) => ({
                url: `/praymer/monthly/${startDate}/${endDate}`, // Incorrect
                method: 'GET',
            })
        })
    }),
});

// Export hooks for usage in components
export const {
    useCreateProductionMutation,
    useGetAllProductionsQuery,
    useGetProductionByIdQuery,
    useUpdateProductionMutation,
    useDeleteProductionMutation,
    useGetOneMonthDataQuery,
} = praymerApi;


