import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RootState } from "@/store";
import { useCreatePaymentIntentPaymentsCreatePaymentIntentPostMutation } from "@/store/services/apis";
import { hideModal } from "@/store/slices/payment";

interface PaymentModalProps {
  amount: number;
  description: string;
}

function PaymentModal({ amount, description }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const { showModal, pendingAction } = useSelector(
    (state: RootState) => state.payment
  );
  const [createPaymentIntent] =
    useCreatePaymentIntentPaymentsCreatePaymentIntentPostMutation();

  const handleClose = () => {
    dispatch(hideModal());
  };

  const handleSuccess = () => {
    dispatch(hideModal());

    if (pendingAction) {
      pendingAction();
    }

    toast.success(
      "Payment successful! You now have access to premium features."
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error("Payment system not ready. Please try again.");
      return;
    }

    // Check if card element is mounted
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("Card input not ready. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);

    try {
      const paymentIntentResponse = await createPaymentIntent({
        paymentIntentCreate: {
          amount: amount * 100,
          currency: "usd",
          description: description,
        },
      }).unwrap();

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentResponse.client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        console.error("Stripe payment error:", error);
        toast.error(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        handleSuccess();
      } else {
        console.error("Payment intent status:", paymentIntent?.status);
        toast.error("Payment was not completed successfully");
      }
    } catch (error) {
      if (error && typeof error === "object" && "data" in error) {
        toast.error(`Error data: ${error.data}`);
      }

      toast.error(
        `Payment failed: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#374151",
                    fontFamily: "system-ui, sans-serif",
                    "::placeholder": {
                      color: "#9CA3AF",
                    },
                  },
                  invalid: {
                    color: "#EF4444",
                  },
                },
                hidePostalCode: false,
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">Total: ${amount}</span>
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!stripe || isLoading}>
                {isLoading ? "Processing..." : `Pay $${amount}`}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentModal;
