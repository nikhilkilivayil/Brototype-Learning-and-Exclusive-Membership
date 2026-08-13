"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/format";
import type { Role } from "@/lib/types";

/** Uniform result shape returned by every user-management action. */
export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Roles the admin manages on this screen — never admins or learners. */
type StaffRole = "support" | "sales";

const PHONE_RE = /^\+?\d{10,13}$/;

function isStaffRole(role: Role | string): role is StaffRole {
  return role === "support" || role === "sales";
}

function toErrorMessage(err: unknown): string {
  return err instanceof Error && err.message
    ? err.message
    : "Something went wrong. Please try again.";
}

function revalidateAfterWrite(role: StaffRole) {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${role}`);
}

/** Returns an error message, or null when name + phone are valid. */
function validateStaffInput(name: string, phone: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Name is required.";
  }
  if (!PHONE_RE.test(normalizePhone(phone.trim()))) {
    return "Enter a valid phone number (10–13 digits, optional + country code).";
  }
  return null;
}

export async function createStaffUserAction(
  role: StaffRole,
  name: string,
  phone: string
): Promise<ActionResult> {
  await requireRole(["admin"]);
  if (!isStaffRole(role)) {
    return { ok: false, error: "Only support and sales accounts can be created here." };
  }
  const invalid = validateStaffInput(name, phone);
  if (invalid) return { ok: false, error: invalid };
  const trimmedPhone = phone.trim();
  try {
    const existing = await db.getUserByPhone(trimmedPhone);
    if (existing) {
      return { ok: false, error: "A user with this phone number already exists." };
    }
    await db.createUser({
      name: name.trim(),
      phone_number: trimmedPhone,
      role,
    });
    revalidateAfterWrite(role);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}

export async function updateStaffUserAction(
  userId: string,
  input: { name: string; phone: string }
): Promise<ActionResult> {
  await requireRole(["admin"]);
  const invalid = validateStaffInput(input.name, input.phone);
  if (invalid) return { ok: false, error: invalid };
  const trimmedPhone = input.phone.trim();
  try {
    const target = await db.getUserById(userId);
    if (!target) return { ok: false, error: "User not found." };
    if (!isStaffRole(target.role)) {
      return { ok: false, error: "Only support and sales accounts can be edited here." };
    }
    const existing = await db.getUserByPhone(trimmedPhone);
    if (existing && existing.id !== userId) {
      return { ok: false, error: "A user with this phone number already exists." };
    }
    await db.updateUser(userId, {
      name: input.name.trim(),
      phone_number: trimmedPhone,
    });
    revalidateAfterWrite(target.role);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}

export async function deleteStaffUserAction(
  userId: string
): Promise<ActionResult> {
  await requireRole(["admin"]);
  try {
    const target = await db.getUserById(userId);
    if (!target) return { ok: false, error: "User not found." };
    if (!isStaffRole(target.role)) {
      return { ok: false, error: "Only support and sales accounts can be deleted here." };
    }
    await db.deleteUser(userId);
    revalidateAfterWrite(target.role);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}
