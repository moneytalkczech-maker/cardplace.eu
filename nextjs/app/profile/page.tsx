"use client";
import { Suspense } from "react";
import ProfileView from "@/components/profile/ProfileView";

export default function MyProfilePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-8 animate-pulse"><div className="h-48 rounded-xl bg-[#0B1220]" /></div>}>
      <ProfileView />
    </Suspense>
  );
}
