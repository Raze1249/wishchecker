import { Suspense } from "react";
import ReportExperienceForm from "@/components/ReportExperienceForm";
import { getCurrentUser } from "@/server/auth/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReportExperiencePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Share your purchase experience</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your report helps other buyers. Reports enter a moderation queue and are labeled as customer-reported experiences —
        they do not independently establish wrongdoing.
      </p>

      {!user ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          You need an account to submit a verified experience (this helps prevent abuse).{" "}
          <Link href="/login?next=/report-experience" className="font-medium text-emerald-700 hover:underline">Sign in</Link> or{" "}
          <Link href="/register?next=/report-experience" className="font-medium text-emerald-700 hover:underline">create an account</Link>.
        </div>
      ) : (
        <Suspense fallback={<p className="mt-8 text-sm text-slate-500">Loading…</p>}>
          <ReportExperienceForm />
        </Suspense>
      )}
    </div>
  );
}
