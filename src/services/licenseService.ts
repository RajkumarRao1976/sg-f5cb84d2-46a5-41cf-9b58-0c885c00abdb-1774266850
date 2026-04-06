import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type License = Database["public"]["Tables"]["licenses"]["Row"];
type LicenseInsert = Database["public"]["Tables"]["licenses"]["Insert"];
type LicenseUpdate = Database["public"]["Tables"]["licenses"]["Update"];

export const licenseService = {
  async createLicense(license: LicenseInsert): Promise<{ data: License | null; error: any }> {
    const { data, error } = await supabase
      .from("licenses")
      .insert(license)
      .select()
      .single();

    console.log("Create license:", { data, error });
    return { data, error };
  },

  async getLicenses(userId: string): Promise<{ data: License[]; error: any }> {
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    console.log("Get licenses:", { data, error });
    return { data: data || [], error };
  },

  async getLicenseById(id: string, userId: string): Promise<{ data: License | null; error: any }> {
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    console.log("Get license by ID:", { data, error });
    return { data, error };
  },

  async updateLicense(id: string, userId: string, updates: LicenseUpdate): Promise<{ data: License | null; error: any }> {
    const { data, error } = await supabase
      .from("licenses")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    console.log("Update license:", { data, error });
    return { data, error };
  },

  async deleteLicense(id: string, userId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("licenses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    console.log("Delete license:", { error });
    return { error };
  },

  async getExpiringLicenses(userId: string): Promise<{ data: License[]; error: any }> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("user_id", userId)
      .eq("license_type", "Subscription")
      .not("renewal_date", "is", null)
      .not("renewal_alarm_days", "is", null)
      .order("renewal_date", { ascending: true });

    console.log("Get expiring licenses:", { data, error });

    if (error || !data) {
      return { data: [], error };
    }

    // Filter expiring licenses in JavaScript
    const expiring = data.filter((license) => {
      if (!license.renewal_date || !license.renewal_alarm_days) return false;
      
      const renewalDate = new Date(license.renewal_date);
      const alarmDate = new Date(renewalDate.getTime() - license.renewal_alarm_days * 24 * 60 * 60 * 1000);
      const nowDate = new Date(now);
      
      return alarmDate <= nowDate && renewalDate > nowDate;
    });

    return { data: expiring, error: null };
  },
};