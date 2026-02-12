import { useState, useCallback } from "react";

export interface SignupUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface SignupResult {
  success: boolean;
}

const signUpUser = async (userData: SignupUserData) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || "Signup failed");
  }

  return { success: true };
};

export const useSignUp = () => {
  const [isSigningUp, setIsSigningUp] = useState(false);

  const signUp = useCallback(async (userData: SignupUserData) => {
    setIsSigningUp(true);
    try {
      const res = await signUpUser(userData);
      setIsSigningUp(false);
      return res;
    } catch (err) {
      setIsSigningUp(false);
      throw err;
    }
  }, []);

  return {
    isSigningUp,
    signUp,
  };
};
