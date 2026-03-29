import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, Database, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import type { User, License } from "@/types";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    setMounted(true);
    const user = storage.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      calculateStats();
    }
  }, []);

  const calculateStats = () => {
    const licenses = storage.getLicenses();
    const now = new Date();

    const active = licenses.filter((l) => {
      if (l.licenseType === "Perpetual") return true;
      if (l.renewalDate) {
        const renewalDate = new Date(l.renewalDate);
        return renewalDate > now;
      }
      return false;
    }).length;

    const expiringSoon = licenses.filter((l) => {
      if (l.licenseType === "Subscription" && l.renewalDate && l.renewalAlarmDays) {
        const renewalDate = new Date(l.renewalDate);
        const alarmDate = new Date(renewalDate.getTime() - l.renewalAlarmDays * 24 * 60 * 60 * 1000);
        return alarmDate <= now && renewalDate > now;
      }
      return false;
    }).length;

    const totalSpent = licenses.reduce((sum, l) => sum + (l.priceInINR || 0), 0);

    setStats({
      total: licenses.length,
      active,
      expiringSoon,
      totalSpent,
    });
  };

  const populateSampleData = () => {
    if (!currentUser) return;

    const nowStr = new Date().toISOString();

    const sampleLicenses: Omit<License, "id">[] = [
      {
        softwareName: "Adobe Premiere Pro",
        category: "Video Editing",
        licenseType: "Subscription",
        purchaseDate: "2024-01-15",
        renewalDate: "2025-01-15",
        renewalAlarmDays: 30,
        currency: "USD",
        price: 54.99,
        priceInINR: 4591.67,
        licenseKey: "ABCD-1234-EFGH-5678",
        username: "",
        password: "",
        downloadUrl: "https://adobe.com/premiere",
        customCategory: "",
        createdAt: nowStr,
        updatedAt: nowStr,
      },
      {
        softwareName: "FL Studio Producer Edition",
        category: "Music Production",
        licenseType: "Perpetual",
        purchaseDate: "2023-06-10",
        renewalDate: "",
        renewalAlarmDays: 0,
        currency: "USD",
        price: 199,
        priceInINR: 16616.50,
        licenseKey: "FL-PROD-9876-5432-1098",
        username: "",
        password: "",
        downloadUrl: "https://image-line.com",
        customCategory: "",
        createdAt: nowStr,
        updatedAt: nowStr,
      },
      {
        softwareName: "Tableau Desktop",
        category: "Data Analytics",
        licenseType: "Subscription",
        purchaseDate: "2024-03-01",
        renewalDate: "2024-12-31",
        renewalAlarmDays: 15,
        currency: "USD",
        price: 70,
        priceInINR: 5845,
        licenseKey: "",
        username: "raj.kumar@example.com",
        password: "TableauPass2024!",
        downloadUrl: "https://tableau.com/download",
        customCategory: "",
        createdAt: nowStr,
        updatedAt: nowStr,
      },
      {
        softwareName: "JetBrains IntelliJ IDEA Ultimate",
        category: "Development",
        licenseType: "Subscription",
        purchaseDate: "2024-02-01",
        renewalDate: "2025-02-01",
        renewalAlarmDays: 30,
        currency: "EURO",
        price: 149,
        priceInINR: 13588.80,
        licenseKey: "IDEA-ULTIMATE-KEY-2024",
        username: "",
        password: "",
        downloadUrl: "https://jetbrains.com/idea",
        customCategory: "",
        createdAt: nowStr,
        updatedAt: nowStr,
      },
      {
        softwareName: "Microsoft Office 365",
        category: "Productivity",
        licenseType: "Subscription",
        purchaseDate: "2024-01-01",
        renewalDate: "2025-01-01",
        renewalAlarmDays: 30,
        currency: "INR",
        price: 4899,
        priceInINR: 4899,
        licenseKey: "",
        username: "rajkumar.rao@hotmail.com",
        password: "Office365Pass!",
        downloadUrl: "https://office.com",
        customCategory: "",
        createdAt: nowStr,
        updatedAt: nowStr,
      },
    ];

    const currentLicenses = storage.getLicenses();
    const newLicenses = sampleLicenses.map((license) => ({
      ...license,
      id: crypto.randomUUID(),
    }));

    storage.saveLicenses([...currentLicenses, ...newLicenses]);
    calculateStats();
  };

  if (!mounted) return null;

  if (currentUser) {
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
              <Button
                variant="outline"
                onClick={() => {
                  storage.setCurrentUser(null);
                  setCurrentUser(null);
                }}
              >
                Logout
              </Button>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
                  Welcome back, {currentUser.email}
                </h2>
                <p className="text-muted-foreground">Manage your software licenses with ease</p>
              </div>
              {stats.total === 0 && (
                <Button onClick={populateSampleData} variant="outline" size="sm">
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

  return (
    <>
      <SEO title="LicenseVault - Professional Software License Management" description="Manage all your software licenses in one secure place" />
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="h-16 w-16 text-white" />
              <h1 className="text-5xl font-heading font-bold text-white">LicenseVault</h1>
            </div>
            <p className="text-xl text-white/90 mb-8">Professional Software License Management</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Developer: Rajkumar Rao.R</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Ultra Secure Database</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Backup & Restore</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/auth/login">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl">Login</CardTitle>
                  <CardDescription>Access your license vault</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="lg">
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/auth/register">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl">Register</CardTitle>
                  <CardDescription>Create your free account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" size="lg">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}