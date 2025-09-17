import { redirect } from "@tanstack/react-router";
import store from "@/store";
import { showModal } from "@/store/slices/payment";

export async function requireAuth() {
  const state = store.getState();

  if (!state.global.access_token) {
    throw redirect({ to: "/" });
  }
}

export function checkPaymentRequired(pathname: string): boolean {
  const paymentRequiredRoutes = [
    "/client-hunter",
    "/client-hunter/profile",
    "/client-hunter/chat-history",
    "/client-hunter/freelancer",
    "/client-hunter/chat",
    "/freelancer",
    "/freelancer/chat-history",
    "/freelancer/chat",
  ];
  return paymentRequiredRoutes.some((route) => pathname.startsWith(route));
}

export function hasUserPaid(): boolean {
  const state = store.getState();
  const user = state.global.user;

  if (!user) return false;

  return ("has_paid" in user && user.has_paid === true) || user.payment_status === "paid";
}

export function triggerPaymentModal(action?: () => void): void {
  store.dispatch(showModal(action));
}

export function checkPaymentAndRedirect(pathname: string): boolean {
  if (checkPaymentRequired(pathname) && !hasUserPaid()) {
    triggerPaymentModal();
    return true;
  }
  return false;
}
