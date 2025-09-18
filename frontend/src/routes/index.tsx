import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import LoginBG from "@/assets/img/login-bg.png";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [isLogin, setIsLogin] = useState<boolean>(false);

  return (
    <div className="grid h-screen w-full grid-cols-1 items-center justify-center overflow-hidden lg:grid-cols-2">
      <div className="col-span-1 hidden h-full w-full lg:flex">
        <img src={LoginBG} alt="login-background" className="h-full w-full object-cover antialiased" />
      </div>
      <div className="flex w-full items-center justify-center p-5 xl:p-0">
        {isLogin ? <LoginForm setIsLogin={setIsLogin} /> : <RegisterForm setIsLogin={setIsLogin} />}
      </div>
    </div>
  );
}
