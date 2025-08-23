import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import PaymentModal from "./payment-modal";

interface PaymentGuardProps {
  children: React.ReactNode;
}

export default function PaymentGuard({ children }: PaymentGuardProps) {
  const [showPayment, setShowPayment] = useState(false);
  const { token } = useSelector((state: RootState) => state.global);

  // In a real app, you would check the user's payment status from the backend
  // For now, we'll simulate this with localStorage
  const hasPaid = localStorage.getItem("has_paid") === "true";
  const userType = localStorage.getItem("user_type");

  useEffect(() => {
    // Check if user is a client hunter who hasn't paid
    if (token && userType === "client_hunter" && !hasPaid) {
      setShowPayment(true);
    }
  }, [token, userType, hasPaid]);

  const handlePaymentSuccess = () => {
    localStorage.setItem("has_paid", "true");
    setShowPayment(false);
  };

  // If user needs to pay, show payment modal
  if (showPayment) {
    return <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} />;
  }

  // If user has paid or is a freelancer, show normal content
  return <>{children}</>;
}
