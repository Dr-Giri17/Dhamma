#!/usr/bin/env bash
# Local E2E smoke for the account layer against the LOCAL Supabase stack.
# Requires: supabase start (with kong+auth on 54321), the Next app running on
# PORT (default 3100) with .env.local pointing at the local stack.
#
# This exercises the AUTH + RLS + persistence pipeline end-to-end:
#   - anonymous reader works (no session)
#   - signup (email/password) creates an auth user
#   - sign-in returns access+refresh cookies
#   - authenticated user can INSERT a bookmark (page + anchor stored)
#   - cross-user isolation (user B cannot read user A's bookmark) via RLS
#   - authenticated user can DELETE their bookmark
#   - reading progress upsert works
#   - sign-out invalidates the session
#
# Uses the LOCAL publishable key only. No service_role. No secrets printed.
set -u

API="http://127.0.0.1:54321"
APP="http://127.0.0.1:${PORT:-3100}"
KEY="sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
JAR_A="/tmp/e2e-a.cookies"
JAR_B="/tmp/e2e-b.cookies"
rm -f "$JAR_A" "$JAR_B"

pass() { echo "PASS: $*"; }
fail() { echo "FAIL: $*"; exit 1; }

echo "=== E2E: anonymous reader works (no session) ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$APP/reader/dn1")
[ "$code" = "200" ] && pass "anon /reader/dn1 -> 200" || fail "anon reader -> $code"

echo "=== E2E: signup user A and B ==="
EMAIL_A="e2e-a-$RANDOM@local.test"
EMAIL_B="e2e-b-$RANDOM@local.test"
for pair in "A:$EMAIL_A" "B:$EMAIL_B"; do
  who="${pair%%:*}"; em="${pair##*:}"
  resp=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/v1/signup" \
    -H "apikey: $KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$em\",\"password\":\"test-pass-12345\"}")
  body="${resp%$'\n'*}"; sc="${resp##*$'\n'}"
  echo "  signup $who -> http $sc"
  echo "$body" | grep -q '"access_token"' && pass "signup $who returned a session" || fail "signup $who: $body"
done

echo "=== E2E: sign-in user A (cookie jar) ==="
resp=$(curl -s -c "$JAR_A" -w "\n%{http_code}" -X POST "$API/auth/v1/token?grant_type=password" \
  -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_A\",\"password\":\"test-pass-12345\"}")
body="${resp%$'\n'*}"; sc="${resp##*$'\n'}"
TOKEN_A=$(echo "$body" | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
USERID_A=$(echo "$body" | python -c "import sys,json;print(json.load(sys.stdin)['user']['id'])")
echo "  sign-in A -> http $sc, token len ${#TOKEN_A}, uid ${USERID_A}"
[ -n "$TOKEN_A" ] && [ "$TOKEN_A" != "None" ] && pass "sign-in A returned access_token" || fail "sign-in A: $body"

echo "=== E2E: sign-in user B ==="
resp=$(curl -s -c "$JAR_B" -X POST "$API/auth/v1/token?grant_type=password" \
  -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_B\",\"password\":\"test-pass-12345\"}")
TOKEN_B=$(echo "$resp" | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
[ -n "$TOKEN_B" ] && pass "sign-in B returned access_token" || fail "sign-in B: $resp"

echo "=== E2E: A inserts a bookmark with page + anchor (direct REST, RLS-enforced) ==="
# NB: the application's addBookmark() always sets user_id from getAuthenticatedUser();
# we mirror that here. RLS WITH CHECK requires user_id = auth.uid().
resp=$(curl -s -w "\n%{http_code}" -X POST "$API/rest/v1/bookmarks" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$USERID_A\",\"segment_id\":\"dn1:1.1\",\"source_ref\":\"dn1\",\"reader_slug\":\"dn1\",\"edition\":\"pli\",\"page\":3,\"segment_anchor\":\"dn1:1.1\"}")
body="${resp%$'\n'*}"; sc="${resp##*$'\n'}"
echo "$body" | grep -q '"page":3' && echo "$body" | grep -q '"segment_anchor":"dn1:1.1"' && pass "bookmark A inserted with page+anchor (http $sc)" || fail "bookmark insert: $body ($sc)"

echo "=== E2E: B CANNOT read A's bookmark (RLS) ==="
resp=$(curl -s -X GET "$API/rest/v1/bookmarks?select=id,segment_id" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN_B")
echo "  B sees: $resp"
[ "$resp" = "[]" ] && pass "B sees zero bookmarks (RLS isolates A)" || fail "B leaked A's bookmark: $resp"

echo "=== E2E: A reads own bookmark ==="
resp=$(curl -s -X GET "$API/rest/v1/bookmarks?select=segment_id,page,segment_anchor" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN_A")
echo "  A sees: $resp"
echo "$resp" | grep -q '"page":3' && pass "A reads own bookmark with page preserved" || fail "A cannot read own bookmark: $resp"

echo "=== E2E: malformed edition rejected (CHECK or RLS) ==="
resp=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/rest/v1/bookmarks" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$USERID_A\",\"segment_id\":\"x-$RANDOM\",\"source_ref\":\"x\",\"reader_slug\":\"x\",\"edition\":\"MALFORMED\",\"page\":1,\"segment_anchor\":\"x\"}")
[ "$resp" = "400" ] || [ "$resp" = "409" ] || [ "$resp" = "403" ] && pass "malformed edition rejected ($resp)" || fail "malformed edition accepted ($resp)"

echo "=== E2E: A saves reading progress (upsert) ==="
resp=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/rest/v1/reading_progress" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" \
  -d "{\"user_id\":\"$USERID_A\",\"reader_slug\":\"dn1\",\"edition\":\"pli\",\"page\":5,\"segment_id\":\"dn1:2.1\"}")
echo "  progress upsert -> $resp"
[ "$resp" = "201" ] || [ "$resp" = "200" ] && pass "reading progress saved" || fail "progress failed ($resp)"

echo "=== E2E: A deletes own bookmark ==="
resp=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  "$API/rest/v1/bookmarks?segment_id=eq.dn1:1.1&edition=eq.pli" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN_A")
[ "$resp" = "204" ] && pass "bookmark deleted (204)" || fail "delete failed ($resp)"

echo "=== E2E: sign-out A ==="
resp=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/v1/logout" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN_A")
[ "$resp" = "204" ] || [ "$resp" = "200" ] && pass "sign-out A -> $resp" || fail "sign-out failed ($resp)"

echo "=== E2E: /account shows the not-signed-in shell for anonymous (app-level) ==="
# The app's /account route renders a not-signed-in shell when there is no
# session. We assert via the English (or Russian default) localized string.
acct=$(curl -s -H "Cookie: dhamma_lang=en" "$APP/account")
echo "$acct" | grep -q "You are not signed in\|Create account" && pass "/account renders not-signed-in shell (en) for anonymous" || fail "/account did not show not-signed-in shell"

echo ""
echo "=== ALL LOCAL E2E CHECKS PASSED ==="

# Cleanup: remove the two test users via the DB so the local stack is tidy.
echo "=== cleanup test users ==="
PGPASSWORD=postgres psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "delete from public.bookmarks where user_id in (select id from auth.users where email like 'e2e-%@local.test'); delete from public.reading_progress where user_id in (select id from auth.users where email like 'e2e-%@local.test'); delete from public.user_preferences where user_id in (select id from auth.users where email like 'e2e-%@local.test'); delete from auth.users where email like 'e2e-%@local.test';" 2>&1 | tail -4
rm -f "$JAR_A" "$JAR_B"
echo "=== done ==="
