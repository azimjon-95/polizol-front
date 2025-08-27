import { api } from "./api";

export const additionExpenApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Yangi xarajat qo‘shish
        createAdditionExpen: builder.mutation({
            query: (newData) => ({
                url: "/addition/expen",
                method: "POST",
                body: newData,
            }),
            invalidatesTags: ["AdditionExpen"],
        }),

        // Barcha xarajatlarni olish
        getAllAdditionExpen: builder.query({
            query: () => "/addition/expen",
            providesTags: ["AdditionExpen"],
        }),

        // Bitta xarajatni ID orqali olish
        getAdditionExpenById: builder.query({
            query: (id) => `/addition/expen/${id}`,
            providesTags: (result, error, id) => [{ type: "AdditionExpen", id }],
        }),

        // Xarajatni yangilash
        updateAdditionExpen: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/addition/expen/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "AdditionExpen", id },
                "AdditionExpen",
            ],
        }),

        // Xarajatni o‘chirish
        deleteAdditionExpen: builder.mutation({
            query: (id) => ({
                url: `/addition/expen/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "AdditionExpen", id },
                "AdditionExpen",
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useCreateAdditionExpenMutation,
    useGetAllAdditionExpenQuery,
    useGetAdditionExpenByIdQuery,
    useUpdateAdditionExpenMutation,
    useDeleteAdditionExpenMutation,
} = additionExpenApi;
