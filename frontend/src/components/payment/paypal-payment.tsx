import { AlertCircle, CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreatePaymentOrderPaymentsCreateOrderPostMutation } from "@/store/services/apis";

interface PayPalPaymentProps {
  amount: number;
  currency?: string;
  description?: string;
  onSuccess?: (paymentId: number) => void;
  onError?: (error: string) => void;
}

export default function PayPalPayment({
  amount,
  currency = "USD",
  description = "Platform Access Fee",
  onSuccess,
  onError,
}: PayPalPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [createPaymentOrder, { isLoading, error }] = useCreatePaymentOrderPaymentsCreateOrderPostMutation();

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus("processing");
      setErrorMessage("");

      const result = await createPaymentOrder({
        paymentCreate: {
          amount: amount,
          currency: currency,
          description: description,
        },
      }).unwrap();

      if (result.approval_url) {
        // Redirect to PayPal for payment
        window.location.href = result.approval_url;
      } else {
        throw new Error("No approval URL received from PayPal");
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error.data as { detail?: string })?.detail
          : "Payment failed. Please try again.";
      setPaymentStatus("error");
      setErrorMessage(errorMessage || "Payment failed. Please try again.");
      onError?.(errorMessage || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Removed unused function

  // Check for PayPal return parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get("paymentId");
    const token = urlParams.get("token");
    const payerId = urlParams.get("PayerID");

    if (paymentId && token && payerId) {
      // User returned from PayPal - handle success
      setPaymentStatus("success");
      onSuccess?.(0); // Placeholder payment ID
    }
  }, [onSuccess]);

  if (paymentStatus === "success") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="mb-4 h-16 w-16 text-green-600" />
          <h3 className="mb-2 font-semibold text-green-800 text-xl">Payment Successful!</h3>
          <p className="text-center text-green-700">Thank you for your payment. You now have access to the platform.</p>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === "error") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="mb-4 h-16 w-16 text-red-600" />
          <h3 className="mb-2 font-semibold text-red-800 text-xl">Payment Failed</h3>
          <p className="mb-4 text-center text-red-700">{errorMessage}</p>
          <Button onClick={() => setPaymentStatus("idle")} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Platform Access Payment
        </CardTitle>
        <CardDescription>Complete your payment to access the platform features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Amount:</span>
            <span className="font-semibold">
              {currency} {amount.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Description:</span>
            <span className="text-sm">{description}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <span className="font-bold text-blue-600 text-sm">P</span>
            </div>
            <div>
              <p className="font-medium">PayPal</p>
              <p className="text-muted-foreground text-sm">Secure payment processing</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              Recommended
            </Badge>
          </div>
        </div>

        {/* Terms */}
        <div className="text-center text-muted-foreground text-xs">
          By proceeding, you agree to our terms of service and privacy policy. This is a one-time payment for platform
          access.
        </div>

        {/* Payment Button */}
        <Button onClick={handlePayment} disabled={isProcessing || isLoading} className="w-full" size="lg">
          {isProcessing || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay with PayPal
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="text-center text-red-600 text-sm">
            {"data" in error && error.data && typeof error.data === "object" && "detail" in error.data
              ? (error.data as { detail: string }).detail
              : "An error occurred. Please try again."}
          </div>
        )}

        {/* Security Notice */}
        <div className="text-center text-muted-foreground text-xs">
          🔒 Your payment information is secure and encrypted
        </div>
      </CardContent>
    </Card>
  );
}
