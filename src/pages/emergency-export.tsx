import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, AlertCircle, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";
import type { License, User } from "@/types";
import Link from "next/link";

export default function EmergencyExportPage() {
  const [mounted, setMounted] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");
  const [dataStats, setDataStats] = useState({ users: 0, licenses: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [rawData, setRawData] = useState<Record<string, any>>({});
  const [allKeys, setAllKeys] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const usersData = localStorage.getItem("users");
      const licensesData = localStorage.getItem("licenses");
      const users: User[] = usersData ? JSON.parse(usersData) : [];
      const licenses: License[] = licensesData ? JSON.parse(licensesData) : [];
      setDataStats({ users: users.length, licenses: licenses.length });
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Get all localStorage keys
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    setAllKeys(keys);

    // Get all localStorage data
    const data: Record<string, any> = {};
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        data[key] = value ? JSON.parse(value) : value;
      } catch {
        data[key] = localStorage.getItem(key);
      }
    });
    setRawData(data);

    console.log("=== EMERGENCY EXPORT DEBUG ===");
    console.log("All localStorage keys:", keys);
    console.log("All localStorage data:", data);
    
    const allUsers = storage.getUsers();
    const allLicenses = storage.getLicenses();
    
    console.log("Users from storage:", allUsers);
    console.log("Licenses from storage:", allLicenses);
    
    setUsers(allUsers);
    setLicenses(allLicenses);
  }, []);

  const handleExportAllData = () => {
    try {
      const usersData = localStorage.getItem("users");
      const licensesData = localStorage.getItem("licenses");
      const currentUserData = localStorage.getItem("currentUser");

      const users: User[] = usersData ? JSON.parse(usersData) : [];
      const licenses: License[] = licensesData ? JSON.parse(licensesData) : [];

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Users sheet
      const usersSheet = XLSX.utils.json_to_sheet(
        users.map((u) => ({
          ID: u.id,
          Email: u.email,
          Password: u.password,
          "Email Verified": u.emailVerified ? "Yes" : "No",
          "Notification Email": u.notificationEmail,
          "2FA Enabled": u.twoFAEnabled ? "Yes" : "No",
          "Created At": new Date(u.createdAt).toLocaleString(),
        }))
      );
      XLSX.utils.book_append_sheet(workbook, usersSheet, "Users");

      // Licenses sheet
      const licensesSheet = XLSX.utils.json_to_sheet(
        licenses.map((l) => ({
          ID: l.id,
          "Software Name": l.softwareName,
          Category: l.category === "Others" ? l.customCategory : l.category,
          Platform: l.platform || "",
          "License Type": l.licenseType,
          "License Key": l.licenseKey || "",
          Username: l.username || "",
          Password: l.password || "",
          "Download URL": l.downloadUrl || "",
          "Purchase Date": l.purchaseDate,
          "Renewal Date": l.renewalDate || "",
          "Renewal Alarm Days": l.renewalAlarmDays || "",
          "Price": l.price,
          Currency: l.currency,
          "Price in INR": l.priceInINR,
          "Created At": new Date(l.createdAt).toLocaleString(),
          "Updated At": new Date(l.updatedAt).toLocaleString(),
        }))
      );
      XLSX.utils.book_append_sheet(workbook, licensesSheet, "Licenses");

      // Raw data sheet for backup
      const rawDataSheet = XLSX.utils.json_to_sheet([
        { Key: "users", Value: usersData || "[]" },
        { Key: "licenses", Value: licensesData || "[]" },
        { Key: "currentUser", Value: currentUserData || "null" },
      ]);
      XLSX.utils.book_append_sheet(workbook, rawDataSheet, "Raw Data");

      // Download file
      XLSX.writeFile(
        workbook,
        `LicenseVault_EMERGENCY_BACKUP_${new Date().toISOString().split("T")[0]}_${Date.now()}.xlsx`
      );

      setExportStatus("success");
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus("error");
    }
  };

  if (!mounted) return null;

  return (
    <>
      <SEO
        title="Emergency Data Export - LicenseVault"
        description="Emergency data export for LicenseVault"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-error/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-error" />
            </div>
            <CardTitle className="text-3xl font-heading">Emergency Data Export</CardTitle>
            <CardDescription>
              Download all your LicenseVault data immediately - no login required
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-warning/10 border border-amber-warning/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-warning mb-2">⚠️ Important Information</h3>
              <p className="text-sm text-muted-foreground">
                This emergency tool exports ALL data stored in your browser&apos;s localStorage,
                including user accounts with passwords. Keep the downloaded file secure.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-accent">{dataStats.users}</div>
                    <div className="text-sm text-muted-foreground">User Accounts</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-accent">{dataStats.licenses}</div>
                    <div className="text-sm text-muted-foreground">License Records</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">What&apos;s included in the export:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-success mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Users Sheet:</strong> All user accounts with emails and passwords
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-success mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Licenses Sheet:</strong> All software licenses with complete details
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-success mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Raw Data Sheet:</strong> Complete localStorage backup for recovery
                  </span>
                </li>
              </ul>
            </div>

            {exportStatus === "success" && (
              <div className="bg-green-success/10 border border-green-success/30 rounded-lg p-4">
                <p className="text-sm text-green-success font-medium">
                  ✅ Export successful! Check your downloads folder.
                </p>
              </div>
            )}

            {exportStatus === "error" && (
              <div className="bg-red-error/10 border border-red-error/30 rounded-lg p-4">
                <p className="text-sm text-red-error font-medium">
                  ❌ Export failed. Please try again or contact support.
                </p>
              </div>
            )}

            <Card className="mb-6 border-amber-warning">
              <CardHeader>
                <CardTitle className="font-heading">LocalStorage Inspector</CardTitle>
                <CardDescription>
                  All data currently stored in your browser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Storage Keys Found: {allKeys.length}</p>
                    <div className="bg-muted p-3 rounded-lg font-mono text-xs max-h-40 overflow-auto">
                      {allKeys.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {allKeys.map(key => (
                            <li key={key}>{key}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">No data found in localStorage</p>
                      )}
                    </div>
                  </div>

                  {Object.keys(rawData).length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Raw Data Preview:</p>
                      <div className="bg-muted p-3 rounded-lg font-mono text-xs max-h-60 overflow-auto">
                        <pre>{JSON.stringify(rawData, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {allKeys.length === 0 && (
                    <div className="bg-red-error/10 border border-red-error/20 rounded-lg p-4">
                      <p className="text-red-error font-medium mb-2">⚠️ No Data Found</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your browser's localStorage is completely empty. This could mean:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>You haven't registered or entered any data yet</li>
                        <li>You're in incognito/private browsing mode</li>
                        <li>Browser data was recently cleared</li>
                        <li>Different browser/device than where you entered data</li>
                      </ul>
                      <div className="mt-4">
                        <Button asChild>
                          <Link href="/auth/register">Start Fresh - Register New Account</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleExportAllData} className="w-full" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Download Complete Backup (Excel)
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>After exporting, you can use the file to:</p>
              <ul className="mt-2 space-y-1">
                <li>• View your account email and password</li>
                <li>• See all license data in spreadsheet format</li>
                <li>• Import back into LicenseVault later</li>
                <li>• Keep as a permanent backup</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}