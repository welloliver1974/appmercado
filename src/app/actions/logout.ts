"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("user-id");
  cookieStore.delete("user-email");
  redirect("/login");
}
