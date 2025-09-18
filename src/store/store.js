import { configureStore } from "@reduxjs/toolkit";
import creatorReducer from './professionalSlice';

const persistedStateJSON = localStorage.getItem("professionalDetails");
const persistedState = persistedStateJSON
  ? JSON.parse(persistedStateJSON)
  : {};


const store = configureStore({
    reducer: {
        professionalUser: creatorReducer,

    },
    preloadedState: {
        professionalUser: persistedState,
    },

})

export default store;