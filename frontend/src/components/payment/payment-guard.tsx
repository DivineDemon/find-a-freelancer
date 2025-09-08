import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { type ReactNode, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { checkPaymentAndRedirect } from "@/lib/route-guard";
import type { RootState } from "@/store";
import { useGetPaymentConfigPaymentsConfigGetQuery } from "@/store/services/apis";
import PaymentModal from "./payment-modal";

interface PaymentGuardProps {
  children: ReactNode;
}

function PaymentGuard({ children }: PaymentGuardProps) {
  const { data: config } = useGetPaymentConfigPaymentsConfigGetQuery();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Get user state from Redux
  const user = useSelector((state: RootState) => state.global.user);
  const accessToken = useSelector((state: RootState) => state.global.access_token);

  // Check payment on route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const newPath = window.location.pathname;
      setCurrentPath(newPath);
      checkPaymentAndRedirect(newPath);
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener("popstate", handleRouteChange);

    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };

    // Check payment on initial load
    handleRouteChange();

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Check payment when user state changes (login/logout)
  useEffect(() => {
    if (accessToken && user) {
      // User is logged in, check if payment is required for current route
      checkPaymentAndRedirect(currentPath);
    }
  }, [accessToken, user, currentPath]);

  useEffect(() => {
    if (config?.publishable_key) {
      setStripePromise(loadStripe(config.publishable_key));
    }
  }, [config?.publishable_key]);

  if (!config || !stripePromise) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
      <PaymentModal
        amount={config.platform_fee_amount / 100}
        description="Platform Access Fee - Unlock premium features and chat functionality"
      />
    </Elements>
  );
}

export default PaymentGuard;
