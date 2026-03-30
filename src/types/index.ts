export type LicenseCategory = 
  | "Music Production"
  | "Video Editing"
  | "Data Analytics"
  | "Development"
  | "Productivity"
  | "Mobile Management"
  | "SDK Tool Kit"
  | "Musical Instruments"
  | "MIDI Gear"
  | "Music Hardware"
  | "Storage Devices"
  | "Workstation"
  | "Monthly Subscriptions"
  | "Mobile Application"
  | "Others";

export type LicenseType = "Perpetual" | "Subscription";

export type Currency = "USD" | "EURO" | "INR";

export type MobilePlatform = "iOS" | "Android";

export interface License {
  id: string;
  softwareName: string;
  category: LicenseCategory;
  customCategory?: string;
  platform?: MobilePlatform;
  licenseType: LicenseType;
  licenseKey?: string;
  username?: string;
  password?: string;
  downloadUrl?: string;
  purchaseDate: string;
  renewalDate?: string;
  renewalAlarmDays?: number;
  price: number;
  currency: Currency;
  priceInINR: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  twoFASecret?: string;
  twoFAEnabled: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  expiringSoon: number;
  totalSpent: number;
  byCategory: Record<string, number>;
}