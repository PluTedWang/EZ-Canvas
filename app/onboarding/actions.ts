"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { canvas } from "@/lib/canvas";
import { checkCanvasHost, institutionFromHost, normalizeBaseUrl } from "@/lib/canvas/host";
import { syncCanvas } from "@/lib/canvas/sync";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

export async function connectCanvas(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const baseUrl = normalizeBaseUrl(String(formData.get("baseUrl") ?? ""));
  const token = String(formData.get("token") ?? "").trim();
  if (!baseUrl || !token) redirect("/onboarding?error=missing");
  // Mock mode never leaves the server, so any address works there.
  if (process.env.CANVAS_MOCK !== "1" && (await checkCanvasHost(baseUrl)) !== "ok") redirect("/onboarding?error=host");

  const profile = await canvas(baseUrl, token)
    .profile()
    .catch(() => null);
  if (!profile) redirect("/onboarding?error=token");

  const userId = session.user.id;
  const [connection] = await db.$transaction([
    db.connection.upsert({
      where: { userId_type: { userId, type: "canvas" } },
      update: { baseUrl, token: encrypt(token), status: "connected" },
      create: { userId, type: "canvas", baseUrl, token: encrypt(token) },
    }),
    db.user.update({
      where: { id: userId },
      data: { name: profile.name, institution: institutionFromHost(baseUrl) },
    }),
  ]);
  after(() => syncCanvas(connection.id).catch((error) => console.error("First Canvas sync failed", error)));
  redirect("/onboarding");
}
