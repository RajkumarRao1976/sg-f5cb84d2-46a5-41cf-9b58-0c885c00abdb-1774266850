import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, Database, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/integrations/supabase/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { authService } from "@/services/authService";
import { licenseService } from "@/services/licenseService";
import { formatCurrency } from "@/lib/currency";

type License = Database["public"]["Tables"]["licenses"]["Row"];

const CATEGORY_COLORS: Record<string, string> = {
  "Music Production": "#8B5CF6",
  "Video Editing": "#EF4444",
  "Data Analytics": "#3B82F6",
  "Development": "#10B981",
  "Productivity": "#F59E0B",
  "Mobile Management": "#EC4899",
  "SDK Tool Kit": "#6366F1",
  "Musical Instruments": "#14B8A6",
  "MIDI Gear": "#A855F7",
  "Music Hardware": "#F97316",
  "Storage Devices": "#06B6D4",
  "Workstation": "#84CC16",
  "Monthly Subscriptions": "#F43F5E",
  "Mobile Application": "#8B5CF6",
  "Mobile Application - iOS": "#A78BFA",
  "Mobile Application - Android": "#10B981",
  "Others": "#64748B",
};

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    totalSpent: 0,
  });
  const [categoryData, setCategoryData] = useState<Array<{ category: string; amount: number }>>([]);
  const [expiringLicenses, setExpiringLicenses] = useState<License[]>([]);

  useEffect(() => {
    setMounted(true);
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const session = await authService.getCurrentSession();
    if (!session) {
      router.push("/auth/login");
      return;
    }

    setUserId(session.user.id);
    setNotificationEmail(session.user.email || "");
    await calculateStats(session.user.id);
    await checkExpiringLicenses(session.user.id);
  };

  const calculateStats = async (uid: string) => {
    const { data: licenses } = await licenseService.getLicenses(uid);

    const total = licenses.length;
    const totalSpent = licenses.reduce((sum, l) => sum + (l.price_in_inr || 0), 0);

    // Calculate active licenses
    const now = new Date();
    const active = licenses.filter((l) => {
      if (l.license_type === "Perpetual") return true;
      if (l.renewal_date) {
        return new Date(l.renewal_date) > now;
      }
      return false;
    }).length;

    // Calculate expiring soon
    const expiring = licenses.filter((l) => {
      if (l.license_type === "Subscription" && l.renewal_date && l.renewal_alarm_days) {
        const renewalDate = new Date(l.renewal_date);
        const alarmDate = new Date(renewalDate.getTime() - l.renewal_alarm_days * 24 * 60 * 60 * 1000);
        return alarmDate <= now && renewalDate > now;
      }
      return false;
    }).length;

    setStats({ total, active, expiringSoon: expiring, totalSpent });

    // Calculate spending by category
    const categorySpending: Record<string, number> = {};
    licenses.forEach((l) => {
      let cat = l.custom_category || l.category;
      if (l.category === "Mobile Application" && l.platform) {
        cat = `Mobile Application - ${l.platform}`;
      }
      categorySpending[cat] = (categorySpending[cat] || 0) + (l.price_in_inr || 0);
    });

    const chartData = Object.entries(categorySpending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    setCategoryData(chartData);
  };

  const checkExpiringLicenses = async (uid: string) => {
    const { data: expiring } = await licenseService.getExpiringLicenses(uid);
    setExpiringLicenses(expiring);

    if (expiring.length > 0 && notificationEmail) {
      sendExpiryNotification(expiring, notificationEmail);
    }
  };

  const sendExpiryNotification = (licenses: License[], email: string) => {
    if (licenses.length === 1) {
      const license = licenses[0];
      const daysUntilExpiry = Math.ceil((new Date(license.renewal_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      console.log(`📧 Email notification sent to ${email}:`);
      console.log(`Subject: License Expiring Soon - ${license.software_name}`);
      console.log(`Your ${license.software_name} license will expire in ${daysUntilExpiry} days on ${new Date(license.renewal_date!).toLocaleDateString()}.`);
    } else {
      console.log(`📧 Email notification sent to ${email}:`);
      console.log(`Subject: ${licenses.length} Licenses Expiring Soon`);
      console.log(`The following licenses are expiring soon:`);
      licenses.forEach((l) => {
        const daysUntilExpiry = Math.ceil((new Date(l.renewal_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        console.log(`- ${l.software_name} (expires in ${daysUntilExpiry} days)`);
      });
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    router.push("/auth/login");
  };

  if (!mounted) return null;

  return (
    <>
      <SEO title="Dashboard - LicenseVault" description="Manage your software licenses" />
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
            <div className="flex items-center gap-3">
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  Profile
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
                Welcome back, {notificationEmail}
              </h2>
              <p className="text-muted-foreground">Manage your software licenses with ease</p>
            </div>
            {stats.total === 0 && (
              <Button onClick={() => {}} variant="outline" size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Populate Sample Data
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Licenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold text-foreground">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold text-green-success">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold text-amber-warning">{stats.expiringSoon}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold text-foreground">
                  ₹{stats.totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          {expiringLicenses.length > 0 && (
            <Card className="mb-8 border-amber-warning bg-amber-warning/5">
              <CardHeader>
                <CardTitle className="font-heading text-amber-warning">
                  ⚠️ {expiringLicenses.length === 1 ? "License Expiring Soon" : `${expiringLicenses.length} Licenses Expiring Soon`}
                </CardTitle>
                <CardDescription>
                  {expiringLicenses.length === 1 
                    ? "Action required to renew your license"
                    : "Multiple licenses require your attention"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expiringLicenses.map((license) => {
                    const daysUntilExpiry = Math.ceil((new Date(license.renewal_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={license.id} className="flex justify-between items-center p-3 bg-card rounded-lg border border-amber-warning/20">
                        <div>
                          <p className="font-medium text-foreground">{license.software_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires in {daysUntilExpiry} days ({new Date(license.renewal_date!).toLocaleDateString()})
                          </p>
                        </div>
                        <Link href={`/licenses/edit/${license.id}`}>
                          <Button variant="outline" size="sm">
                            Update
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  📧 Email notifications sent to: {notificationEmail}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-heading">Spending by Category</CardTitle>
              <CardDescription>Total INR spent on each software category</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                      tickFormatter={(value) => `₹${value.toLocaleString("en-IN")}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CATEGORY_COLORS[entry.category] || "#3B82F6"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No spending data available. Add licenses to see the breakdown.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Quick Actions</CardTitle>
              <CardDescription>Get started with managing your licenses</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Link href="/licenses/new">
                <Button className="w-full" size="lg">
                  <Key className="mr-2 h-5 w-5" />
                  Add New License
                </Button>
              </Link>
              <Link href="/licenses">
                <Button variant="outline" className="w-full" size="lg">
                  <Database className="mr-2 h-5 w-5" />
                  View All Licenses
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}