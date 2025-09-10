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
  const user = useSelector((state: RootState) => state.global.user);
  const { data: config } = useGetPaymentConfigPaymentsConfigGetQuery();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const accessToken = useSelector((state: RootState) => state.global.access_token);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    const handleRouteChange = () => {
      const newPath = window.location.pathname;
      setCurrentPath(newPath);
      checkPaymentAndRedirect(newPath);
    };

    window.addEventListener("popstate", handleRouteChange);

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

    handleRouteChange();

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    if (accessToken && user) {
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
