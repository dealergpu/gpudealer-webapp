import { Suspense, type ReactNode } from "react";
import { CompareTray } from "@/components/compute/CompareSelection";

export default function ComputeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {/* Reads the URL, so it needs its own Suspense boundary. */}
      <Suspense fallback={null}>
        <CompareTray />
      </Suspense>
    </>
  );
}
