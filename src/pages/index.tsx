import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, Database, Download } from "lucide-react";
import Link from "next/link";
import type { User } from "@/types";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentUser(storage.getCurrentUser());
  }, []);

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
                <h1 className="text-2xl font-heading font-bold text-foreground">LicenseVault</h1>
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
            <div className="mb-8">
              <h2 className="text-3xl font-heading font-bold text-foreground mb-2">Welcome back, {currentUser.email}</h2>
              <p className="text-muted-foreground">Manage your software licenses with ease</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Licenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-foreground">0</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-green-success">0</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-amber-warning">0</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-foreground">₹0.00</div>
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
                <span>Lifetime Free Hosting</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Lifetime Free Database</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Export & Restore</span>
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