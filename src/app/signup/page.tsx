import SignUpForm from "@/components/auth/SignUpForm";
import AuthLayout from "@/components/layout/AuthLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Sign Up Page TailAdmin Dashboard Template",
};

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
