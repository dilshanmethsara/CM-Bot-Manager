import { useState, type FormEvent } from "react";
import { Loader2, Lock, Eye, EyeOff, Mail } from "lucide-react";
import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword]  = useState("");
  const [show,     setShow]      = useState(false);
  const login = useLogin();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      onAuthenticated();
    } catch {
      // error shown via login.error
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="glass w-full max-w-sm space-y-6 rounded-2xl border border-border p-8 shadow-2xl">
        {/* Logo / Icon */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-lg">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Cloud Mint</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Enter your credentials to continue
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dashboard.local"
                className="rounded-xl pl-10"
                autoFocus
                required
              />
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter dashboard password"
                className="rounded-xl pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {login.isError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {login.error instanceof Error
                ? login.error.message
                : "Invalid credentials"}
            </p>
          )}

          <Button
            type="submit"
            disabled={login.isPending || !email || !password}
            className="w-full rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
          >
            {login.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating…
              </>
            ) : (
              "Unlock Dashboard"
            )}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground">
          CM Bot Manager · Protected workspace
        </p>
      </div>
    </div>
  );
}
