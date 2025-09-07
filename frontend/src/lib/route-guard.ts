import { redirect } from "@tanstack/react-router";
import store from "@/store";

export async function requireAuth() {
  const state = store.getState();

  if (!state.global.access_token) {
    throw redirect({ to: "/" });
  }
}
