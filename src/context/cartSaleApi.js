import { api } from "./api";

// Define the API slice for sales
export const cartSaleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new sale
    createCartSale: builder.mutation({
      query: (saleData) => ({
        url: "/sales",
        method: "POST",
        body: saleData,
      }),
      invalidatesTags: ["Sale", "CustomerSales"],
    }),

    // Get a sale by ID
    getSaleCartById: builder.query({
      query: (id) => `/sales/${id}`,
      providesTags: (result, error, id) => [{ type: "Sale", id }],
    }),

    // Update a sale
    updateCartSale: builder.mutation({
      query: ({ id, body }) => ({
        url: `/sales/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Sale", id },
        "CustomerSales",
      ],
    }),

    // Delete a sale
    deleteCartSale: builder.mutation({
      query: (id) => ({
        url: `/sales/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sale", "CustomerSales"],
    }),

    payDebt: builder.mutation({
      query: (data) => ({
        url: `/sales/pay-debt`, // backend route
        method: "POST",
        body: data, // bu yerda data JSON sifatida yuboriladi
      }),
      invalidatesTags: ["Sale", "CustomerSales"],
    }),

    getFilteredSales: builder.query({
      query: () => ({
        url: "/filtered",
      }),
      providesTags: ["Sale"],
    }),

    // Process product returns
    returnProducts: builder.mutation({
      query: ({ id, body }) => ({
        url: `/sales/${id}/return`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sale", "CustomerSales"],
    }),

    // Get sales filtered by customer, status, and optional month
    getCustomerSales: builder.query({
      query: ({ customerId, status, month }) => ({
        url: "/sales/customer",
        params: { customerId, status, month },
      }),
      providesTags: ["CustomerSales"],
    }),

    // Get completed sales for a specific customer
    getCustomerCompletedSales: builder.query({
      query: (customerId) => `/sales/customer/${customerId}/completed`,
      providesTags: ["CustomerSales"],
    }),

    // Get active (unpaid/partially paid) sales for a specific customer
    getCustomerActiveSales: builder.query({
      query: (customerId) => `/sales/customer/${customerId}/active`,
      providesTags: ["CustomerSales"],
    }),

    //'/sales/customerall
    getCompanys: builder.query({
      query: () => "/companys",
      providesTags: ["CustomerSales"],
    }),

    // Get transports
    getTransport: builder.query({
      query: () => "/transports",
      providesTags: ["Transport"],
    }),

    // Route to process delivery for a sale
    deliverProduct: builder.mutation({
      query: (body) => ({
        url: "/deliver",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sale", "CustomerSales", "Salary"],
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