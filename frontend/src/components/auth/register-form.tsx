import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Logo from "@/assets/img/logo.png";
import { registerSchema } from "@/lib/form-schemas";
import { useRegisterUserAuthRegisterPostMutation } from "@/store/services/apis";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import ImageUploader from "../ui/image-uploader";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

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
        registerForm.reset();
        toast.success("Registration successful! Please login.");
        setIsLogin(true);
      } else if (response.error) {
        toast.error("Registration failed. Please try again.");
      }
    } catch (error) {
      toast.error(`An error occurred while registering. ${error}`);
    }
  };

  return (
    <Form {...registerForm}>
      <form
        onSubmit={registerForm.handleSubmit(handleRegister)}
        className="grid w-full max-w-lg grid-cols-2 items-center justify-center gap-5"
      >
        <div className="col-span-2 flex w-full items-center justify-start gap-2.5 border-b pb-5">
          <img src={Logo} alt="logo" className="size-12 shrink-0 rounded-md" />
          <div className="flex w-full flex-col items-center justify-center gap-2">
            <span className="w-full text-left font-bold text-[20px] leading-[20px]">Register</span>
            <span className="w-full text-left text-[14px] text-muted-foreground leading-[14px]">
              Enter your details to get started.
            </span>
          </div>
        </div>
        <FormField
          control={registerForm.control}
          name="email"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="johndoe@example.com" {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a User Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="client_hunter">Client Hunter (Hire Freelancers)</SelectItem>
                  <SelectItem value="freelancer">Freelancer (Provide Services)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={registerForm.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} placeholder="Enter Phone Number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="col-span-2 w-full">
          <FormField
            control={registerForm.control}
            name="image_url"
            render={({ field, fieldState }) => (
              <ImageUploader field={field} error={fieldState.error} label="Profile Picture (Optional)" />
            )}
          />
        </div>
        <div className="col-span-2 flex w-full items-center justify-center">
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
        </div>
        <span
          onClick={() => setIsLogin(true)}
          className="col-span-2 w-full cursor-pointer text-center text-[12px] leading-[12px]"
        >
          Already have an account?&nbsp;
          <span className="underline">Login</span>
        </span>
      </form>
    </Form>
  );
}

export default RegisterForm;
