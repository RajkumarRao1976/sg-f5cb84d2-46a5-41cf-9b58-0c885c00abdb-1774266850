import { SEO } from "@/components/SEO";
import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [needsTwoFA, setNeedsTwoFA] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const users = storage.getUsers();
      const user = users.find((u) => u.email === email && u.password === password);

      if (!user) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      if (user.twoFAEnabled) {
        setNeedsTwoFA(true);
        setLoading(false);
        return;
      }

      storage.setCurrentUser(user);
      router.push("/");
    } catch (err) {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleTwoFAVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const users = storage.getUsers();
      const user = users.find((u) => u.email === email && u.password === password);

      if (!user) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      // For demo purposes, accept any 6-digit code
      // In production, this would verify against TOTP
      if (twoFACode.length !== 6) {
        setError("Invalid 2FA code");
        setLoading(false);
        return;
      }

      storage.setCurrentUser(user);
      router.push("/");
    } catch (err) {
      setError("2FA verification failed");
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Login - LicenseVault" description="Sign in to your license management dashboard" />
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-accent" />
            </div>
            <CardTitle className="text-3xl font-heading font-bold">
              {needsTwoFA ? "Two-Factor Authentication" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {needsTwoFA ? "Enter your 2FA code from 2FAS app" : "Sign in to your LicenseVault account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!needsTwoFA ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="text-right">
                    <Link href="/auth/forgot-password" className="text-sm text-blue-accent hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleTwoFAVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="twofa">6-Digit Code</Label>
                  <Input
                    id="twofa"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setNeedsTwoFA(false)}>
                  Back to Login
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/register" className="text-blue-accent hover:underline font-medium">
                Register
              </Link>
            </div>

            <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
              <p>Developer: Rajkumar Rao.R</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}