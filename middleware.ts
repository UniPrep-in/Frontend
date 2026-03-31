import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const protectedPrefixes = ["/profile", "/materials", "/mock-tests", "/lectures"]

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function hasSupabaseAuthCookie(req: NextRequest) {
  return req.cookies
    .getAll()
    .some(
      ({ name }) => name.startsWith("sb-") && name.includes("-auth-token")
    )
}

export async function middleware(req: NextRequest) {
  if (!isProtectedPath(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const redirectToAuth = () => NextResponse.redirect(new URL("/auth", req.url))

  if (!hasSupabaseAuthCookie(req)) {
    return redirectToAuth()
  }

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set({
              name,
              value,
              ...(options || {}),
            })
          })
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return redirectToAuth()
  }

  return res
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/materials/:path*",
    "/mock-tests/:path*",
    "/lectures/:path*",
  ],
}