import { api } from "./api";

export const factoryApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // ✅ Barcha firmalarni olish
        getFirms: builder.query({
            query: () => ({
                url: "/find",
                method: "GET",
            }),
        }),

        // ✅ Firma yangilash
        updateFirm: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/find/${id}`,
                method: "PUT",
                body: data,
            }),
        }),

        // ✅ Firma o‘chirish
        deleteFirm: builder.mutation({
            query: (id) => ({
                url: `/find/${id}`,
                method: "DELETE",
            }),
        }),


        // ✅ To‘lovni qayta ishlash
        processCompanyPayment: builder.mutation({
            query: (data) => ({
                url: "/process-payment",
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const {
    useGetFirmsQuery,
    useUpdateFirmMutation,
    useDeleteFirmMutation,
    useProcessCompanyPaymentMutation,
} = factoryApi;
