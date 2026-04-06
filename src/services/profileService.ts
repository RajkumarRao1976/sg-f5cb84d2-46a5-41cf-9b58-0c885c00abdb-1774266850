import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const profileService = {
  async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("Get profile:", { data, error });
    return { data, error };
  },

  async updateProfile(userId: string, updates: ProfileUpdate): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    console.log("Update profile:", { data, error });
    return { data, error };
  },

  async updateNotificationEmail(userId: string, email: string): Promise<{ data: Profile | null; error: any }> {
    return this.updateProfile(userId, { notification_email: email });
  },

  async enable2FA(userId: string, secret: string): Promise<{ data: Profile | null; error: any }> {
    return this.updateProfile(userId, {
      two_fa_enabled: true,
      two_fa_secret: secret,
    });
  },

  async disable2FA(userId: string): Promise<{ data: Profile | null; error: any }> {
    return this.updateProfile(userId, {
      two_fa_enabled: false,
      two_fa_secret: null,
    });
  },
};