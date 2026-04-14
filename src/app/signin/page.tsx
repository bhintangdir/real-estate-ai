import SignInForm from "@/components/auth/SignInForm";
import AuthLayout from "@/components/layout/AuthLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Sign In Page TailAdmin Dashboard Template",
};

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
