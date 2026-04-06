import { SEO } from "@/components/SEO";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import { convertToINR } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Database } from "@/integrations/supabase/types";
import { authService } from "@/services/authService";
import { licenseService } from "@/services/licenseService";

type License = Database["public"]["Tables"]["licenses"]["Row"];

export default function EditLicense() {
  const router = useRouter();
  const { id } = router.query;
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [license, setLicense] = useState<License | null>(null);
  
  const [formData, setFormData] = useState({
    softwareName: "",
    category: "",
    customCategory: "",
    platform: "",
    licenseType: "Perpetual" as "Perpetual" | "Subscription",
    licenseKey: "",
    username: "",
    password: "",
    downloadUrl: "",
    purchaseDate: "",
    renewalDate: "",
    renewalAlarmDays: 30,
    price: "",
    currency: "INR" as "USD" | "EURO" | "INR",
  });

  useEffect(() => {
    setMounted(true);
    checkAuthAndLoadLicense();
  }, [id]);

  const checkAuthAndLoadLicense = async () => {
    const { session } = await authService.getSession();
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setUserId(session.user.id);

    if (id && typeof id === "string") {
      const { data: foundLicense, error } = await licenseService.getLicenseById(id, session.user.id);
      
      if (error || !foundLicense) {
        router.push("/licenses");
        return;
      }

      setLicense(foundLicense);
      setFormData({
        softwareName: foundLicense.software_name,
        category: foundLicense.category,
        customCategory: foundLicense.custom_category || "",
        platform: foundLicense.platform || "",
        licenseType: foundLicense.license_type,
        licenseKey: foundLicense.license_key || "",
        username: foundLicense.username || "",
        password: foundLicense.password || "",
        downloadUrl: foundLicense.download_url || "",
        purchaseDate: foundLicense.purchase_date,
        renewalDate: foundLicense.renewal_date || "",
        renewalAlarmDays: foundLicense.renewal_alarm_days || 30,
        price: foundLicense.price.toString(),
        currency: foundLicense.currency,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.softwareName.trim()) {
      setError("Software name is required");
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError("Category is required");
      setLoading(false);
      return;
    }

    if (formData.category === "Others" && !formData.customCategory.trim()) {
      setError("Custom category is required when 'Others' is selected");
      setLoading(false);
      return;
    }

    if (formData.category === "Mobile Application" && !formData.platform) {
      setError("Platform (iOS or Android) is required for Mobile Application");
      setLoading(false);
      return;
    }

    if (formData.licenseType === "Subscription" && !formData.renewalDate) {
      setError("Renewal date is required for subscription licenses");
      setLoading(false);
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setError("Valid price is required");
      setLoading(false);
      return;
    }

    if (formData.licenseKey && formData.licenseKey.length > 3000) {
      setError("License key cannot exceed 3000 characters");
      setLoading(false);
      return;
    }

    const priceInINR = convertToINR(Number(formData.price), formData.currency);

    const { error: updateError } = await licenseService.updateLicense(
      id as string,
      userId!,
      {
        software_name: formData.softwareName.trim(),
        category: formData.category,
        custom_category: formData.category === "Others" ? formData.customCategory.trim() : null,
        platform: formData.category === "Mobile Application" ? formData.platform : null,
        license_type: formData.licenseType,
        license_key: formData.licenseKey.trim() || null,
        username: formData.username.trim() || null,
        password: formData.password.trim() || null,
        download_url: formData.downloadUrl.trim() || null,
        purchase_date: formData.purchaseDate,
        renewal_date: formData.licenseType === "Subscription" ? formData.renewalDate : null,
        renewal_alarm_days: formData.licenseType === "Subscription" ? formData.renewalAlarmDays : null,
        price: Number(formData.price),
        currency: formData.currency,
        price_inr: priceInINR,
      }
    );

    if (updateError) {
      setError(updateError.message || "Failed to update license");
      setLoading(false);
      return;
    }

    router.push("/licenses");
  };

  const handleLogout = async () => {
    await authService.signOut();
    router.push("/auth/login");
  };

  if (!mounted || !userId || !license) return null;

  return (
    <>
      <SEO title="Edit License - LicenseVault" description="Edit software license details" />
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <nav className="border-b bg-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-accent" />
              <h1 className="text-2xl font-heading font-bold text-foreground">LicenseVault</h1>
            </Link>
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/licenses">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Licenses
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-heading">Edit License</CardTitle>
              <CardDescription>Update the details of your software license</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="softwareName">Software Name *</Label>
                    <Input
                      id="softwareName"
                      placeholder="Adobe Photoshop"
                      value={formData.softwareName}
                      onChange={(e) => setFormData({ ...formData, softwareName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Music Production">Music Production</SelectItem>
                        <SelectItem value="Video Editing">Video Editing</SelectItem>
                        <SelectItem value="Data Analytics">Data Analytics</SelectItem>
                        <SelectItem value="Development">Development</SelectItem>
                        <SelectItem value="Productivity">Productivity</SelectItem>
                        <SelectItem value="Mobile Management">Mobile Management</SelectItem>
                        <SelectItem value="SDK Tool Kit">SDK Tool Kit</SelectItem>
                        <SelectItem value="Musical Instruments">Musical Instruments</SelectItem>
                        <SelectItem value="MIDI Gear">MIDI Gear</SelectItem>
                        <SelectItem value="Music Hardware">Music Hardware</SelectItem>
                        <SelectItem value="Storage Devices">Storage Devices</SelectItem>
                        <SelectItem value="Workstation">Workstation</SelectItem>
                        <SelectItem value="Monthly Subscriptions">Monthly Subscriptions</SelectItem>
                        <SelectItem value="Mobile Application">Mobile Application</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.category === "Others" && (
                  <div className="space-y-2">
                    <Label htmlFor="customCategory">Custom Category *</Label>
                    <Input
                      id="customCategory"
                      placeholder="Enter custom category"
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      required
                    />
                  </div>
                )}

                {formData.category === "Mobile Application" && (
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform *</Label>
                    <Select
                      value={formData.platform}
                      onValueChange={(value) => setFormData({ ...formData, platform: value })}
                      required
                    >
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iOS">iOS</SelectItem>
                        <SelectItem value="Android">Android</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="licenseType">License Type *</Label>
                    <Select
                      value={formData.licenseType}
                      onValueChange={(value) => setFormData({ ...formData, licenseType: value as "Perpetual" | "Subscription" })}
                      required
                    >
                      <SelectTrigger id="licenseType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Perpetual">Perpetual</SelectItem>
                        <SelectItem value="Subscription">Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {formData.licenseType === "Subscription" && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="renewalDate">Renewal Date *</Label>
                      <Input
                        id="renewalDate"
                        type="date"
                        value={formData.renewalDate}
                        onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="renewalAlarmDays">Renewal Alarm (Days Before)</Label>
                      <Input
                        id="renewalAlarmDays"
                        type="number"
                        min="1"
                        value={formData.renewalAlarmDays}
                        onChange={(e) => setFormData({ ...formData, renewalAlarmDays: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value as "USD" | "EURO" | "INR" })}
                      required
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EURO">EURO (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.price && formData.currency !== "INR" && (
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Converted Price: <span className="font-semibold text-foreground">₹{convertToINR(Number(formData.price), formData.currency).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="licenseKey">License Key</Label>
                  <Textarea
                    id="licenseKey"
                    placeholder="Enter license key (max 3000 characters)"
                    maxLength={3000}
                    rows={4}
                    value={formData.licenseKey}
                    onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.licenseKey.length}/3000 characters
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Account username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Account password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="downloadUrl">Download URL</Label>
                  <Input
                    id="downloadUrl"
                    type="url"
                    placeholder="https://example.com/download"
                    value={formData.downloadUrl}
                    onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                    {loading ? "Updating..." : "Update License"}
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={() => router.push("/licenses")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}