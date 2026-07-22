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

   Brevo requires a **branded subdomain** (required field, not optional). We used
   `send` → `send.tampatower.org`. Avoid `mail`, in case that name is wanted later.

3. Brevo hands you seven DNS records. Add **six** in Cloudflare, all CNAMEs set to
   **DNS only** (grey cloud) — Cloudflare defaults CNAMEs to proxied, and a proxied
   record makes Cloudflare answer with its own IPs so Brevo verification fails:

   | Type | Name | Content |
   |---|---|---|
   | CNAME | `send` | `send-tampatower-org.brand.brevosend.com` |
   | CNAME | `brevo1._domainkey` | `b1.tampatower-org.dkim.brevo.com` |
   | CNAME | `brevo2._domainkey` | `b2.tampatower-org.dkim.brevo.com` |
   | CNAME | `img.send` | `send-tampatower-org.img.brand.brevosend.com` |
   | CNAME | `r.send` | `send-tampatower-org.r.brand.brevosend.com` |
   | TXT | `@` | `brevo-code:14f44b9791361e9c7ff793e609681f10` |

   ⚠️ **Do NOT add Brevo's seventh record**, the DMARC one
   (`v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com`). A domain may have exactly
   one `_dmarc` record; a second makes DMARC invalid and receivers treat the domain
   as having no policy at all. Keep the existing `rua=mailto:postmaster@`. The only
   loss is Brevo-side report analytics — delivery and alignment are unaffected.

   Brevo also offers an SPF record. **Skip it** — SPF was already merged in Phase 1
   step 5.

4. Click **Verify records**. Confirmation is "Domain authenticated and branded".

5. **SMTP & API → SMTP tab.** Note the settings and generate an **SMTP key**.

   ⚠️ The **login is not your email address** — Brevo issues a dedicated relay
   identifier like `b2d191001@smtp-brevo.com`. Using the account email fails auth.

   ⚠️ **SMTP keys default to a 1-year expiry.** Choose "No expiry" if offered;
   otherwise the key dies on its expiry date and Gmail stops sending with an
   unhelpful error long after anyone remembers this setup. See Open items below.

   The key is a password. It goes into Gmail once and nowhere else — never into a
   chat, screenshot, or commit.

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
| Username | `b2d191001@smtp-brevo.com` | same |
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

Brevo records added on top of the above (all CNAMEs DNS-only, verified resolving):
`send`, `brevo1._domainkey`, `brevo2._domainkey`, `img.send`, `r.send`, plus the
`brevo-code:` TXT at the apex.

**Status: working end to end.**

- Receiving confirmed for `support@` and `ycortes@` → `tampatowerllc@gmail.com`
- Sending confirmed via Gmail "Send mail as" → Brevo relay
- mail-tester.com: **8.9/10**, "You're properly authenticated" (SPF + DKIM + DMARC
  all pass; DMARC passing proves DKIM aligns to `d=tampatower.org`), not
  blocklisted. The −0.6 SpamAssassin / −0.5 body deductions came from the short
  test message itself, not from domain configuration.

## Open items

- [ ] **Google Workspace still active and NOT cancelled.** Export anything wanted
      from the old mailboxes via Google Takeout *first* — the archive is only
      reachable while the subscription is live. Workspace is also the rollback:
      recreating the five Google MX records restores the previous setup exactly.
- [ ] **SMTP key expiry unconfirmed.** Brevo defaulted to 1 year (Jul 21, 2027).
      Whether "No expiry" was selected was never verified. If it does expire,
      Gmail sending breaks silently — check the key's expiry in Brevo → SMTP & API
      and set a reminder, or regenerate with no expiry.
- [ ] **Brevo free-tier branding on transactional relay** never tested. Send a real
      message to an outside address and read it as the recipient before using this
      for parent-facing mail.

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
