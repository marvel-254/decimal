import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  portalRoutes,
  getAllowedRoles,
  isProtectedPath,
  isAuthPath,
  resolvePortalRole,
} from "@/lib/auth-config";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isProtected = isProtectedPath(pathname);

  if (!user && !isAuthPath(pathname) && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isProtected) {
    const { data: members } = await supabase
      .from("school_members")
      .select("role, school_id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    let userRole = members?.[0]?.role;

    // Multi-school users are gated by the role in their active school (and,
    // when set, the role they chose at the school picker) so the portal they
    // land in matches the school they selected.
    if ((members?.length ?? 0) > 1) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_school_id")
        .eq("id", user.id)
        .maybeSingle();

      userRole =
        resolvePortalRole(
          members ?? [],
          profile?.active_school_id,
          request.cookies.get("decimal_active_role")?.value ?? null
        ) ?? userRole;
    }

    if (!userRole) {
      // Tuition resolves student/parent identities in its layout, so a user
      // with no member role (e.g. a tuition-only student) may pass to /tuition.
      if (pathname.startsWith("/tuition")) {
        return supabaseResponse;
      }
      const url = request.nextUrl.clone();
      url.pathname = "/no-access";
      return NextResponse.redirect(url);
    }

    const allowedRoles = getAllowedRoles(pathname);
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      const url = request.nextUrl.clone();
      url.pathname = portalRoutes[userRole] ?? "/teacher";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
