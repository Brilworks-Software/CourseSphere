"use client";
import { AuthProvider } from "@/app/provider/AuthProvider";
import { UserProvider } from "@/app/provider/user-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense, useState, ReactNode } from "react";

interface ProviderProps {
  children: ReactNode;
}

const Provider = ({ children }: ProviderProps): React.ReactElement => {
  const [queryClient] = useState<QueryClient>(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 0,
          },
        },
      })
  );

  return (
    <Suspense
    // fallback={
    //   <div className="h-screen flex justify-center items-center">
    //     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    //   </div>
    // }
    >
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <UserProvider>
            <AuthProvider>{children}</AuthProvider>
          </UserProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </Suspense>
  );
};

export default Provider;
