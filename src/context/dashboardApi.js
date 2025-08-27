import { api } from "./api";

export const dashboardApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // GET /api/dashboard/monthly-stats?month=YYYY.MM
        getMonthlyDashboard: builder.query({
            query: (month) => `/dashboard?month=${month}`,

        }),

    }),
});

// Export hooks for usage in components
export const {
    useGetMonthlyDashboardQuery
} = dashboardApi;

