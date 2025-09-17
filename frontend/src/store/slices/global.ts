import { createSlice } from "@reduxjs/toolkit";
import type { LoginResponse } from "../services/apis";

const initialState: LoginResponse = {
  user: {
    email: "",
    phone: "",
    user_id: 0,
    last_name: "",
    image_url: "",
    user_type: "",
    first_name: "",
    account_status: "",
    payment_status: "",
  },
  access_token: "",
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setToken: (state, action) => {
      state.access_token = action.payload;
    },
    logout: (state) => {
      state.user = initialState.user;
      state.access_token = "";
    },
  },
});

export const { setUser, setToken, logout } = globalSlice.actions;
export default globalSlice.reducer;
