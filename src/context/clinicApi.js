import { api } from "./api";

export const factoryApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Create a new factory configuration
        createFactory: builder.mutation({
            query: (factoryData) => ({
                url: '/factory',
                method: 'POST',
                body: factoryData,
            }),
            invalidatesTags: ['Factory'],
        }),

        // Get all factory configurations
        getFactories: builder.query({
            query: () => '/factory',
            providesTags: ['Factory'],
        }),

        // Get single factory configuration by ID
        getFactoryById: builder.query({
            query: (id) => `/factory/${id}`,
            providesTags: (result, error, id) => [{ type: 'Factory', id }],
        }),

        // Update factory configuration
        updateFactory: builder.mutation({
            query: ({ id, ...factoryData }) => ({
                url: `/factory/${id}`,
                method: 'PUT',
                body: factoryData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Factory', id },
                'Factory',
            ],
        }),

        // Delete factory configuration
        deleteFactory: builder.mutation({
            query: (id) => ({
                url: `/factory/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Factory'],
        }),
    }),
});

// Export hooks for usage in components
export const {
    useCreateFactoryMutation,
    useGetFactoriesQuery,
    useGetFactoryByIdQuery,
    useUpdateFactoryMutation,
    useDeleteFactoryMutation,
} = factoryApi;