import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const sessionCookie = cookies().get("session");

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = JSON.parse(sessionCookie.value);
    return NextResponse.json({ authenticated: true, user });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
