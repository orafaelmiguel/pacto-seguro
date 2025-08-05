// src/app/dashboard/actions.ts
"use server";

import { createClient } from '../../../lib/supabase/server';
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
