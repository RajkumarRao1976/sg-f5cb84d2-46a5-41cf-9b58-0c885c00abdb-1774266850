import { SEO } from "@/components/SEO";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User as UserIcon, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { User } from "@/types";

export default function Profile() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = storage.getCurrentUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setCurrentUser(user);
    setNotificationEmail(user.notificationEmail);
  }, [router]);

  const handleUpdateEmail = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUser) return;

    const users = storage.getUsers();
    const userIndex = users.findIndex((u) => u.id === currentUser.id);

    if (userIndex === -1) {
      setError("User not found");
      return;
    }

    users[userIndex] = {
      ...users[userIndex],
      notificationEmail: notificationEmail.trim(),
    };

    storage.saveUsers(users);
    storage.setCurrentUser(users[userIndex]);
    setCurrentUser(users[userIndex]);
    setSuccess("Notification email updated successfully!");
  };

  const handleUpdatePassword = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!currentUser) return;

    if (currentPassword !== currentUser.password) {
      setError("Current password is incorrect");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    const users = storage.getUsers();
    const userIndex = users.findIndex((u) => u.id === currentUser.id);

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
    storage.setCurrentUser(users[userIndex]);
    setCurrentUser(users[userIndex]);
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess("Password updated successfully!");
    setLoading(false);
  };

  if (!mounted || !currentUser) return null;

  return (
    <>
      <SEO title="Profile - LicenseVault" description="Manage your account settings" />
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <nav className="border-b bg-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-accent" />
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">LicenseVault</h1>
                <p className="text-xs text-muted-foreground">Developer: Rajkumar Rao.R</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-2">Profile Settings</h2>
            <p className="text-muted-foreground">Manage your account and notification preferences</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-success/10 border-green-success text-green-success">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your login credentials and account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Login Email</Label>
                  <Input value={currentUser.email} disabled />
                  <p className="text-xs text-muted-foreground">Your login email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <Input value={new Date(currentUser.createdAt).toLocaleDateString()} disabled />
                </div>
                <div className="space-y-2">
                  <Label>2FA Status</Label>
                  <Input value={currentUser.twoFAEnabled ? "Enabled" : "Disabled"} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure where you receive license expiry alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notificationEmail">Notification Email</Label>
                    <Input
                      id="notificationEmail"
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Expiry alerts will be sent to this email address
                    </p>
                  </div>
                  <Button type="submit" className="w-full">
                    Update Notification Email
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}