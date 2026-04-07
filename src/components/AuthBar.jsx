/**
 * Top-right account menu (avatar) — only when signed in.
 * Guests use “create yours” on the page for sign-in; no duplicate sign-in control in the nav.
 */
import { useAuth } from "../context/AuthContext.jsx";
import SignupWidget from "./SignupWidget.jsx";

export default function AuthBar({ className = "", variant = "floating" }) {
  const { user, sessionReady } = useAuth();
  const loggedIn = Boolean(sessionReady && user?.email);

  if (variant !== "floating" || !loggedIn) {
    return null;
  }

  return (
    <SignupWidget variant="nav" align="end" className={className} />
  );
}
