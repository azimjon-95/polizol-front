import { api } from "./api";

export const expenseApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createExpense: builder.mutation({
            query: (expenseData) => ({
                url: '/expense',
                method: 'POST',
                body: expenseData,
            }),
            invalidatesTags: ['Expenses'],
        }),
        getExpenses: builder.query({
            query: ({ startDate, endDate } = {}) => ({
                url: '/expense',
                params: { startDate, endDate },
            }),
            providesTags: ['Expenses'],
        }),

        updateExpense: builder.mutation({
            query: ({ id, ...updates }) => ({
                url: `/expense/${id}`,
                method: 'PUT',
                body: updates,
            }),
            invalidatesTags: ['Expenses'],
        }),
        deleteExpense: builder.mutation({
            query: (id) => ({
                url: `/expense/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Expenses'],
        }),
        getBalance: builder.query({
            query: () => ({
                url: '/balance'
            }),
            providesTags: ['Expenses'],
        }),

        // Fetch all transports
        getTransports: builder.query({
            query: () => '/transports',
            transformResponse: (response) => response.innerData, // Extract innerData
            providesTags: ['Transports'],
        }),
        // Process a payment
        makePayment: builder.mutation({
            query: ({ _id, amount, paymentMethod }) => ({
                url: `/transports?_id=${_id}&amount=${amount}&paymentMethod=${paymentMethod}`,
                method: 'GET', // Using GET as per your original setup
            }),
            transformResponse: (response) => response, // Keep full response for state/message
            invalidatesTags: ['Transports'], // Invalidate to refetch transports
        }),

        //router.get("/getreports", ExpenseController.getReports);   const { startDate, endDate } = req.query;
        getReports: builder.query({
            query: ({ startDate, endDate }) => ({
                url: `/getreports?startDate=${startDate}&endDate=${endDate}`,
            }),
            providesTags: ['Expenses'],
        }),

    }),
});

export const {
    useCreateExpenseMutation,
    useGetExpensesQuery,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
    useGetBalanceQuery,
    useGetTransportsQuery,
    useGetReportsQuery,
    useMakePaymentMutation
} = expenseApi;