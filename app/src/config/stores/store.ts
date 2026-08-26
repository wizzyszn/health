import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/config/stores/slices/auth.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
