import { SEO } from "@/components/SEO";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, Lock, Key, CheckCircle } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp" | "2fa">("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFASecret, setTwoFASecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

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

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otpCode);

    setSuccess(`Verification code sent to ${email}`);
    setStep("otp");
    setLoading(false);

    console.log(`📧 Email Verification OTP: ${otpCode}`);
  };

  const handleOTPVerify = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (otp !== generatedOTP) {
      setError("Invalid OTP code. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess("Email verified! Would you like to enable 2FA?");
    setStep("2fa");
    setLoading(false);
  };

  const handleEnable2FA = async () => {
    const secret = Math.random().toString(36).substring(2, 15);
    setTwoFASecret(secret);

    const otpauth = `otpauth://totp/LicenseVault:${email}?secret=${secret}&issuer=LicenseVault`;
    const qr = await QRCode.toDataURL(otpauth);
    setQrCodeUrl(qr);
  };

  const handleSkip2FA = async () => {
    await createAccount(false);
  };

  const handleVerify2FA = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (twoFACode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    await createAccount(true);
  };

  const createAccount = async (with2FA: boolean) => {
    setLoading(true);
    setError("");

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

      // Update profile with notification email and 2FA settings
      const { error: profileError } = await profileService.updateProfile(user.id, {
        notification_email: notificationEmail || email,
        two_fa_enabled: with2FA,
        two_fa_secret: with2FA ? twoFASecret : null,
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
    } finally {
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
              {step === "details" && "Create Account"}
              {step === "emailOTP" && "Verify Email"}
              {step === "2faSetup" && "Setup 2FA"}
            </CardTitle>
            <CardDescription>
              {step === "details" && "Start managing your licenses for free"}
              {step === "emailOTP" && "Enter the OTP sent to your email"}
              {step === "2faSetup" && "Scan QR code with 2FAS app"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === "details" && (
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
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
                    placeholder="Optional - defaults to login email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Receive license expiry alerts at this email
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
                <Button type="submit" className="w-full" size="lg">
                  Continue to Email Verification
                </Button>
              </form>
            )}

            {step === "emailOTP" && (
              <form onSubmit={handleEmailOTPVerify} className="space-y-4">
                <Alert className="bg-blue-accent/10 border-blue-accent">
                  <Mail className="h-4 w-4 text-blue-accent" />
                  <AlertDescription className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">OTP: {generatedOTP}</span>
                      <Button type="button" size="sm" variant="ghost" onClick={copyOTP}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs mt-1 text-muted-foreground">
                      (Simulated - in production, this would be sent to {email})
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP *</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={enteredOTP}
                    onChange={(e) => setEnteredOTP(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      setStep("details");
                      setEnteredOTP("");
                      setGeneratedOTP("");
                    }}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="w-full" size="lg">
                    Verify Email
                  </Button>
                </div>
              </form>
            )}

            {step === "2faSetup" && (
              <form onSubmit={handle2FASetup} className="space-y-4">
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
                    <Label htmlFor="verification">Verification Code *</Label>
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setStep("emailOTP")}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Creating..." : "Complete Registration"}
                  </Button>
                </div>
              </form>
            )}

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