import { createSlice } from "@reduxjs/toolkit";

interface PaymentState {
  showModal: boolean;
  pendingAction: (() => void) | null;
}

const initialState: PaymentState = {
  showModal: false,
  pendingAction: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    showModal: (state, action) => {
      state.showModal = true;
      state.pendingAction = action.payload || null;
    },
    hideModal: (state) => {
      state.showModal = false;
      state.pendingAction = null;
    },
    setPendingAction: (state, action) => {
      state.pendingAction = action.payload;
    },
  },
});

export const { showModal, hideModal, setPendingAction } = paymentSlice.actions;
export default paymentSlice.reducer;
