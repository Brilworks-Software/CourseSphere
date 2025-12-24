"use client";
import { useMutation } from "@tanstack/react-query";
import { User } from "@/types/user";

interface GetUserResponse {
  user?: User;
  error?: string;
  // ...other response fields...
}

const getUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/users?id=${encodeURIComponent(id)}`);

  const result = (await response.json()) as GetUserResponse;

  if (!response.ok) {
    throw new Error(result?.error || "Failed to sign in");
  }

  if (!result.user) {
    throw new Error("User not found in response");
  }

  return result.user;
};

export function useUser() {
  const mutation = useMutation<User, Error, string>({
    mutationFn: getUser,
    mutationKey: ["user"],
  });

  return {
    // prefer v5's isPending when available, otherwise support legacy isLoading, otherwise derive from status
    isLoadingUser:
      (mutation as any).isPending ??
      (mutation as any).isLoading ??
      ((mutation as any).status === "pending" ||
        (mutation as any).status === "loading"),
    getUser: mutation.mutateAsync,
  };
}
