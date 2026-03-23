import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { storage } from "@/lib/storage";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Download, Upload, Edit, Trash2, Calendar, Key, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { License, User } from "@/types";
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

export default function LicensesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = storage.getCurrentUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setCurrentUser(user);
    setLicenses(storage.getLicenses());
  }, [router]);

  const handleDelete = (id: string) => {
    const updatedLicenses = licenses.filter((l) => l.id !== id);
    storage.saveLicenses(updatedLicenses);
    setLicenses(updatedLicenses);
    setDeleteId(null);
  };

  const handleExport = () => {
    const exportData = licenses.map((license) => ({
      "Software Name": license.softwareName,
      "Category": license.category === "Others" ? license.customCategory : license.category,
      "License Type": license.licenseType,
      "License Key": license.licenseKey || "",
      "Username": license.username || "",
      "Password": license.password || "",
      "Download URL": license.downloadUrl || "",
      "Purchase Date": license.purchaseDate,
      "Renewal Date": license.renewalDate || "",
      "Renewal Alarm (Days)": license.renewalAlarmDays || "",
      "Price": license.price,
      "Currency": license.currency,
      "Price in INR": license.priceInINR,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Licenses");
    XLSX.writeFile(workbook, `LicenseVault_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedLicenses: License[] = jsonData.map((row: any) => ({
          id: crypto.randomUUID(),
          softwareName: row["Software Name"] || "",
          category: row["Category"] === "Others" ? "Others" : row["Category"],
          customCategory: row["Category"] === "Others" ? row["Category"] : undefined,
          licenseType: row["License Type"] || "Perpetual",
          licenseKey: row["License Key"] || undefined,
          username: row["Username"] || undefined,
          password: row["Password"] || undefined,
          downloadUrl: row["Download URL"] || undefined,
          purchaseDate: row["Purchase Date"] || new Date().toISOString().split("T")[0],
          renewalDate: row["Renewal Date"] || undefined,
          renewalAlarmDays: row["Renewal Alarm (Days)"] || undefined,
          price: Number(row["Price"]) || 0,
          currency: row["Currency"] || "INR",
          priceInINR: Number(row["Price in INR"]) || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        const updatedLicenses = [...licenses, ...importedLicenses];
        storage.saveLicenses(updatedLicenses);
        setLicenses(updatedLicenses);
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getExpiringLicenses = () => {
    return licenses.filter((license) => {
      if (license.licenseType === "Perpetual" || !license.renewalDate) return false;
      const renewalDate = new Date(license.renewalDate);
      const today = new Date();
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilRenewal <= (license.renewalAlarmDays || 30) && daysUntilRenewal >= 0;
    });
  };

  if (!mounted || !currentUser) return null;

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
                onClick={() => {
                  storage.setCurrentUser(null);
                  router.push("/");
                }}
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
                      <span className="font-medium">{license.softwareName}</span>
                      <span className="text-sm text-muted-foreground">{license.renewalDate}</span>
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
                  {licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">{license.softwareName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {license.category === "Others" ? license.customCategory : license.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={license.licenseType === "Perpetual" ? "default" : "outline"}>
                          {license.licenseType}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(license.priceInINR, "INR")}</TableCell>
                      <TableCell>{license.purchaseDate}</TableCell>
                      <TableCell>{license.renewalDate || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {license.downloadUrl && (
                            <Button
                              size="icon"
                              variant="ghost"
                              asChild
                            >
                              <a href={license.downloadUrl} target="_blank" rel="noopener noreferrer">
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