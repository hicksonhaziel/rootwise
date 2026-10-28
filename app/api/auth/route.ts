import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, action } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();

    // -------------------------------------------------------------------------
    // 1. Sign up with auto-confirmation
    // -------------------------------------------------------------------------
    if (action === "signup") {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Create pre-confirmed user directly via admin API
      const { data: newUser, error: createError } =
        await serviceClient.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password,
          email_confirm: true,
        });

      if (createError) {
        const msg = createError.message.toLowerCase();
        // If user already exists, update & confirm them
        if (msg.includes("already registered") || msg.includes("already exists")) {
          const { data: list } = await serviceClient.auth.admin.listUsers();
          const existing = list?.users?.find(
            (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
          );

          if (existing) {
            await serviceClient.auth.admin.updateUserById(existing.id, {
              email_confirm: true,
              password,
            });
            return NextResponse.json({ success: true, user: existing });
          }
        }
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, user: newUser.user });
    }

    // -------------------------------------------------------------------------
    // 2. Auto-confirm existing unconfirmed user (resolves "Email not confirmed")
    // -------------------------------------------------------------------------
    if (action === "confirm_existing") {
      const { data: list } = await serviceClient.auth.admin.listUsers();
      const existing = list?.users?.find(
        (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (existing) {
        await serviceClient.auth.admin.updateUserById(existing.id, {
          email_confirm: true,
        });
        return NextResponse.json({ success: true, message: "Account auto-confirmed" });
      }

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("[auth/route] Error:", err);
    return NextResponse.json(
      { error: "Authentication service error" },
      { status: 500 }
    );
  }
}
