import { createSlice } from "@reduxjs/toolkit";
import type { UserRead } from "../services/apis";

type GlobalState = {
  token: string | null;
  user: UserRead | null;
};

const initialState: GlobalState = {
  user: null,
  token: null,
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
  },
});

export const { setUser, setToken } = globalSlice.actions;
export default globalSlice.reducer;
