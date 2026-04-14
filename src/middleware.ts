import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // OPTIMASI: Gunakan getSession() untuk pemeriksaan cepat di middleware jika memungkinkan
  // Namun untuk keamanan rute /dashboard, getUser() tetap disarankan.
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname === '/signin' || request.nextUrl.pathname === '/signup'
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')

  if (!user && isDashboardPage) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/signin', '/signup'],
}
