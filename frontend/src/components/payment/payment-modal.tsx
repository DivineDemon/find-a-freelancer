import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateCurrentUserProfileAuthMePutMutation } from "@/store/services/apis";

const paymentSchema = z.object({
  card_number: z.string().min(16, "Card number must be 16 digits").max(16, "Card number must be 16 digits"),
  expiry_month: z
    .string()
    .min(1, "Month is required")
    .regex(/^(0[1-9]|1[0-2])$/, "Invalid month"),
  expiry_year: z
    .string()
    .min(1, "Year is required")
    .regex(/^(2[0-9][0-9][0-9])$/, "Invalid year"),
  cvv: z.string().min(3, "CVV must be 3 digits").max(4, "CVV must be 3-4 digits"),
  cardholder_name: z.string().min(1, "Cardholder name is required"),
});

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PLATFORM_FEE = 50; // $50 platform access fee

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [updateProfile] = useUpdateCurrentUserProfileAuthMePutMutation();

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      card_number: "",
      expiry_month: "",
      expiry_year: "",
      cvv: "",
      cardholder_name: "",
    },
  });

  const onSubmit = async (_data: z.infer<typeof paymentSchema>) => {
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update user profile to mark as paid
      await updateProfile({
        userUpdate: {
          has_paid: true,
          payment_date: new Date().toISOString(),
          payment_amount: PLATFORM_FEE,
        },
      }).unwrap();

      // Update localStorage
      localStorage.setItem("has_paid", "true");
      localStorage.setItem("payment_date", new Date().toISOString());
      localStorage.setItem("payment_amount", PLATFORM_FEE.toString());

      setIsSuccess(true);
      toast.success("Payment successful! Welcome to the platform!");

      // Close modal after success
      setTimeout(() => {
        onSuccess();
        onClose();
        setIsSuccess(false);
        form.reset();
      }, 2000);
    } catch (_error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      form.reset();
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h3 className="mb-2 font-semibold text-xl">Payment Successful!</h3>
            <p className="text-muted-foreground">
              Welcome to the platform! You now have full access to hire freelancers.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Registration</DialogTitle>
          <DialogDescription>
            Client hunters need to pay a one-time platform access fee to hire freelancers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Platform Access Fee
              </CardTitle>
              <CardDescription>One-time payment to access the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="font-bold text-2xl">${PLATFORM_FEE}</span>
                <Badge variant="secondary">One-time</Badge>
              </div>
              <ul className="mt-3 space-y-1 text-muted-foreground text-sm">
                <li>• Access to hire freelancers</li>
                <li>• Project management tools</li>
                <li>• Secure payment processing</li>
                <li>• 24/7 customer support</li>
              </ul>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cardholder_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cardholder Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="card_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="expiry_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <FormControl>
                        <Input placeholder="MM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiry_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVV</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isProcessing} className="min-w-[120px]">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay ${PLATFORM_FEE}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
