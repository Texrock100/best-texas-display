"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

// Shows an "Edit Display" link only to the display's owner or an admin.
// Rendered inside the (server-rendered) display detail page.
export default function OwnerEditLink({ displayId, ownerId }: { displayId: number; ownerId: number | null }) {
  const { user } = useAuth();
  if (!user) return null;
  if (user.id !== ownerId && user.role !== "admin") return null;

  return (
    <Link
      href={`/displays/${displayId}/edit`}
      className="inline-flex items-center gap-1 text-sm font-medium text-[#1B3A5C] bg-white/90 hover:bg-white px-3 py-1.5 rounded-lg transition-colors"
    >
      ✏️ Edit Display
    </Link>
  );
}
