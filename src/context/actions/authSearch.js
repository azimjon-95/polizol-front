import { createSlice } from '@reduxjs/toolkit';

const searchSlice = createSlice({
    name: 'search',
    initialState: {
        isSearchOpen: false,
        searchQuery: '',
    },
    reducers: {
        toggleSearchPanel(state) {
            state.isSearchOpen = !state.isSearchOpen;
            if (!state.isSearchOpen) {
                state.searchQuery = ''; // Clear search query when closing
            }
        },
        setSearchQuery(state, action) {
            state.searchQuery = action.payload;
        },
        clearSearchQuery(state) {
            state.searchQuery = '';
        },
    },
});

export const { toggleSearchPanel, setSearchQuery, clearSearchQuery } = searchSlice.actions;
export default searchSlice.reducer;