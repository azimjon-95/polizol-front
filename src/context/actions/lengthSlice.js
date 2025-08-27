// src/features/sales/salesSlice.js
import { createSlice } from '@reduxjs/toolkit';

const lengthSlice = createSlice({
    name: 'sales',
    initialState: {
        filteredSalesLength: 0,
    },
    reducers: {
        setFilteredSalesLength: (state, action) => {
            state.filteredSalesLength = action.payload;
        },
    },
});

export const { setFilteredSalesLength } = lengthSlice.actions;
export default lengthSlice.reducer;