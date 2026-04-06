import { SEO } from "@/components/SEO";
import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Debug: Check localStorage directly
    console.log("=== FORGOT PASSWORD DEBUG ===");
    const rawUsers = localStorage.getItem("users");
    console.log("Raw users data from localStorage:", rawUsers);
    
    const users = storage.getUsers();
    console.log("Parsed users:", users);
    console.log("Number of users found:", users.length);
    console.log("All registered emails:", users.map(u => u.email));
    console.log("Email being searched:", email);

    if (users.length === 0) {
      setError("No users found in system. Please check /emergency-export to see your data.");
      setLoading(false);
      return;
    }

    // Try case-insensitive match
    const user = users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    
    console.log("User lookup result:", user ? "FOUND" : "NOT FOUND");

    if (!user) {
      console.log("❌ Email not found in registered users");
      const availableEmails = users.map(u => u.email).join(", ");
      setError(`No account found. Available emails in system: ${availableEmails}. Visit /emergency-export to download your data with passwords.`);
      setLoading(false);
      return;
    }

    console.log("✅ User found:", user);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otpCode);

    setSuccess(`Verification code sent! Use this OTP: ${otpCode}`);
    setStep("otp");
    setLoading(false);

    console.log(`📧 OTP Code: ${otpCode}`);
  };

  const handleVerifyOTP = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (otp !== generatedOTP) {
      setError("Invalid OTP. Please check and try again.");
      setLoading(false);
      return;
    }

    setSuccess("OTP verified! Please set your new password.");
    setStep("password");
    setLoading(false);
  };

  const handleResetPassword = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Update user's password
    const users = storage.getUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      setError("User not found");
      setLoading(false);
      return;
    }

    users[userIndex] = {
      ...users[userIndex],
      password: newPassword,
    };

    storage.saveUsers(users);
    
    console.log("✅ Password updated successfully for:", email);

    setSuccess("Password reset successful! Redirecting to login...");
    setLoading(false);

    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
  };

  return (
    <>
      <SEO title="Forgot Password - LicenseVault" description="Reset your password" />
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-blue-accent/10">
                <Shield className="h-10 w-10 text-blue-accent" />
              </div>
            </div>
            <CardTitle className="text-2xl font-heading font-bold">
              {step === "email" && "Forgot Password?"}
              {step === "otp" && "Verify OTP"}
              {step === "password" && "Reset Password"}
            </CardTitle>
            <CardDescription>
              {step === "email" && "Enter your email to receive a verification code"}
              {step === "otp" && "Enter the 6-digit code sent to your email"}
              {step === "password" && "Create a new password for your account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-success/10 border-green-success text-green-success">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {step === "email" && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send OTP"}
                </Button>

                <div className="text-center">
                  <Link href="/auth/login" className="text-sm text-blue-accent hover:underline">
                    <ArrowLeft className="inline h-3 w-3 mr-1" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="p-4 bg-blue-accent/5 border border-blue-accent/20 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">Verification Code (Demo)</p>
                  <p className="text-2xl font-mono font-bold text-blue-accent tracking-wider">{generatedOTP}</p>
                  <p className="text-xs text-muted-foreground mt-2">Use this code to verify</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-widest"
                    required
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm"
                    onClick={() => {
                      const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
                      setGeneratedOTP(newOTP);
                      setSuccess("New OTP sent!");
                      console.log(`📧 New OTP: ${newOTP}`);
                    }}
                  >
                    Resend OTP
                  </Button>
                </div>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}

            <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
              <p>Developer: Rajkumar Rao.R</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}