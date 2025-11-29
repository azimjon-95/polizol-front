import { api } from "./api";

export const materialApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllMaterials: builder.query({
      query: () => "/material/all",
      providesTags: ["Materials"],
    }),

    createMaterial: builder.mutation({
      query: (newMaterial) => ({
        url: "/material/create",
        method: "POST",
        body: newMaterial,
      }),
      invalidatesTags: ["Materials"],
    }),

    updateMaterial: builder.mutation({
      query: ({ id, body }) => ({
        url: `/material/update/${id}`,
        method: "PUT",
        body: body,
      }),
      invalidatesTags: ["Materials"],
    }),

    deleteMaterial: builder.mutation({
      query: (id) => ({
        url: `/material/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Materials"],
    }),


    // =====================================
    // Kirim qo‘shish
    createIncome: builder.mutation({
      query: (data) => ({
        url: "/material/incomes",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Incomes"],
    }),

    // Firma qo‘shish
    createFirm: builder.mutation({
      query: (data) => ({
        url: "/material/firms",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Firms"],
    }),

    // Firmalar ro‘yxatini olish
    getFirms: builder.query({
      query: () => "/material/firms",
      providesTags: ["Firms"],
    }),

    // Kirimlar ro‘yxatini olish
    getIncomes: builder.query({
      query: () => ({
        url: "/material/getincomes",
      }),
      providesTags: ["Incomes"],
    }),

    // Kirimlar ro‘yxatini olish
    getFilteredMaterials: builder.query({
      query: () => "/material/filtered-materials",
      providesTags: ["Incomes"],
    }),

    //router.post('/pay-debtincome', materialService.payDebtIncom);
    payDebtIncome: builder.mutation({
      query: (data) => ({
        url: "/material/paydebtincome",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Incomes"],
    }),

  }),
});
export const {
  useGetAllMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,

  //=======================

  useCreateIncomeMutation,
  useCreateFirmMutation,
  useGetFirmsQuery,
  useGetIncomesQuery,
  useGetFilteredMaterialsQuery,
  usePayDebtIncomeMutation
} = materialApi;
