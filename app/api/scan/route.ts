import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { code } = body;

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
