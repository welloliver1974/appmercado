"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(_prevState: unknown, formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos." };
    }
    throw error;
  }
  return { success: true };
}
