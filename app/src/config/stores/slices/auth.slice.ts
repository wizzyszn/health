import { Storages } from "@/lib/helpers";
import { StorageKeysEnum, UserRole, UserType } from "@/lib/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export interface AuthState<T> {
  user: T | null;
  token: string | null;
  refreshToken: string | null;
  role: UserRole;
  timezone: string | null;
}

const initialState: AuthState<UserType> = {
  user: Storages.getStorage("local", StorageKeysEnum.user) as UserType | null,
  token: Storages.getStorage("local", StorageKeysEnum.token),
  refreshToken: Storages.getStorage("local", StorageKeysEnum.refresh_token),
  role: Storages.getStorage("local", StorageKeysEnum.role) as UserRole,
  timezone: Storages.getStorage("local", StorageKeysEnum.timezone),
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      Storages.clearStorage("session");
      Storages.clearStorage("local");
    },
    setUser<T>(state: AuthState<T>, action: PayloadAction<T>) {
      state.user = action.payload;
      Storages.setStorage("local", StorageKeysEnum.user, state.user);
    },
    setToken<T>(state: AuthState<T>, action: PayloadAction<string>) {
      state.token = action.payload;
      Storages.setStorage("local", StorageKeysEnum.token, action.payload);
    },
    setRefreshToken<T>(state: AuthState<T>, action: PayloadAction<string>) {
      state.refreshToken = action.payload;
      Storages.setStorage(
        "local",
        StorageKeysEnum.refresh_token,
        state.refreshToken,
      );
    },
    setRole<T>(state: AuthState<T>, action: PayloadAction<UserRole>) {
      const role =
        action.payload === ("super_admin" as UserRole)
          ? "admin"
          : action.payload;
      state.role = role as UserRole;
      Storages.setStorage("local", StorageKeysEnum.role, role);
    },
    setTimezone<T>(state: AuthState<T>, action: PayloadAction<string>) {
      state.timezone = action.payload;
      Storages.setStorage("local", StorageKeysEnum.timezone, action.payload);
    },
  },
  extraReducers: () => {},
});
export const {
  setUser,
  setToken,
  logout,
  setRole,
  setRefreshToken,
  setTimezone,
} = authSlice.actions;
export default authSlice.reducer;
