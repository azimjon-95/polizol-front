import { api } from "./api"; // Bu sizda mavjud bo'lishi kerak

export const categoryApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Yangi kategoriya yaratish
        createCategory: builder.mutation({
            query: (newCategory) => ({
                url: "/category",
                method: "POST",
                body: newCategory,
            }),
            invalidatesTags: ['Category'],
        }),

        // Barcha kategoriyalarni olish
        getAllCategories: builder.query({
            query: () => "/category",
            providesTags: ['Category'],
        }),

        // ID orqali kategoriya olish
        getCategoryById: builder.query({
            query: (id) => `/category/${id}`,
            providesTags: (result, error, id) => [{ type: 'Category', id }],
        }),

        // Kategoriyani yangilash
        updateCategory: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/category/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Category', id },
                'Category'
            ],
        }),

        // Kategoriyani o‘chirish
        deleteCategory: builder.mutation({
            query: (id) => ({
                url: `/category/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Category', id },
                'Category'
            ],
        }),
    }),

    overrideExisting: false,
});

export const {
    useCreateCategoryMutation,
    useGetAllCategoriesQuery,
    useGetCategoryByIdQuery,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} = categoryApi;
