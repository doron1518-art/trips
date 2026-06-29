// Public diagnostic endpoint — no auth required.
// Visit /api/health on Vercel to confirm the app starts and env vars are present.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return Response.json({
    ok: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? `${url.slice(0, 30)}…` : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? `${key.slice(0, 10)}…` : 'MISSING',
    },
  })
}
