"use client";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export interface LoginUserData {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
}

const loginUser = async ({
  email,
  password,
}: LoginUserData): Promise<LoginResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    throw new Error(error?.message || "Failed to sign in");
  }
  return { success: true };
};

export function useLogin() {
  const mutation = useMutation<LoginResult, Error, LoginUserData>({
    mutationFn: loginUser,
    mutationKey: ["login"],
  });

  return {
    isLoggingIn: mutation.isPending, // new in TanStack v5
    login: mutation.mutateAsync,
  };
}
