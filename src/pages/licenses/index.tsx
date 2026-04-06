import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Plus, Download, Upload, Edit, Trash2, Calendar, Key, ExternalLink, Search, Filter } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/integrations/supabase/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";
import { authService } from "@/services/authService";
import { licenseService } from "@/services/licenseService";

type License = Database["public"]["Tables"]["licenses"]["Row"];

export default function LicensesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expiring" | "expired">("all");

  useEffect(() => {
    setMounted(true);
    checkAuthAndLoadLicenses();
  }, []);

  const checkAuthAndLoadLicenses = async () => {
    const { session } = await authService.getSession();
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setUserId(session.user.id);
    await loadLicenses(session.user.id);
  };

  const loadLicenses = async (uid: string) => {
    const { data: allLicenses } = await licenseService.getLicenses(uid);
    setLicenses(allLicenses);
    setFilteredLicenses(allLicenses);
  };

  useEffect(() => {
    filterLicenses();
  }, [searchQuery, statusFilter, licenses]);

  const filterLicenses = () => {
    let filtered = [...licenses];
    const now = new Date();

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((license) =>
        license.software_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (license.custom_category || license.category).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((license) => {
        if (statusFilter === "active") {
          if (license.license_type === "Perpetual") return true;
          if (license.renewal_date) {
            const renewalDate = new Date(license.renewal_date);
            return renewalDate > now;
          }
          return false;
        }

        if (statusFilter === "expiring") {
          if (license.license_type === "Subscription" && license.renewal_date && license.renewal_alarm_days) {
            const renewalDate = new Date(license.renewal_date);
            const alarmDate = new Date(renewalDate.getTime() - license.renewal_alarm_days * 24 * 60 * 60 * 1000);
            return alarmDate <= now && renewalDate > now;
          }
          return false;
        }

        if (statusFilter === "expired") {
          if (license.license_type === "Subscription" && license.renewal_date) {
            const renewalDate = new Date(license.renewal_date);
            return renewalDate <= now;
          }
          return false;
        }

        return true;
      });
    }

    setFilteredLicenses(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    
    const { error } = await licenseService.deleteLicense(id, userId);
    if (!error) {
      await loadLicenses(userId);
    }
    setDeleteId(null);
  };

  const handleExport = () => {
    const exportData = licenses.map((license) => ({
      "Software Name": license.software_name,
      "Category": license.category === "Others" ? license.custom_category : license.category,
      "Platform": license.platform || "",
      "License Type": license.license_type,
      "License Key": license.license_key || "",
      "Username": license.username || "",
      "Password": license.password || "",
      "Download URL": license.download_url || "",
      "Purchase Date": license.purchase_date,
      "Renewal Date": license.renewal_date || "",
      "Renewal Alarm (Days)": license.renewal_alarm_days || "",
      "Price": license.price,
      "Currency": license.currency,
      "Price in INR": license.price_inr,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Licenses");
    XLSX.writeFile(workbook, `LicenseVault_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        for (const row: any of jsonData) {
          await licenseService.createLicense({
            user_id: userId,
            software_name: row["Software Name"] || "",
            category: row["Category"] || "Others",
            custom_category: row["Category"] === "Others" ? row["Category"] : null,
            platform: row["Platform"] || null,
            license_type: row["License Type"] || "Perpetual",
            license_key: row["License Key"] || null,
            username: row["Username"] || null,
            password: row["Password"] || null,
            download_url: row["Download URL"] || null,
            purchase_date: row["Purchase Date"] || new Date().toISOString().split("T")[0],
            renewal_date: row["Renewal Date"] || null,
            renewal_alarm_days: row["Renewal Alarm (Days)"] || null,
            price: Number(row["Price"]) || 0,
            currency: row["Currency"] || "INR",
            price_inr: Number(row["Price in INR"]) || 0,
          });
        }

        await loadLicenses(userId);
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getExpiringLicenses = () => {
    return licenses.filter((license) => {
      if (license.license_type === "Perpetual" || !license.renewal_date) return false;
      const renewalDate = new Date(license.renewal_date);
      const today = new Date();
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilRenewal <= (license.renewal_alarm_days || 30) && daysUntilRenewal >= 0;
    });
  };

  const handleLogout = async () => {
    await authService.signOut();
    router.push("/auth/login");
  };

  if (!mounted || !userId) return null;

  const expiringLicenses = getExpiringLicenses();

  return (
    <>
      <SEO title="Licenses - LicenseVault" description="Manage your software licenses" />
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-accent" />
              <h1 className="text-2xl font-heading font-bold text-foreground">LicenseVault</h1>
            </Link>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-heading font-bold text-foreground mb-2">License Management</h2>
              <p className="text-muted-foreground">Manage all your software licenses in one place</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label htmlFor="import-file">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </span>
                </Button>
              </label>
              <input
                id="import-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
              <Button variant="outline" onClick={handleExport} disabled={licenses.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Link href="/licenses/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add License
                </Button>
              </Link>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search licenses by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({licenses.length})
                  </Button>
                  <Button
                    variant={statusFilter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("active")}
                    className={statusFilter === "active" ? "" : "text-green-success border-green-success/30"}
                  >
                    Active
                  </Button>
                  <Button
                    variant={statusFilter === "expiring" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("expiring")}
                    className={statusFilter === "expiring" ? "" : "text-amber-warning border-amber-warning/30"}
                  >
                    Expiring Soon
                  </Button>
                  <Button
                    variant={statusFilter === "expired" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("expired")}
                    className={statusFilter === "expired" ? "" : "text-red-error border-red-error/30"}
                  >
                    Expired
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {expiringLicenses.length > 0 && (
            <Card className="mb-6 border-amber-warning/50 bg-amber-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-warning">
                  <Calendar className="h-5 w-5" />
                  Expiring Soon
                </CardTitle>
                <CardDescription>
                  {expiringLicenses.length} license{expiringLicenses.length > 1 ? "s" : ""} expiring within alarm period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringLicenses.map((license) => (
                    <div key={license.id} className="flex justify-between items-center p-2 bg-card rounded">
                      <span className="font-medium">{license.software_name}</span>
                      <span className="text-sm text-muted-foreground">{license.renewal_date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {licenses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Key className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-heading font-semibold mb-2">No licenses yet</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  Start by adding your first software license
                </p>
                <Link href="/licenses/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add License
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : filteredLicenses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Filter className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-heading font-semibold mb-2">No licenses found</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  Try adjusting your search or filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Software</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Renewal</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">{license.software_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {license.category === "Others" ? license.custom_category : license.category}
                          {license.platform && ` - ${license.platform}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={license.license_type === "Perpetual" ? "default" : "outline"}>
                          {license.license_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(license.price_inr, "INR")}</TableCell>
                      <TableCell>{license.purchase_date}</TableCell>
                      <TableCell>{license.renewal_date || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {license.download_url && (
                            <Button
                              size="icon"
                              variant="ghost"
                              asChild
                            >
                              <a href={license.download_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Link href={`/licenses/edit/${license.id}`}>
                            <Button size="icon" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(license.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </main>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete License</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the license from your vault.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}