/**
 * The claim — CLAUDE.md §9.1 and §9.6, §10's Input, §2's vocabulary.
 *
 * "Claim moodscreen.live/yourname", never "Sign up". The difference is not
 * politeness: signing up is something you do for a product, and claiming is
 * something you do to a thing that already exists — which by this point on the
 * page it does, because the visitor made one in the hero.
 *
 * The domain sits inside the field as a fixed prefix (§10), not as a label
 * above it, because what is being claimed is the whole URL. Put the domain in
 * a label and the ask collapses into "pick a username", which converts worse.
 *
 * The button is `<ScreenButton>` — the screen in miniature, wearing the mood
 * currently being edited. Every other primary action on the site is that
 * shape, and this is the primary action on the page.
 */
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ScreenButton from "./brand/ScreenButton.jsx";
import { UsernameInput } from "./ui/Input.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useMoodscreen } from "../context/MoodscreenContext.jsx";
import { rememberClaim } from "../lib/claimedUsername.js";
import {
  isReservedUsername,
  isUsernameSlugValid,
  normalizeUsernameSlug,
} from "../lib/profileUtils.js";

export default function ClaimField({
  className = "",
  /**
   * `center` in the hero, which is the one centred section (§5); `start`
   * everywhere else. A prop rather than a class passed in, because
   * `items-start` and `items-center` are both Tailwind utilities and which one
   * wins is decided by their order in the stylesheet, not in the class string.
   */
  align = "center",
  /**
   * Rendered beside the claim button. The hero puts Download here, because
   * these are the two things you can do with a finished Moodscreen and they
   * belong in the same row — but they are not the same action, and the claim
   * must never be mistaken for the way to get the file.
   */
  secondaryAction = null,
  onClaim,
}) {
  const [error, setError] = useState(null);
  const { user, sessionReady, profile, openAuthModal } = useAuth();
  /**
   * The typed handle lives in the context, not here, so the Moodscreen wears
   * it as it is typed. Keeping it local was the bug: the field looked like the
   * place you put your name and the card never acknowledged it.
   */
  const { moodscreenProps, draftUsername, setDraftUsername } = useMoodscreen();
  const navigate = useNavigate();

  const raw = draftUsername;
  const slug = useMemo(() => normalizeUsernameSlug(raw), [raw]);

  const submit = useCallback(
    (e) => {
      e?.preventDefault?.();

      if (!slug) {
        setError("Pick a name for your page.");
        return;
      }
      if (isReservedUsername(slug)) {
        setError("That one is taken by the site itself. Try another.");
        return;
      }
      if (!isUsernameSlugValid(slug)) {
        setError("Three to thirty characters: letters, numbers, underscore.");
        return;
      }

      setError(null);
      /* Survives the sign-in redirect, so nobody types their name twice. */
      rememberClaim(slug);

      if (sessionReady && user?.id) {
        /* Already has a page — go and look at it. Already has an account but
         * no page — finish setting it up. */
        navigate(profile?.username ? `/${profile.username}` : "/onboarding");
        return;
      }

      /* A guest keeps everything they have made; §1 is guest-first. Sign-in
       * is only what makes the name stick. */
      openAuthModal();
      onClaim?.(slug);
    },
    [slug, sessionReady, user?.id, profile?.username, navigate, openAuthModal, onClaim],
  );

  return (
    <form
      onSubmit={submit}
      className={[
        "flex flex-col gap-4",
        align === "start" ? "items-start" : "items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <UsernameInput
        className="w-full"
        value={raw}
        onChange={(e) => {
          /* Normalised on the way in, so what the field shows and what the
           * card shows are the same string — a space typed here would
           * otherwise appear as an underscore on the Moodscreen. */
          setDraftUsername(normalizeUsernameSlug(e.target.value));
          if (error) setError(null);
        }}
        error={error}
        aria-label="Claim moodscreen.live/yourname"
      />

      <div className="flex flex-wrap items-center gap-3">
        <ScreenButton type="submit" mood={moodscreenProps.mood}>
          Claim yours
        </ScreenButton>
        {secondaryAction}
      </div>
    </form>
  );
}
