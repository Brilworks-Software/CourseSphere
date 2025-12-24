// "use client";
// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   ReactNode,
// } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { supabase } from "@/lib/supabaseClient";
// import { User as AppUser } from "@/types/user";

// interface AuthContextType {
//   user: AppUser | null;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;
//   register: (
//     data: RegisterData
//   ) => Promise<{ success: boolean; error?: string }>;
// }

// interface RegisterData {
//   email: string;
//   password: string;
//   firstName?: string;
//   lastName?: string;
//   role: string;
//   organizationId?: string;
//   profilePicture?: File | null;
//   gender?: string;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<AppUser | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const router = useRouter();
//   const pathname = usePathname();

//   // Fetch user from Supabase session and users table
//   const fetchUser = async () => {
//     setIsLoading(true);
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();
//     if (!session) {
//       setUser(null);
//       setIsLoading(false);
//       return;
//     }
//     const {
//       data: { user: authUser },
//     } = await supabase.auth.getUser();
//     if (!authUser) {
//       setUser(null);
//       setIsLoading(false);
//       return;
//     }
//     // Fetch from users table
//     const { data: userData } = await supabase
//       .from("users")
//       .select("*")
//       .eq("id", authUser.id)
//       .single();
//     if (userData) {
//       setUser({ ...userData });
//     } else {
//       setUser(null);
//     }
//     setIsLoading(false);
//   };

//   // On mount, fetch user
//   useEffect(() => {
//     fetchUser();
//     // Listen for auth state changes
//     const { data: listener } = supabase.auth.onAuthStateChange((event) => {
//       if (event === "SIGNED_OUT") {
//         setUser(null);
//         if (
//           pathname.startsWith("/private") ||
//           pathname.startsWith("/(private)")
//         ) {
//           router.replace("/login");
//         }
//       } else {
//         fetchUser();
//       }
//     });
//     return () => {
//       listener?.subscription.unsubscribe();
//     };
//     // eslint-disable-next-line
//   }, []);

//   // Protect private routes (only after loading is done)
//   useEffect(() => {
//     if (isLoading) return; // Wait for loading to finish
//     if (
//       !user &&
//       (pathname.startsWith("/private") || pathname.startsWith("/(private)"))
//     ) {
//       router.replace("/login");
//     }
//   }, [isLoading, user, pathname, router]);

//   // Login function
//   const login = async (email: string, password: string) => {
//     setIsLoading(true);
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });
//     if (error || !data.session) {
//       setIsLoading(false);
//       throw new Error(error?.message || "Login failed");
//     }
//     await fetchUser();
//     setIsLoading(false);
//     // Do not redirect here; let the login form handle navigation after successful login
//   };

//   // Logout function
//   const logout = async () => {
//     setIsLoading(true);
//     await supabase.auth.signOut();
//     setUser(null);
//     setIsLoading(false);
//     router.replace("/login");
//   };

//   // Register function
//   const register = async (data: RegisterData) => {
//     setIsLoading(true);
//     // Call your API route for registration (which uses Supabase Auth + users table)
//     const res = await fetch("/api/auth/register", {
//       method: "POST",
//       body: JSON.stringify(data),
//       headers: { "Content-Type": "application/json" },
//     });
//     const result = await res.json();
//     setIsLoading(false);
//     if (!res.ok) {
//       return { success: false, error: result.error || "Registration failed" };
//     }
//     return { success: true };
//   };

//   // Always wrap the entire app in the provider so all children have access
//   return (
//     <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// }
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useUserContext } from "./user-context";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface RegisterData {
  email: string;
  password: string;
  role: string;
}

interface AuthContextType {
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean }>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { setUser } = useUserContext();
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    // Get user from Supabase Auth
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      // Call API route with user id
      const res = await fetch(
        `/api/users?id=${encodeURIComponent(authUser.id)}`
      );
      const data = await res.json();
      setUser(res.ok ? data?.user ?? null : null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchUser();
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, action: "login" }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error("Login failed");
        setUser(data.user);
      } finally {
        setIsLoading(false);
      }
    },
    [setUser]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, action: "register" }),
      });

      const result = await res.json();
      if (!res.ok) return { success: false };
      setUser(result.user);
      return { success: true };
    },
    [setUser]
  );

  // const logout = useCallback(() => {
  //   setUser(null);
  // }, [setUser]);
  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
    router.replace("/login");
  };

  const refetchUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const value = useMemo(
    () => ({ isLoading, login, logout, register, refetchUser }),
    [isLoading, login, logout, register, refetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
