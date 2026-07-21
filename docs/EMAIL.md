# Email setup — tampatower.org

**Architecture:** Cloudflare Email Routing receives and forwards; Brevo SMTP relay sends.
There is no mailbox on tampatower.org — the real inbox is `tampatowerllc@gmail.com`.

```
someone@world  ──▶ MX: route{1,2,3}.mx.cloudflare.net ──▶ tampatowerllc@gmail.com
                                                              │
                                                              │ reply (Gmail "Send mail as")
                                                              ▼
someone@world  ◀── From: support@tampatower.org ◀── smtp-relay.brevo.com:587
```

Addresses in scope: `support@tampatower.org`, `ycortes@tampatower.org`.

---

## Starting state (captured 2026-07-21)

| Record | Value |
|---|---|
| NS | `huxley.ns.cloudflare.com`, `fatima.ns.cloudflare.com` |
| MX | `aspmx.l.google.com` (1), `alt1`/`alt2` (5), `alt3`/`alt4` (10) |
| SPF | `v=spf1 include:_spf.google.com ~all` |
| DMARC | `v=DMARC1; p=none; rua=mailto:postmaster@tampatower.org` |
| TXT | `google-site-verification=JvCvIbVl8-sxj2zbnWN1nNaTm_RmRJImhyiuT7ccErQ` |

Google Workspace is being **dropped**. Its MX records get replaced in Phase 1.

---

## Phase 1 — Cloudflare Email Routing (receiving)

Dashboard → `tampatower.org` → **Email** → **Email Routing**.

1. **Add + verify the destination first.** Destination: `tampatowerllc@gmail.com`.
   Cloudflare emails a verification link to that Gmail. Click it.
   This works *before* the MX swap — do it first so nothing is in limbo.

2. **Create the custom addresses:**
   - `support@tampatower.org` → `tampatowerllc@gmail.com`
   - `ycortes@tampatower.org` → `tampatowerllc@gmail.com`
   - `postmaster@tampatower.org` → `tampatowerllc@gmail.com`  ← see DMARC note below

3. **Delete the old Google records BEFORE adding Cloudflare's.**

   ⚠️ Email Routing → Settings → **Add missing records** *refuses to run* while any
   non-Cloudflare MX record exists: *"Existing non-Cloudflare MX records conflict
   with Email Routing. Remove or update them and try again."* There is no
   merge/replace flow and no way to stage both — old must go first.

   In **DNS → Records**, delete six records:
   - the five Google MX (`aspmx`, `alt1`–`alt4`)
   - the TXT `v=spf1 include:_spf.google.com ~all`

   Deleting the old SPF here is deliberate: Cloudflare adds its own SPF in step 4,
   so removing Google's first means the zone never holds two SPF records.

   **Keep** `google-site-verification` (Search Console), `google._domainkey`
   (inert but harmless), and `_dmarc`.

   ⚠️ **Cutover happens here.** Between this deletion and step 4 the domain has no
   MX at all; senders fall back to the A record, which is the Worker and doesn't
   speak SMTP, so mail **queues at the sender and retries** — delayed, not bounced.
   Keep the gap to a minute or two. TTL was 300s, so the tail is ~5 minutes.

4. **Email Routing → Settings → Add missing records.** The red warning should be
   gone. Cloudflare adds three MX, its DKIM key, and its SPF record. Let it assign
   the MX priorities — it randomizes them per zone (this zone got 12/26/40), so
   don't hand-type values from a blog post.

5. **Add Brevo to SPF.** Edit the SPF record Cloudflare just created to:

   ```
   v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com ~all
   ```

   Adding Brevo before the Brevo account exists is harmless and saves editing the
   record twice. A domain may have exactly **one** SPF TXT record — two is a
   permerror that fails all outbound auth.

---

## Phase 2 — Brevo (sending)

Free plan: **300 emails/day**, SMTP relay at `smtp-relay.brevo.com:587` (STARTTLS).

1. Sign up at brevo.com using `tampatowerllc@gmail.com`.
   → New free accounts sometimes get held for manual review before SMTP is
   unlocked. If that happens, Phase 3 is blocked until it clears.

2. **Senders, Domains & Dedicated IPs → Domains → Add domain** → `tampatower.org`
   → Authenticate.

3. Brevo hands you DNS records. Add each in Cloudflare DNS **exactly as shown**:
   - `TXT` at root — `brevo-code:<hash>` (ownership proof)
   - `TXT` DKIM — host is usually `brevo._domainkey`, but use whatever host Brevo
     displays; the selector has changed across Brevo generations.
   - SPF — **do not add a second SPF record.** Edit the existing one to the merged
     value in Phase 1 step 4.
   - DMARC — one already exists; leave it.

4. Wait for Brevo to show the domain as authenticated (usually minutes on
   Cloudflare DNS).

5. **SMTP → SMTP & API → SMTP tab.** Copy the **login** (your Brevo account email)
   and generate an **SMTP key**. Treat the key like a password — it goes straight
   into Gmail in Phase 3 and nowhere else.

---

## Phase 3 — Gmail "Send mail as"

Requires Phase 1 live (the confirmation code has to actually arrive) and Phase 2
authenticated.

In `tampatowerllc@gmail.com` → **Settings → Accounts and Import → Send mail as →
Add another email address**. Repeat for each address:

| Field | `support@` | `ycortes@` |
|---|---|---|
| Name | Tampa Tower Academy | Yunior Cortes |
| Email | support@tampatower.org | ycortes@tampatower.org |
| Treat as alias | ✅ leave checked | ✅ leave checked |
| SMTP server | `smtp-relay.brevo.com` | same |
| Port | `587` | same |
| Username | Brevo SMTP login | same |
| Password | Brevo SMTP key | same |
| Security | TLS | same |

Gmail sends a confirmation code to the address → it forwards through Cloudflare →
lands in the same inbox → paste it back.

Optionally set `support@tampatower.org` as the default From.

---

## Phase 4 — Cleanup and verification

1. **Verify before cancelling anything.** Send a test message from an outside
   address to `support@` and to `ycortes@`; reply to both from Gmail; confirm the
   recipient sees the tampatower.org From address.

2. Check alignment — open the reply in another Gmail account, **Show original**,
   and confirm all three:
   ```
   SPF:   PASS
   DKIM:  PASS   (d=tampatower.org, not d=brevo.com)
   DMARC: PASS
   ```
   `d=brevo.com` means domain authentication in Phase 2 didn't finish.

3. **Cancel Google Workspace** — only now.

4. **Keep** the `google-site-verification` TXT if Search Console still uses it for
   the domain property. Removing it silently drops your Search Console access.

5. Once mail has flowed cleanly for a week or two, tighten DMARC:
   ```
   v=DMARC1; p=quarantine; rua=mailto:postmaster@tampatower.org
   ```

---

## Verified state after Phase 1 (2026-07-21)

Read from the authoritative nameserver (`huxley.ns.cloudflare.com`):

```
MX   route3.mx.cloudflare.net   12
MX   route1.mx.cloudflare.net   26
MX   route2.mx.cloudflare.net   40
TXT  tampatower.org        v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com ~all
TXT  tampatower.org        google-site-verification=JvCvIbVl8-...
TXT  cf2024-1._domainkey   v=DKIM1 (Cloudflare)
TXT  google._domainkey     v=DKIM1 (stale, inert)
TXT  _dmarc                v=DMARC1; p=none; rua=mailto:postmaster@tampatower.org
A    tampatower.org        104.21.53.95 / 172.67.211.152 (Worker, untouched)
```

Receiving confirmed working for `support@` and `ycortes@`. Sending not yet set up
— Phase 2 pending. Google Workspace still active and NOT yet cancelled.

## Gotchas

- **One SPF record only.** Two SPF TXT records = permerror = everything fails.
- **The DNS dashboard search box filters record *content*, not type.** Typing `txt`
  returns a partial, misleading list and the "N of 200 records" counter goes stale
  with it — it looked like the SPF record had been deleted when it hadn't. Use
  **Filters → Type** instead, and confirm against public DNS before believing the
  UI. Verify with:
  `Resolve-DnsName tampatower.org -Type TXT -Server huxley.ns.cloudflare.com`
- **Cloudflare Email Routing cannot send.** It is forward-only. All outbound goes
  through Brevo. There is no webmail and no IMAP — Gmail is the client.
- **DMARC `rua` points at `postmaster@tampatower.org`**, which won't exist unless
  you create the routing rule in Phase 1 step 2. Otherwise aggregate reports bounce.
  Alternative: repoint `rua` at `tampatowerllc@gmail.com`.
- **300 emails/day** on Brevo free. Fine for replies; a future contact form or any
  bulk parent mailing would need a paid tier.
- **Check whether Brevo's free tier appends branding** to SMTP-relay mail. Their
  free-plan footer is documented for marketing campaigns; confirm behavior on
  transactional relay with a test send before relying on it for parent-facing mail.
- The site has **no contact form** — [contact.astro](../src/pages/contact.astro) uses
  a plain `mailto:` link. If a form is added later, it can reuse the same Brevo
  SMTP credentials from a Cloudflare Pages Function.
