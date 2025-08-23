import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { registerSchema } from "@/lib/form-schemas";
import { useRegisterUserAuthRegisterPostMutation } from "@/store/services/apis";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import ImageUploader from "../ui/image-uploader";
import { Input } from "../ui/input";

interface RegisterFormProps {
  setIsLogin: Dispatch<SetStateAction<boolean>>;
}

function RegisterForm({ setIsLogin }: RegisterFormProps) {
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const [register, { isLoading: registering }] = useRegisterUserAuthRegisterPostMutation();

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      const response = await register({
        userCreate: data,
      });

      if (response.data) {
        // Store user type for payment guard
        localStorage.setItem("user_type", data.user_type);

        registerForm.reset();
        toast.success("Registration successful! Please login.");
        setIsLogin(true);
      } else if (response.error) {
        toast.error("Registration failed. Please try again.");
      }
    } catch (_error) {
      toast.error("An error occurred while registering.");
    }
  };

  return (
    <Form {...registerForm}>
      <form
        onSubmit={registerForm.handleSubmit(handleRegister)}
        className="flex w-full max-w-md flex-col items-center justify-center gap-5 rounded-xl border bg-muted/50 p-5 shadow backdrop-blur-sm"
      >
        <div className="flex w-full flex-col items-center justify-center gap-2 border-b pb-5">
          <span className="w-full text-left font-bold text-[20px] leading-[20px]">Register</span>
          <span className="w-full text-left text-[14px] text-muted-foreground leading-[14px]">
            Enter your details to get started.
          </span>
        </div>
        <FormField
          control={registerForm.control}
          name="email"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="johnny_silverhand_roxx@arasaka.net" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={registerForm.control}
          name="password"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="• • • • • • • •" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={registerForm.control}
          name="first_name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="Johnny" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={registerForm.control}
          name="last_name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Silverhand" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={registerForm.control}
          name="user_type"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>User Type</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select user type</option>
                  <option value="client_hunter">Client Hunter (Hire Freelancers)</option>
                  <option value="freelancer">Freelancer (Provide Services)</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={registerForm.control}
          name="profile_picture"
          render={({ field, fieldState }) => (
            <ImageUploader field={field} error={fieldState.error} label="Profile Picture (Optional)" />
          )}
        />
        <Button disabled={registering} type="submit" variant="default" size="lg" className="w-full">
          {registering ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Send />
              Register
            </>
          )}
        </Button>
        <span onClick={() => setIsLogin(true)} className="w-full cursor-pointer text-center text-[12px] leading-[12px]">
          Already have an account?&nbsp;
          <span className="underline">Login</span>
        </span>
      </form>
    </Form>
  );
}

export default RegisterForm;
