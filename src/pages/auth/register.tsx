import { SEO } from "@/components/SEO";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle, QrCode, Copy, Check } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import type { User } from "@/types";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);
  const [showQRSetup, setShowQRSetup] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (enable2FA && !twoFASecret) {
      // Generate a random secret for 2FA (32 characters)
      const secret = Array.from({ length: 32 }, () => 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)]
      ).join("");
      setTwoFASecret(secret);
      
      // Generate QR code URL for 2FAS app
      const issuer = "LicenseVault";
      const qrUrl = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
      setQrCodeUrl(qrUrl);
    }
  }, [enable2FA, email, twoFASecret]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (enable2FA && !showQRSetup) {
      setShowQRSetup(true);
      return;
    }

    if (enable2FA && verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    setLoading(true);

    try {
      const users = storage.getUsers();
      
      if (users.some((u) => u.email === email)) {
        setError("Email already registered");
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        email,
        password,
        twoFASecret: enable2FA ? twoFASecret : undefined,
        twoFAEnabled: enable2FA,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      storage.saveUsers(users);
      storage.setCurrentUser(newUser);

      router.push("/");
    } catch (err) {
      setError("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(twoFASecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              {showQRSetup ? "Setup 2FA" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {showQRSetup ? "Scan QR code with 2FAS app" : "Start managing your licenses for free"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {!showQRSetup ? (
                <>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable2fa"
                      checked={enable2FA}
                      onCheckedChange={(checked) => setEnable2FA(checked as boolean)}
                    />
                    <Label htmlFor="enable2fa" className="text-sm font-normal cursor-pointer">
                      Enable Two-Factor Authentication (2FAS)
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {enable2FA ? "Continue to 2FA Setup" : "Create Account"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="bg-secondary p-4 rounded-lg text-center">
                      <QrCode className="h-32 w-32 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Scan this QR code with 2FAS app
                      </p>
                      <div className="text-xs font-mono bg-card p-2 rounded break-all">
                        {qrCodeUrl}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Manual Entry Key</Label>
                      <div className="flex gap-2">
                        <Input value={twoFASecret} readOnly className="font-mono text-xs" />
                        <Button type="button" size="icon" variant="outline" onClick={copySecret}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verification">Verification Code</Label>
                      <Input
                        id="verification"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the 6-digit code from your 2FAS app to verify setup
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="w-full" onClick={() => setShowQRSetup(false)}>
                      Back
                    </Button>
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? "Creating..." : "Complete Registration"}
                    </Button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login" className="text-blue-accent hover:underline font-medium">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}