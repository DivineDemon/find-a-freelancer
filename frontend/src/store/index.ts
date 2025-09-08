import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { api } from "./services/core";
import globalReducer from "./slices/global";
import paymentReducer from "./slices/payment";

const persistConfig = {
  key: "root",
  storage,
};

const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    // @ts-expect-error ype 'Reducer<GlobalState & PersistPartial, UnknownAction>' is not assignable to type 'Reducer<unknown, UnknownAction, unknown>'
    global: persistReducer(persistConfig, globalReducer),
    payment: paymentReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }).concat(api.middleware),
});

setupListeners(store.dispatch);
void store.dispatch(api.endpoints.healthCheck.initiate({}));

export default store;
export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
