"use client";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export interface LoginUserData {
  email: string;
  password: string;
}

const loginUser = async ({ email, password }: LoginUserData) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    throw new Error(error?.message || "Failed to sign in");
  }
  return { data, success: true };
};

export function useLogin() {
  const mutation = useMutation({
    mutationFn: loginUser,
    mutationKey: ["login"],
  });

  return {
    isLoggingIn: mutation.isPending, // new in TanStack v5
    login: mutation.mutateAsync,
  };
}
