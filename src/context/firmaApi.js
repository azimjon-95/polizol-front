import { api } from "./api";

export const factoryApi = api.injectEndpoints({
    endpoints: (builder) => ({
        //router.post("/process-payment",
        processCompanyPayment: builder.mutation({
            query: (data) => ({
                url: "/process-payment",
                method: "POST",
                body: data,
            }),
        }),
    }),
});

// Export hooks for usage in components
export const {
    useProcessCompanyPaymentMutation
} = factoryApi;