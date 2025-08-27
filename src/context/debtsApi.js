// debtsApi.js
import { api } from "./api";

// Qarzlar uchun API slice
export const debtsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Yangi qarz yaratish (qarz berish yoki olish)
        createDebt: builder.mutation({
            query: (debtData) => ({
                url: '/debts',
                method: 'POST',
                body: debtData,
            }),
            invalidatesTags: ['Debts', 'Balance', 'Expenses'],
        }),

        // Qarzni to‘lash
        repayDebt: builder.mutation({
            query: ({ debtId, amount, paymentMethod, note }) => ({
                url: '/debts/repay',
                method: 'POST',
                body: { debtId, amount, paymentMethod, note },
            }),
            invalidatesTags: ['Debts', 'Balance', 'Expenses'],
        }),

        // Faol qarzlarni olish
        getActiveDebts: builder.query({
            query: ({ type, status }) => ({
                url: '/debts/active',
                params: { type, status },
            }),
            providesTags: ['Debts'],
        }),

        // Qarzlar tarixini olish
        getDebtHistory: builder.query({
            query: (type) => ({
                url: '/debts/history',
                params: type ? { type } : {},
            }),
            providesTags: ['Debts'],
        }),
    }),
});

// Komponentlarda ishlatish uchun hooklar
export const {
    useCreateDebtMutation,
    useRepayDebtMutation,
    useGetActiveDebtsQuery,
    useGetDebtHistoryQuery,
} = debtsApi;