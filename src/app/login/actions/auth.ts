"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(_prevState: unknown, formData: FormData) {
  try {
    console.log("[auth] Trying signIn with:", Object.fromEntries(formData));
    await signIn("credentials", formData);
    console.log("[auth] signIn succeeded (should not reach here)");
    return { success: true };
  } catch (error: unknown) {
    console.log("[auth] Error caught:", error);
    if (error instanceof AuthError) {
      console.log("[auth] AuthError type:", error.type);
      return { error: "Email ou senha inválidos." };
    }
    if (typeof error === "object" && error !== null && "digest" in error) {
      console.log("[auth] Redirect error (expected):", (error as { digest: string }).digest);
    } else {
      console.log("[auth] Unknown error:", error);
    }
    throw error;
  }
}
