import { SEO } from "@/components/SEO";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError, user } = await authService.signUp(
        email,
        password
      );

      if (signUpError) {
        setError(signUpError.message || "Registration failed");
        setLoading(false);
        return;
      }

      if (!user) {
        setError("Failed to create user account");
        setLoading(false);
        return;
      }

      // Update profile with notification email
      const { error: profileError } = await profileService.updateProfile(user.id, {
        notification_email: notificationEmail || email,
      });

      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <SEO title="Register - LicenseVault" description="Create your free LicenseVault account" />
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-accent" />
            </div>
            <CardTitle className="text-3xl font-heading font-bold">
              Create Account
            </CardTitle>
            <CardDescription>
              Start managing your licenses securely
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4 bg-green-success/10 text-green-success border-green-success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Login Email *</Label>
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
                <Label htmlFor="notificationEmail">Notification Email</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  placeholder="Where to send expiry alerts"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Defaults to login email. Used for expiry alerts.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating account..." : "Register"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login" className="text-blue-accent hover:underline font-medium">
                Login
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