"use server";

import { processReceiptImage } from "@/lib/ai";

export async function processReceiptAction(base64Image: string) {
  return processReceiptImage(base64Image);
}
