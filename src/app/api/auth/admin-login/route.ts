import { NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "admin_session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    const adminEmail = process.env.ADMINID?.trim().toLowerCase();
    const adminPassword = process.env.ADMINPASSWORD?.trim();

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, message: "Admin env credentials are not configured." },
        { status: 500 },
      );
    }

    if (!email || !password || email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid admin credentials." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, "authenticated", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid login request." },
      { status: 400 },
    );
  }
}
