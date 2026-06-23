"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const verifyResponse = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!verifyResponse.ok) {
      const payload = (await verifyResponse.json().catch(() => null)) as
        | { message?: string }
        | null;
      toast.error(payload?.message ?? "Invalid admin credentials");
      setLoading(false);
      return;
    }

    setAuth(
      {
        id: "env-admin",
        email: email.trim().toLowerCase(),
        role: "super_admin",
      },
      "env-admin-session",
    );

    toast.success("Welcome to GehnaHub Admin");
    router.replace("/dashboard");
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <form
        onSubmit={onSubmit}
        className="premium-card w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
      >
        <div className="flex flex-col items-center space-y-4 text-center">
          <Logo />
          <p className="text-sm text-slate-600">
            Secure access for GehnaHub marketplace administrators
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-600">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-600">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors duration-200 hover:text-blue-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
