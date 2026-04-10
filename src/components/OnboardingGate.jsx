/**
 * Sends signed-in users without a username to /onboarding; completed users away from /onboarding.
 * Allows viewing other users’ /:username while logged in.
 */
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  isReservedUsername,
  isUsernameSlugValid,
  normalizeUsernameSlug,
} from "../lib/profileUtils.js";

function isPublicProfilePath(pathname) {
  const m = pathname.match(/^\/([^/]+)\/?$/);
  if (!m) return false;
  const seg = normalizeUsernameSlug(m[1]);
  if (!seg || isReservedUsername(seg)) return false;
  return isUsernameSlugValid(seg);
}

export default function OnboardingGate() {
  const { user, sessionReady, profile, profileLoading, isSupabaseConfigured } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  useEffect(() => {
    if (!sessionReady || profileLoading) return;
    if (!isSupabaseConfigured || !user?.id) return;

    if (profile?.username) {
      if (pathname === "/onboarding") {
        navigate(`/${profile.username}`, { replace: true });
      }
      return;
    }

    if (pathname === "/onboarding") return;
    if (isPublicProfilePath(pathname)) return;

    navigate("/onboarding", { replace: true });
  }, [
    sessionReady,
    profileLoading,
    user?.id,
    profile?.username,
    pathname,
    navigate,
    isSupabaseConfigured,
  ]);

  return null;
}
