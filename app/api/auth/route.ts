import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, action } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const serviceClient = await createServiceClient();

    // -------------------------------------------------------------------------
    // Seamless Auth for Hackathon:
    // Ensures any user is created or confirmed with ZERO email verification.
    // -------------------------------------------------------------------------
    if (action === "seamless" || action === "signup" || action === "confirm_existing") {
      const userPassword = password && password.length >= 6 ? password : "rootwise2026!";

      // 1. Check if user exists
      const { data: listData } = await serviceClient.auth.admin.listUsers();
      const existing = listData?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      if (existing) {
        // If user exists, ensure they are 100% confirmed with no email verification barrier
        await serviceClient.auth.admin.updateUserById(existing.id, {
          email_confirm: true,
          password: userPassword,
        });

        return NextResponse.json({
          success: true,
          message: "User auto-confirmed without verification",
          user: existing,
        });
      } else {
        // Create brand new pre-confirmed user
        const { data: newUser, error: createError } =
          await serviceClient.auth.admin.createUser({
            email: cleanEmail,
            password: userPassword,
            email_confirm: true,
          });

        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: "User created and confirmed instantly",
          user: newUser.user,
        });
      }
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
