/**
 * Account navigation entry. Server-rendered: shows "Sign in" for anonymous
 * visitors and an "Account" link for signed-in users. Adds no new layout
 * chrome beyond a single text link, so existing RU/EN/ID nav is undisturbed.
 */
export default function AccountNav({
  signedIn,
  signInLabel,
  accountLabel,
}: {
  signedIn: boolean;
  signInLabel: string;
  accountLabel: string;
}) {
  return (
    <a href={signedIn ? "/account" : "/auth/sign-in"} className="link-dhamma">
      {signedIn ? accountLabel : signInLabel}
    </a>
  );
}
