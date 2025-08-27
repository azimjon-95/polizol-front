import { createSlice } from '@reduxjs/toolkit';

const patientSlice = createSlice({
    name: 'patient',
    initialState: {
        story: null,
    },
    reducers: {
        setStory(state, action) {
            state.story = action.payload;
        },
        clearStory(state) {
            state.story = null;
        },
    },
});

export const { setStory, clearStory } = patientSlice.actions;
export default patientSlice.reducer;