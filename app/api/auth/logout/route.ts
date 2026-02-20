import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.delete("github_token");
  res.cookies.delete("github_user");
  res.cookies.delete("oauth_state");
  return res;
}

export async function POST(req: Request) {
  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.delete("github_token");
  res.cookies.delete("github_user");
  res.cookies.delete("oauth_state");
  return res;
}
