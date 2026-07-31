"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { deepseekModels, updateDeepSeekModel } from "@/lib/db/queries/settings";

export async function updateAiSettingsAction(formData: FormData) {
  const parsed = z.enum(deepseekModels).safeParse(formData.get("deepseekModel"));
  if (!parsed.success) redirect("/manga1004/settings?error=model");
  await updateDeepSeekModel(parsed.data);
  redirect("/manga1004/settings?saved=1");
}
