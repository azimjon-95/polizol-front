import { api } from "./api";

// Define the API slice for sales
export const cartSaleApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Create a new sale
        createCartSale: builder.mutation({
            query: (saleData) => ({
                url: '/sales',
                method: 'POST',
                body: saleData,
            }),
            invalidatesTags: ['Sale', 'CustomerSales'],
        }),

        // Get a sale by ID
        getSaleCartById: builder.query({
            query: (id) => `/sales/${id}`,
            providesTags: (result, error, id) => [{ type: 'Sale', id }],
        }),

        // Update a sale
        updateCartSale: builder.mutation({
            query: ({ id, body }) => ({
                url: `/sales/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Sale', id },
                'CustomerSales',
            ],
        }),

        // Delete a sale
        deleteCartSale: builder.mutation({
            query: (id) => ({
                url: `/sales/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Sale', 'CustomerSales'],
        }),

        // Process debt payment
        payDebt: builder.mutation({
            query: ({ id, body }) => ({
                url: `/sales/${id}/pay-debt`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Sale', 'CustomerSales'],
        }),

        // Get filtered sales (by month for all customers)
        getFilteredSales: builder.query({
            query: (selectedMonth) => ({
                url: '/filtered',
                params: { month: selectedMonth },
            }),
            providesTags: ['Sale'],
        }),

        // Process product returns
        returnProducts: builder.mutation({
            query: ({ id, body }) => ({
                url: `/sales/${id}/return`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Sale', 'CustomerSales'],
        }),

        // Get sales filtered by customer, status, and optional month
        getCustomerSales: builder.query({
            query: ({ customerId, status, month }) => ({
                url: '/sales/customer',
                params: { customerId, status, month },
            }),
            providesTags: ['CustomerSales'],
        }),

        // Get completed sales for a specific customer
        getCustomerCompletedSales: builder.query({
            query: (customerId) => `/sales/customer/${customerId}/completed`,
            providesTags: ['CustomerSales'],
        }),

        // Get active (unpaid/partially paid) sales for a specific customer
        getCustomerActiveSales: builder.query({
            query: (customerId) => `/sales/customer/${customerId}/active`,
            providesTags: ['CustomerSales'],
        }),


        //'/sales/customerall
        getCompanys: builder.query({
            query: () => '/companys',
            providesTags: ['CustomerSales'],
        }),

        // Get transports
        getTransport: builder.query({
            query: () => '/transports',
            providesTags: ['Transport'],
        }),


        // Route to process delivery for a sale
        deliverProduct: builder.mutation({
            query: (body) => ({
                url: '/deliver',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Sale', 'CustomerSales'],
        }),
    }),
});

// Export hooks for usage in components
export const {
    useCreateCartSaleMutation,
    useGetSaleCartByIdQuery,
    useUpdateCartSaleMutation,
    useDeleteCartSaleMutation,
    usePayDebtMutation,
    useGetFilteredSalesQuery,
    useReturnProductsMutation,
    useGetCustomerSalesQuery,
    useGetCustomerCompletedSalesQuery,
    useGetCustomerActiveSalesQuery,
    useGetCompanysQuery,
    useGetTransportQuery,
    useDeliverProductMutation
} = cartSaleApi;