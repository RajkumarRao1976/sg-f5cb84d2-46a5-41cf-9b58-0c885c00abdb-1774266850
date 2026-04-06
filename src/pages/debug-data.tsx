import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Eye, EyeOff } from "lucide-react";
import type { User, License } from "@/types";

export default function DebugData() {
  const [users, setUsers] = useState<User[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = () => {
    const allUsers = storage.getUsers();
    const allLicenses = storage.getLicenses();
    setUsers(allUsers);
    setLicenses(allLicenses);
    console.log("📊 All Users:", allUsers);
    console.log("📊 All Licenses:", allLicenses);
  };

  const resetPassword = (email: string) => {
    const allUsers = storage.getUsers();
    const userIndex = allUsers.findIndex(u => u.email === email);
    if (userIndex !== -1) {
      allUsers[userIndex].password = "password123";
      storage.saveUsers(allUsers);
      alert(`Password reset to "password123" for ${email}`);
      loadData();
    }
  };

  if (!mounted) return null;

  return (
    <>
      <SEO title="Data Recovery - LicenseVault" description="Recover your account data" />
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="mb-8 text-center">
            <Database className="h-16 w-16 text-blue-accent mx-auto mb-4" />
            <h1 className="text-3xl font-heading font-bold mb-2">Data Recovery Tool</h1>
            <p className="text-muted-foreground">View and recover your stored data</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading">Registered Users ({users.length})</CardTitle>
              <CardDescription>All accounts in your browser storage</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-muted-foreground">No users found in storage</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showPasswords ? "Hide" : "Show"} Passwords
                    </Button>
                  </div>
                  {users.map((user, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-card">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Password</p>
                          <p className="font-mono">
                            {showPasswords ? user.password : "••••••••"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Notification Email</p>
                          <p className="font-medium">{user.notificationEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">2FA Enabled</p>
                          <p className="font-medium">{user.twoFAEnabled ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email Verified</p>
                          <p className="font-medium">{user.emailVerified ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Created</p>
                          <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resetPassword(user.email)}
                        >
                          Reset Password to "password123"
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            storage.setCurrentUser(user);
                            window.location.href = "/";
                          }}
                        >
                          Login as this user
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Licenses ({licenses.length})</CardTitle>
              <CardDescription>All licenses stored in your browser</CardDescription>
            </CardHeader>
            <CardContent>
              {licenses.length === 0 ? (
                <p className="text-muted-foreground">No licenses found in storage</p>
              ) : (
                <div className="space-y-3">
                  {licenses.map((license, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{license.softwareName}</p>
                          <p className="text-sm text-muted-foreground">
                            {license.category === "Others" ? license.customCategory : license.category}
                            {license.platform && ` - ${license.platform}`}
                          </p>
                        </div>
                        <p className="font-medium">₹{license.priceInINR.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <a href="/auth/login">Go to Login</a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}