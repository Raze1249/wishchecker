import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500">Loading…</div>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
