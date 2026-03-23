import type { License, User } from "@/types";

const STORAGE_KEYS = {
  LICENSES: "licenses",
  USERS: "users",
  CURRENT_USER: "currentUser",
} as const;

export const storage = {
  getLicenses: (): License[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.LICENSES);
    return data ? JSON.parse(data) : [];
  },

  saveLicenses: (licenses: License[]): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(licenses));
  },

  getUsers: (): User[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  saveUsers: (users: User[]): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User | null): void => {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  clearAll: (): void => {
    if (typeof window === "undefined") return;
    localStorage.clear();
  },
};