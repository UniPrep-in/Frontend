"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  X,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { IoMdArrowRoundBack } from "react-icons/io";

type ToastState = {
  message: string;
  type: "success" | "error";
};

type IconComponent = typeof Mail;

const supabase = createClient();
const modeTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};
const usernameTransition = {
  duration: 0.34,
  ease: [0.16, 1, 0.3, 1] as const,
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message.toLowerCase().includes("email rate limit exceeded")
    ) {
      return "Too many emails were sent. Please wait a few minutes before trying again.";
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
}

const HeroPanel = memo(function HeroPanel() {
  return (
    <div className="relative hidden w-1/2 lg:block">
      <div className="absolute inset-0 z-10 bg-linear-to-br from-neutral-200/90 to-neutral-500/90 mix-blend-multiply" />
      <Image
        src="/assets/exam.avif"
        alt="Exam preparation"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 text-white backdrop-blur-xs">
        <div>
          <h2 className="mb-3 text-3xl font-bold leading-tight">
            Master your exams with confidence
          </h2>
          <p className="text-sm leading-relaxed opacity-90">
            Join thousands of students achieving their academic goals with our
            intelligent study platform.
          </p>
        </div>
      </div>
    </div>
  );
});

const ToastBanner = memo(function ToastBanner({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed top-4 left-1/2 z-50 flex min-w-[300px] max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-xl ${
        toast.type === "success" ? "border-green-200" : "border-red-200"
      }`}
    >
      <CheckCircle
        className={`h-5 w-5 shrink-0 ${
          toast.type === "success" ? "text-green-600" : "text-red-600"
        }`}
      />
      <p className="flex-1 text-sm font-medium text-slate-700">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-1 transition-colors hover:bg-slate-100"
      >
        <X className="h-4 w-4 text-slate-500" />
      </button>
    </div>
  );
});

const AuthTextField = memo(function AuthTextField({
  label,
  type,
  placeholder,
  value,
  onChange,
  icon: Icon,
  required = true,
  disabled = false,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: IconComponent;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </label>
      <div className="group relative rounded-xl border border-slate-200 bg-slate-50 transform-gpu transition-all duration-200 hover:scale-[1.005] focus-within:scale-[1.01] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-blue-500" />
        <input
          type={type}
          required={required}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl bg-transparent py-3 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </div>
  );
});

const PasswordField = memo(function PasswordField({
  password,
  showPassword,
  loading,
  onChange,
  onToggleVisibility,
  className = "",
}: {
  password: string;
  showPassword: boolean;
  loading: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
        Password
      </label>
      <div className="group relative rounded-xl border border-slate-200 bg-slate-50 transform-gpu transition-all duration-200 hover:scale-[1.005] focus-within:scale-[1.01] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-blue-500" />
        <input
          type={showPassword ? "text" : "password"}
          required
          value={password}
          placeholder="Password"
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl bg-transparent py-3 pr-12 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors duration-200 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-slate-500" />
          ) : (
            <Eye className="h-4 w-4 text-slate-500" />
          )}
        </button>
      </div>
    </div>
  );
});

export default function AuthForm() {
  const router = useRouter();
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleToastClose = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
      return;
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, [toast]);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const handleDisplayNameChange = useCallback((value: string) => {
    setDisplayName(value);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((current) => !current);
  }, []);

  const toggleAuthMode = useCallback(() => {
    setIsLogin((current) => !current);
    setToast(null);
    setShowPassword(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);

      try {
        if (isLogin) {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw error;
          }

          router.replace("/");
          router.refresh();
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() },
          },
        });

        if (error) {
          throw error;
        }

        setToast({
          message: "Check your email for verification",
          type: "success",
        });
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setDisplayName("");
        setShowPassword(false);
      } catch (error) {
        setToast({
          message: getErrorMessage(error),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [displayName, email, isLogin, password, router],
  );

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setToast({
        message: getErrorMessage(error),
        type: "error",
      });
      setLoading(false);
    }
  }, []);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-100 p-4">
      {toast ? <ToastBanner toast={toast} onClose={handleToastClose} /> : null}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200/50"
      >
        <HeroPanel />

        <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-12">
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-4">
              <div className="w-fit rounded-full border border-neutral-200 bg-neutral-100 p-2 shadow-xl">
                <Link href="/">
                  <IoMdArrowRoundBack className="text-xl" />
                </Link>
              </div>
              <motion.h1
                key={isLogin ? "login" : "signup"}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="text-2xl font-bold text-slate-900"
              >
                {isLogin ? "Welcome back" : "Create account"}
              </motion.h1>
            </div>
            <p className="text-sm text-slate-500">
              {isLogin
                ? "Enter your credentials to access your account"
                : "Start your journey to academic excellence"}
            </p>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 shadow transform-gpu transition-all duration-200 hover:scale-[1.01] hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <FcGoogle className="text-xl" />
              <span className="text-sm font-medium text-slate-700">
                Continue with Google
              </span>
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 font-medium text-slate-400">
                  Or Enter Details
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <AuthTextField
                label="Email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={handleEmailChange}
                icon={Mail}
              />

              <motion.div
                initial={false}
                animate={{
                  maxHeight: isLogin ? 0 : 120,
                  opacity: isLogin ? 0 : 1,
                  marginTop: isLogin ? 0 : 20,
                  marginBottom: isLogin ? 0 : 20,
                }}
                transition={usernameTransition}
                className="overflow-hidden"
                aria-hidden={isLogin}
              >
                <div>
                  <AuthTextField
                    label="Display Name"
                    type="text"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={handleDisplayNameChange}
                    icon={User}
                    required={!isLogin}
                    disabled={isLogin}
                  />
                </div>
              </motion.div>

              <PasswordField
                password={password}
                showPassword={showPassword}
                loading={loading}
                onChange={handlePasswordChange}
                onToggleVisibility={togglePasswordVisibility}
                className={isLogin ? "mt-5" : "mt-0"}
              />

              <motion.div
                initial={false}
                animate={{
                  maxHeight: isLogin ? 24 : 0,
                  opacity: isLogin ? 1 : 0,
                  marginTop: isLogin ? 20 : 0,
                }}
                transition={modeTransition}
                className="overflow-hidden"
                aria-hidden={!isLogin}
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    tabIndex={isLogin ? 0 : -1}
                    className="text-xs font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700"
                  >
                    Forgot password?
                  </button>
                </div>
              </motion.div>

              <button
                type="submit"
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-medium text-white shadow-lg shadow-slate-900/20 transform-gpu transition-all duration-200 hover:scale-[1.01] hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLogin ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-700"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
