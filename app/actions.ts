"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOptionalUser, requireLoveHubContext } from "@/lib/love-hub";

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function text(formData: FormData, key: string, maxLength = 4000) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function localDateTimeToIso(value: string) {
  if (!value) return null;
  const withZone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}:00+02:00`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function redirectWithError(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
}

async function uploadPhoto(
  file: FormDataEntryValue | null,
  householdId: string,
  folder: string,
) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error("Photos must be smaller than 10 MB.");
  }
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    throw new Error("Use a JPEG, PNG, or WebP photo.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${householdId}/${folder}/${randomUUID()}.${extension}`;
  return { file, path };
}

function revalidateCore() {
  revalidatePath("/");
  revalidatePath("/story");
  revalidatePath("/memories");
  revalidatePath("/plans");
  revalidatePath("/watchlist");
  revalidatePath("/adventures");
  revalidatePath("/messages");
  revalidatePath("/settings");
}

export async function createMemory(formData: FormData) {
  const context = await requireLoveHubContext();
  const title = text(formData, "title", 140);
  const story = text(formData, "story");
  const happenedOn = text(formData, "happened_on", 10) || null;

  if (!title) redirectWithError("/memories#new", "Give the memory a title.");

  let photoPath: string | null = null;
  try {
    const upload = await uploadPhoto(formData.get("photo"), context.household.id, "memories");
    if (upload) {
      const { error } = await context.supabase.storage
        .from("love-hub-private")
        .upload(upload.path, upload.file, {
          contentType: upload.file.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (error) throw error;
      photoPath = upload.path;
    }
  } catch (error) {
    redirectWithError("/memories#new", error instanceof Error ? error.message : "Could not upload photo.");
  }

  const { error } = await context.supabase.from("love_hub_memories").insert({
    household_id: context.household.id,
    created_by: context.user.id,
    title,
    story: story || null,
    happened_on: happenedOn,
    photo_path: photoPath,
    is_favourite: checked(formData, "is_favourite"),
  });

  if (error) {
    if (photoPath) {
      await context.supabase.storage.from("love-hub-private").remove([photoPath]);
    }
    redirectWithError("/memories#new", error.message);
  }

  revalidateCore();
  redirect("/memories?created=1");
}

export async function updateMemory(formData: FormData) {
  const context = await requireLoveHubContext();
  const id = text(formData, "id", 64);
  const title = text(formData, "title", 140);
  const story = text(formData, "story");
  const happenedOn = text(formData, "happened_on", 10) || null;

  if (!id || !title) redirectWithError("/memories", "A title is required.");

  const { data: current } = await context.supabase
    .from("love_hub_memories")
    .select("photo_path")
    .eq("id", id)
    .eq("household_id", context.household.id)
    .maybeSingle();

  let nextPhotoPath = current?.photo_path ?? null;
  let uploadedPath: string | null = null;

  try {
    const upload = await uploadPhoto(formData.get("photo"), context.household.id, "memories");
    if (upload) {
      const { error: uploadError } = await context.supabase.storage
        .from("love-hub-private")
        .upload(upload.path, upload.file, {
          contentType: upload.file.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw uploadError;
      uploadedPath = upload.path;
      nextPhotoPath = upload.path;
    }
  } catch (error) {
    redirectWithError("/memories", error instanceof Error ? error.message : "Could not upload photo.");
  }

  const { error } = await context.supabase
    .from("love_hub_memories")
    .update({
      title,
      story: story || null,
      happened_on: happenedOn,
      photo_path: nextPhotoPath,
      is_favourite: checked(formData, "is_favourite"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("household_id", context.household.id);

  if (error) {
    if (uploadedPath) {
      await context.supabase.storage.from("love-hub-private").remove([uploadedPath]);
    }
    redirectWithError("/memories", error.message);
  }

  if (uploadedPath && current?.photo_path) {
    await context.supabase.storage.from("love-hub-private").remove([current.photo_path]);
  }

  revalidateCore();
  redirect("/memories?updated=1");
}

export async function deleteMemory(formData: FormData) {
  const context = await requireLoveHubContext();
  const id = text(formData, "id", 64);

  const { data: memory } = await context.supabase
    .from("love_hub_memories")
    .select("photo_path")
    .eq("id", id)
    .eq("household_id", context.household.id)
    .maybeSingle();

  const { error } = await context.supabase
    .from("love_hub_memories")
    .delete()
    .eq("id", id)
    .eq("household_id", context.household.id);

  if (error) redirectWithError("/memories", error.message);

  if (memory?.photo_path) {
    await context.supabase.storage.from("love-hub-private").remove([memory.photo_path]);
  }

  revalidateCore();
  redirect("/memories?deleted=1");
}

export async function createPlan(formData: FormData) {
  const context = await requireLoveHubContext();
  const title = text(formData, "title", 160);
  if (!title) redirectWithError("/plans#new", "Give the plan a title.");

  const { error } = await context.supabase.from("love_hub_plans").insert({
    household_id: context.household.id,
    created_by: context.user.id,
    title,
    notes: text(formData, "notes") || null,
    location: text(formData, "location", 240) || null,
    starts_at: localDateTimeToIso(text(formData, "starts_at", 32)),
    ends_at: localDateTimeToIso(text(formData, "ends_at", 32)),
    status: text(formData, "status", 20) || "idea",
    includes_liam: checked(formData, "includes_liam"),
  });

  if (error) redirectWithError("/plans#new", error.message);
  revalidateCore();
  redirect("/plans?created=1");
}

export async function updatePlan(formData: FormData) {
  const context = await requireLoveHubContext();
  const id = text(formData, "id", 64);
  const title = text(formData, "title", 160);
  if (!id || !title) redirectWithError("/plans", "A title is required.");

  const { error } = await context.supabase
    .from("love_hub_plans")
    .update({
      title,
      notes: text(formData, "notes") || null,
      location: text(formData, "location", 240) || null,
      starts_at: localDateTimeToIso(text(formData, "starts_at", 32)),
      ends_at: localDateTimeToIso(text(formData, "ends_at", 32)),
      status: text(formData, "status", 20) || "idea",
      includes_liam: checked(formData, "includes_liam"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("household_id", context.household.id);

  if (error) redirectWithError("/plans", error.message);
  revalidateCore();
  redirect("/plans?updated=1");
}

export async function setPlanStatus(formData: FormData) {
  const context = await requireLoveHubContext();
  const id = text(formData, "id", 64);
  const status = text(formData, "status", 20);
  if (!["idea", "planned", "done", "cancelled"].includes(status)) {
    redirectWithError("/plans", "Unknown plan status.");
  }

  const { error } = await context.supabase
    .from("love_hub_plans")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("household_id", context.household.id);

  if (error) redirectWithError("/plans", error.message);
  revalidateCore();
}

export async function deletePlan(formData: FormData) {
  const context = await requireLoveHubContext();
  const id = text(formData, "id", 64);
  const { error } = await context.supabase
    .from("love_hub_plans")
    .delete()
    .eq("id", id)
    .eq("household_id", context.household.id);

  if (error) redirectWithError("/plans", error.message);
  revalidateCore();
  redirect("/plans?deleted=1");
}

export async function createWatchlistItem(formData: FormData) {
  const context = await requireLoveHubContext();
  const title = text(formData, "title", 180);
  if (!title) redirectWithError("/watchlist#new", "Add a title first.");

  const { error } = await context.supabase.from("love_hub_watchlist_items").insert({
    household_id: context.household.id,
    added_by: context.user.id,
    title,
    media_type: text(formData, "media_type", 20) || "movie",
    status: text(formData, "status", 30) || "want_to_watch",
    notes: text(formData, "notes") || null,
  });

  if (error) redirectWithError("/watchlist#new", error.message);
  revalidateCore();
  redirect("/watchlist?created=1");
}

export async function updateWatchlistItem(formData: FormData) {
  const context = await requireLoveHubContext();
  const id = text(formData, "id", 64);
  const title = text(formData, "title", 180);
  const ratingValue = Number(text(formData, "rating", 2));
  const rating = Number.isInteger(ratingValue) && ratingValue >= 1 && ratingValue <= 5 ? ratingValue : null;

  const { error } = await context.supabase
    .from("love_hub_watchlist_items")
    .update({
      title,
      media_type: text(formData, "media_type", 20) || "movie",
      status: text(formData, "status", 30) || "want_to_watch",
      rating,
      notes: text(formData, "notes") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("household_id", context.household.id);

  if (error) redirectWithError("/watchlist", error.message);
  revalidateCore();
  redirect("/watchlist?updated=1");
}

export async function deleteWatchlistItem(formData: FormData) {
  const context = await requireLoveHubContext();
  const id = text(formData, "id", 64);
  const { error } = await context.supabase
    .from("love_hub_watchlist_items")
    .delete()
    .eq("id", id)
    .eq("household_id", context.household.id);

  if (error) redirectWithError("/watchlist", error.message);
  revalidateCore();
  redirect("/watchlist?deleted=1");
}

export async function createAdventure(formData: FormData) {
  const context = await requireLoveHubContext();
  const title = text(formData, "title", 180);
  if (!title) redirectWithError("/adventures#new", "Name the adventure first.");

  const { error } = await context.supabase.from("love_hub_adventures").insert({
    household_id: context.household.id,
    created_by: context.user.id,
    title,
    location: text(formData, "location", 240) || null,
    category: text(formData, "category", 40) || "date",
    notes: text(formData, "notes") || null,
    status: text(formData, "status", 20) || "idea",
    completed_at: text(formData, "status", 20) === "done" ? new Date().toISOString() : null,
  });

  if (error) redirectWithError("/adventures#new", error.message);
  revalidateCore();
  redirect("/adventures?created=1");
}

export async function updateAdventure(formData: FormData) {
  const context = await requireLoveHubContext();
  const id = text(formData, "id", 64);
  const status = text(formData, "status", 20) || "idea";

  const { error } = await context.supabase
    .from("love_hub_adventures")
    .update({
      title: text(formData, "title", 180),
      location: text(formData, "location", 240) || null,
      category: text(formData, "category", 40) || "date",
      notes: text(formData, "notes") || null,
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("household_id", context.household.id);

  if (error) redirectWithError("/adventures", error.message);
  revalidateCore();
  redirect("/adventures?updated=1");
}

export async function deleteAdventure(formData: FormData) {
  const context = await requireLoveHubContext();
  const id = text(formData, "id", 64);
  const { error } = await context.supabase
    .from("love_hub_adventures")
    .delete()
    .eq("id", id)
    .eq("household_id", context.household.id);

  if (error) redirectWithError("/adventures", error.message);
  revalidateCore();
  redirect("/adventures?deleted=1");
}

export async function createMessage(formData: FormData) {
  const context = await requireLoveHubContext();
  const body = text(formData, "body");
  if (!body) redirectWithError("/messages#new", "Write something first.");

  const { error } = await context.supabase.from("love_hub_messages").insert({
    household_id: context.household.id,
    author_id: context.user.id,
    body,
  });

  if (error) redirectWithError("/messages#new", error.message);
  revalidateCore();
  redirect("/messages?sent=1");
}

export async function deleteMessage(formData: FormData) {
  const context = await requireLoveHubContext();
  const id = text(formData, "id", 64);
  const { error } = await context.supabase
    .from("love_hub_messages")
    .delete()
    .eq("id", id)
    .eq("household_id", context.household.id)
    .eq("author_id", context.user.id);

  if (error) redirectWithError("/messages", error.message);
  revalidateCore();
}

export async function updateHousehold(formData: FormData) {
  const context = await requireLoveHubContext();
  if (context.membership.role !== "owner") {
    redirectWithError("/settings", "Only an owner can change shared settings.");
  }

  const name = text(formData, "name", 120);
  const relationshipStartedOn = text(formData, "relationship_started_on", 10);
  if (!name || !relationshipStartedOn) {
    redirectWithError("/settings", "Household name and start date are required.");
  }

  const { error } = await context.supabase
    .from("love_hub_households")
    .update({
      name,
      relationship_started_on: relationshipStartedOn,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.household.id);

  if (error) redirectWithError("/settings", error.message);
  revalidateCore();
  redirect("/settings?saved=1");
}

export async function updateDisplayName(formData: FormData) {
  const context = await requireLoveHubContext();
  const displayName = text(formData, "display_name", 80);
  if (!displayName) redirectWithError("/settings", "Your display name cannot be empty.");

  const { error } = await context.supabase.rpc("love_hub_update_display_name", {
    chosen_display_name: displayName,
  });

  if (error) {
    redirectWithError(
      "/settings",
      error.message.includes("function")
        ? "The final Love Hub migration still needs to be installed."
        : error.message,
    );
  }

  revalidateCore();
  redirect("/settings?profile=1");
}

export async function createInvite() {
  const context = await requireLoveHubContext();
  if (context.membership.role !== "owner") {
    redirectWithError("/settings", "Only an owner can invite a partner.");
  }

  const { data, error } = await context.supabase.rpc("love_hub_create_invite", {
    target_household: context.household.id,
  });

  if (error || !data) {
    redirectWithError(
      "/settings",
      error?.message.includes("function")
        ? "The final Love Hub migration still needs to be installed."
        : error?.message ?? "Could not create an invite.",
    );
  }

  redirect(`/settings?invite=${encodeURIComponent(String(data))}`);
}

export async function acceptInvite(formData: FormData) {
  const context = await getOptionalUser();
  if (!context.user) redirect("/login");

  const token = text(formData, "token", 200);
  const displayName = text(formData, "display_name", 80);
  if (!token || !displayName) redirectWithError("/join", "Invite code and display name are required.");

  const { error } = await context.supabase.rpc("love_hub_accept_invite", {
    raw_token: token,
    chosen_display_name: displayName,
  });

  if (error) redirectWithError(`/join?token=${encodeURIComponent(token)}`, error.message);

  revalidateCore();
  redirect("/");
}
