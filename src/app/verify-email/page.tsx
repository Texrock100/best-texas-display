import { Suspense } from "react";
import VerifyEmailClient from "@/components/VerifyEmailClient";

export const metadata = {
  title: "Confirm Email — Best Texas Display",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
