import { createSlice } from '@reduxjs/toolkit';

// Function to get the last month in 'YYYY-MM' format
const getLastMonth = () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth());
    const year = lastMonth.getFullYear();
    const month = String(lastMonth.getMonth() + 1).padStart(2, '0'); // Ensure two-digit month
    return `${year}-${month}`;
};

const initialState = {
    selectedMonth: getLastMonth(), // Set to last month, e.g.,
};

const monthSlice = createSlice({
    name: 'month',
    initialState,
    reducers: {
        setSelectedMonth: (state, action) => {
            state.selectedMonth = action.payload;
        },
    },
});

export const { setSelectedMonth } = monthSlice.actions;
export default monthSlice.reducer;