import { Suspense } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = {
  title: "Reset Password — Best Texas Display",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
