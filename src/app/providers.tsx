"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { GoogleOneTap } from "@/components/GoogleOneTap";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Renders nothing; shows Google's "Continue as …" prompt to signed-out
          visitors who already have a Google session in this browser. */}
      <GoogleOneTap />
    </QueryClientProvider>
  );
}
