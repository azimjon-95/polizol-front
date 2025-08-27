import { api } from "./api";

export const normaApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllNorma: builder.query({
      query: () => "/norma/all",
      providesTags: ["Norma"],
    }),
    createNorma: builder.mutation({
      query: (newNorma) => ({
        url: "/norma/create",
        method: "POST",
        body: newNorma,
      }),
      invalidatesTags: ["Norma"],
    }),
    updateNorma: builder.mutation({
      query: ({ id, body }) => ({
        url: `/norma/update/${id}`,
        method: "PUT",
        body: body,
      }),
      invalidatesTags: ["Norma"],
    }),
    deleteNorma: builder.mutation({
      query: (id) => ({
        url: `/norma/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Norma"],
    }),
  }),
});
export const {
  useGetAllNormaQuery,
  useCreateNormaMutation,
  useUpdateNormaMutation,
  useDeleteNormaMutation,
} = normaApi;
