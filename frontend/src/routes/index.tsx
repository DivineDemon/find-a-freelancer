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
    <div className="grid h-screen w-full grid-cols-2 items-center justify-center overflow-hidden">
      <div className="col-span-1 h-full w-full">
        <img src={LoginBG} alt="login-background" className="h-full w-full object-cover antialiased" />
      </div>
      <div className="flex w-full items-center justify-center">
        {isLogin ? <LoginForm setIsLogin={setIsLogin} /> : <RegisterForm setIsLogin={setIsLogin} />}
      </div>
    </div>
  );
}
