"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Logo from "./logo";
import { useRouter } from "next/navigation";
import { useSignUp } from "@/app/hooks/auth/useSignup";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function SignupForm() {
  const router = useRouter();
  const { isSigningUp, signUp } = useSignUp();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [signUpForm, setSignUpForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as "student" | "admin",
  });

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const { firstName, lastName, email, password, confirmPassword, role } =
      signUpForm;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error("Missing fields", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password mismatch", {
        description: "Password and confirm password do not match.",
      });
      return;
    }

    if (password.length < 6) {
      toast.error("Weak password", {
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    try {
      setIsLoading(true);

      await signUp({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      setIsLoading(false);
      toast.success("Account created", {
        description:
          "User created successfully! Please check your email to verify your account.",
      });
      router.push("/login");
    } catch (err: any) {
      setIsLoading(false);
      console.error("User register failed:", err?.message ?? err);
      const message = err?.message ?? "Failed to sign up user";
      setError(message);
      toast.error("Sign up failed", { description: message });
    }
  };

  return (
    <div className="w-full max-w-lg relative overflow-hidden border-8 rounded-2xl shadow-lg mx-auto">
      <div className="w-[90%] mx-auto rounded-full top-[-5%] h-44 absolute bg-primary blur-2xl"></div>
      <div className="relative z-10 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl shadow-lg">
              <Logo />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">Create your account</h2>
          <p className="mb-0">Start your learning journey</p>
        </div>

        <form className="space-y-6" onSubmit={handleSignup}>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Sign up failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="first-name">First name</FieldLabel>
              <Input
                id="first-name"
                name="firstName"
                type="text"
                required
                placeholder="John"
                value={signUpForm.firstName}
                onChange={(e) =>
                  setSignUpForm((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="last-name">Last name</FieldLabel>
              <Input
                id="last-name"
                name="lastName"
                type="text"
                required
                placeholder="Doe"
                value={signUpForm.lastName}
                onChange={(e) =>
                  setSignUpForm((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={signUpForm.email}
                onChange={(e) =>
                  setSignUpForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Create a password"
                  value={signUpForm.password}
                  onChange={(e) =>
                    setSignUpForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <div className="relative">
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Confirm your password"
                  value={signUpForm.confirmPassword}
                  onChange={(e) =>
                    setSignUpForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="role">I want to</FieldLabel>
              <Select
                value={signUpForm.role}
                onValueChange={(val) =>
                  setSignUpForm((prev) => ({
                    ...prev,
                    role: val as "student" | "admin",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Learn from courses</SelectItem>
                  <SelectItem value="admin">
                    Teach and create courses
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <Button
                type="submit"
                disabled={isSigningUp || isLoading}
                className="w-full"
              >
                {isSigningUp || isLoading ? (
                  <span className="flex items-center">
                    <Spinner className="h-5 w-5 mr-2" />
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </Button>
            </Field>

            <Field>
              <FieldDescription className="text-center">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold">
                  Sign in
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
