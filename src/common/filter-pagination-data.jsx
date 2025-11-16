// ── src/common/filter-pagination-data.js ──

import axios from "axios";

export const FilterPagination = async ({
     state,
     arr_data,
     page,
     countRoute,
     data_to_send = {},
     user = undefined,
}) => {
     let obj;
     const headers = {};

     if (user) {
          headers.headers = {
               Authorization: `Bearer ${user}`,
          };
     } 

     if (state != null && page > 1) {
          // Deduplicate by _id before merging
          const existingIds = new Set(state.results.map((n) => n._id));
          const newItems = arr_data.filter((n) => !existingIds.has(n._id));

          obj = {
               ...state,
               results: [...state.results, ...newItems],
               page,
          };
     } else {
          // First‐time load or filter change
          try {
               const {
                    data: { totalDocs },
               } = await axios.post(
                    import.meta.env.VITE_SERVER_DOMAIN + countRoute,
                    data_to_send,
                    headers
               );
               obj = { results: arr_data, page: 1, totalDocs };
          } catch (err) {
               console.error("FilterPagination count error:", err);
               obj = { results: arr_data, page: 1, totalDocs: arr_data.length };
          }
     }

     return obj;
};
