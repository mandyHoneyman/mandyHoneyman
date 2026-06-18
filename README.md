# Ward Visitor Management System

A web-based visitor management system for locked hospital wards. Designed to replace intercom and telephone-based entry systems with a simple kiosk and a coordinator-facing dashboard.

---

## The Problem

On locked wards — HDU, ITU, and similar critical care environments — visitors arrive at a locked entrance and must signal their presence by bell or telephone. When the ward is busy, which is often, nobody answers. The visitor has no way of knowing whether their signal was received. They wait, try again, and may become distressed.

This is not a staffing failure. It is a system failure. The current system provides no acknowledgement, no feedback, and no resilience when the people responsible for the door are occupied with patients.

The core problem: **visitors are forgotten — not through neglect, but because there is no reliable mechanism to ensure their arrival is registered.**

---

## The Solution

A lightweight web application with two components:

**1. Visitor Kiosk** — a tablet at each entrance running a full-screen browser. The visitor enters their first name and bay number, or selects "I don't know the bay number" if unsure. The screen immediately confirms their arrival has been registered. They are never left without information.

**2. Coordinator Dashboard** — a browser page at the reception or coordinator desk. Shows a live queue of waiting visitors, colour-coded by wait time, with an audible alert on a new arrival and a "while you were away" summary on every return to the screen — including after standard NHS auto-logout — so a sound missed at a distance is never the only safeguard. Handled by the receptionist, or by a covering coordinator when reception is unstaffed. Actions: Admit or Send Message. The same screen also provides ward configuration — visiting hours, restricted periods, canned messages, and bay-movement handling — so one person can both use and administer the system.

### Core design principle

> The nurse at the bay is always the decision-maker. This system's job is to make sure that decision gets triggered reliably — and that the visitor always knows their arrival has been registered.

---

## Key Features — v1 (Core)

- **Immediate visitor acknowledgement** — kiosk confirms receipt before any staff action
- **Coordinator-led queue** — handled by receptionist or covering coordinator, with a two-part safeguard: an audible alert for when they're nearby, and a "while you were away" summary on every return to the screen for when they're not
- **Escalating alerts** — wait times colour-code from green to red; visitor can send a reminder after 15 minutes
- **Bay movement handling** — if a patient has moved bay, the coordinator can quietly redirect a visitor's request to the correct bay without revealing the move; the visitor is told only that the ward has been notified, and the move itself is communicated to the family in person, in the normal way
- **Restricted period toggle** — ward rounds, handover, or emergency closure; kiosk updates immediately; toggle is on the dashboard itself, not buried in a separate admin screen
- **Automatic nightly reset** — sessions close and bay counts reset at a configured time; visit log retained; bay-movement redirects persist independently of the reset for 24 hours
- **Automatic visiting hours** — kiosk opens and closes at configured start and end times; no staff action needed
- **Canned messages** — staff send pre-written messages to the visitor's kiosk screen with one tap
- **Multi-language kiosk** — language selector persists for the session; bay number entry is numeric and language-neutral
- **Visit log** — full timestamped record of arrivals, wait times, admissions, and actioning staff member
- **Pilot feedback via QR code** — kiosk frame carries a QR code linking to a trust Microsoft Forms survey; no in-system feedback pipeline to build or govern

---

## What is Deliberately Out of Scope — v1

These features are designed and documented but excluded from v1 to keep the system simple and deliverable. They are held on the roadmap.

| Feature | Phase | Reason deferred |
|---|---|---|
| Visitor sign-out and real-time bay capacity | 2 | Unreliable without enforced sign-out; causes more interruptions than it saves |
| End of life bay handling | 2 | Removed entirely pending a proper conversation with clinical staff; current practice may differ substantially from a routine flag-and-prioritise model |
| Lock-screen visitor count; smart re-entry on login | 2 | Depends on whether trust IT can customise a standard NHS PC's lock screen — unknown; v9's "while you were away" summary already covers the core need |
| Approved visitor lists and next-of-kin designation | 3 | Requires IG and legal review; patient consent process to be defined |
| Multi-ward management view | 4 | Depends on stable single-ward deployment first |
| Reporting and analytics | 4 | Visit log accumulates data; reporting view can be added later |

---

## System Architecture

### Frontend

| File | Purpose |
|---|---|
| `kiosk.html` | Visitor-facing entrance screen; full-screen mode on tablets |
| `dashboard.html` | Coordinator view and ward configuration; reception/coordinator desk PC |
| `style.css` | Shared styles |
| `app.js` | Shared logic — form handling, real-time updates, audible alert |

### Backend

| Component | Purpose |
|---|---|
| Node.js + Express | HTTP server and API routes |
| Real-time updates | WebSockets, server-sent events, or polling — final choice depends on pilot scale |
| SQLite | Visit records, ward state, bay-movement redirects |
| Cron jobs | Nightly reset; visiting hours start/end; bay-movement redirect expiry (24 hours) |

### Real-time flow

```
Visitor submits form on kiosk
  → POST to server
  → If bay has an active movement redirect, request is reassigned silently
  → Record saved to database
  → Dashboard updates live; audible alert plays
  → Kiosk shows confirmation immediately — no bay number echoed back
```

---

## Data Model — Summary

The system stores the minimum necessary. **No surnames and no patient names are stored at any point.**

**Visit record** — visitor first name, bay number (as entered, before any redirect), ward, entrance, arrived_at, admitted_at, status, actioned_by, reminder_sent, messages, language

**Bay record** — bay_id, ward, visitor_admitted_today, active

**Bay movement redirect** — from_bay, to_bay, set_by, set_at, expires_at (24 hours after set_at). Persists independently of the nightly reset. Used to silently reassign a visitor's request; never disclosed to the visitor.

**Ward state** — ward_name, visiting_start_time, visiting_end_time, visiting_active, restricted_period_active, restriction_type, resume_time, entrances, languages, canned_messages

First name and bay number are the only personal data held. Bay number is the only link between a visitor record and a patient location.

---

## Kiosk States

| State | Trigger |
|---|---|
| Ready for input | Default during visiting hours |
| Confirmed | After visitor submits first name and bay number, or selects "I don't know the bay number" |
| Restricted period | Ward round / handover / emergency — set by coordinator |
| Visiting hours ended | Automatic at configured end time |
| Staff message | Coordinator sends canned or custom message to waiting visitor |

"I don't know the bay number" does not trigger a lookup. It flags the visitor to the coordinator as needing in-person help.

---

## Hosting

### Pilot — preferred
A Raspberry Pi or small mini PC, physically on the ward, running its own private WiFi network (travel router or the Pi's own access point). The kiosk tablet and the coordinator desk PC connect to this network only. No NHS WiFi, no internet, no data leaving the building. Approximate hardware cost £150–250, one-off.

### Pilot — fallback
A small UK-based VPS with HTTPS via Let's Encrypt, accessed over NHS WiFi. Viable if the local-appliance approach proves impractical, but requires captive portal testing and raises a data-residency conversation that the local appliance avoids.

### Production
Trust-hosted infrastructure or NHS-accredited cloud platform. Trust IT and information governance team must be involved before production deployment.

### Not suitable
GitHub Pages (static only — no backend). Personal web hosting (not appropriate for patient-adjacent data).

---

## Security and Network Notes

If the local-appliance pilot architecture is used, the system never touches NHS WiFi or the internet, which removes most of the network risk below by design.

If the VPS fallback is used instead, this system should run over HTTPS at all times — non-negotiable — and the following apply:

1. **HTTPS** encrypts traffic between browser and server and mitigates the main risk of a public network.
2. **Coordinator dashboard on open WiFi** is a concern — visitor first names and bay numbers are displayed. Ideally accessed from the trust's internal staff network rather than the public WiFi.
3. **Captive portal** — NHS open WiFi often requires a browser sign-in page. Tablets in kiosk mode may not handle this automatically. A dedicated ward SSID or VLAN would solve this if the VPS fallback is used.

---

## Outstanding Items Before Pilot

| # | Item | Owner |
|---|---|---|
| A | Confirm wait time thresholds (proposed: 5 min amber, 15 min red) with ward staff | Ward sister / matron |
| B | Identify languages needed on kiosk beyond English; arrange translations | Ward / developer |
| C | Information governance review; DPIA if required | Trust IG team |
| D | Procure and install kiosk tablet(s) and coordinator-desk hardware | Trust / developer |
| E | Confirm bay-movement redirect workflow with reception/coordinator staff | Ward sister / matron |
| G | Notify trust IT and IG before go-live, even for a limited pilot | Project lead |

---

## Roadmap

### Phase 2 — Visitor sign-out, capacity tracking, and EOL handling
Visitor taps "I am leaving" on kiosk. Bay count updated. Coordinator can manually clear a visitor from the dashboard. Real-time bay capacity enforced once sign-out is reliable.

**Known problem to solve first:** visitors who step out temporarily and forget to sign out are locked out on return. This must be addressed before sign-out can gate admission.

**End of life bay handling** also sits in this phase. It was removed from v9 entirely rather than left as a simple priority flag, because a brief conversation with a research-level nurse suggested current EOL practice may differ substantially from a routine queue-priority model. This needs a proper conversation with clinical staff with current HDU/ITU experience before any further design work, not assumptions carried over from elsewhere in the system.

**Lock-screen visitor count and smart re-entry** are smaller refinements also held here: a waiting-visitor count visible on the NHS PC's own lock screen before login, and a dashboard that auto-highlights the longest-waiting visitor on return. Both depend on whether trust IT can customise a standard NHS PC's lock screen, which is unknown — the v9 "while you were away" summary already covers the core need without requiring this.

### Phase 3 — Approved visitor lists
Each patient has a list of approved visitors, built at the bedside by the patient or next of kin with nursing assistance. One next-of-kin designation per patient. Unlisted visitors held pending verification. Ward sister has override authority.

**Prerequisite:** IG and legal review. The distinction between next of kin and Lasting Power of Attorney holder must be clarified by the trust's legal team before next-of-kin is formalised as an access control role.

### Phase 4 — Multi-ward deployment and reporting
The system is already designed to be configurable per ward. Phase 4 adds a trust-wide management view and a reporting dashboard drawing on the accumulated visit log.

---

## Background and Design Process

This system was designed through an extended requirements-gathering process with a senior critical care nurse, with further peer review from a colleague and a conversation with a research-level nurse. The design iterated through multiple blueprint versions, each incorporating new requirements and constraints as they emerged — including a deliberate simplification pass to strip the first version back to its essential core, with several well-understood features moved to a clearly labelled roadmap instead.

Key decisions made during design:

- **No reliance on visitor mobile phones** — the kiosk screen is the only visitor-facing output
- **First name only stored** — sufficient for staff to address the visitor and personalise messages; reduces information governance weight
- **Coordinator-led, not open-to-any-staff** — ward PCs auto-log out as standard NHS practice, which made an always-unlocked, any-staff-member dashboard unworkable; responsibility now sits with the receptionist or covering coordinator
- **Two-part alert, not sound alone** — an audible alert helps when the coordinator is nearby, but a "while you were away" summary on every return to the screen is what actually closes the gap when they are genuinely out of earshot
- **Bay capacity tracking deferred** — sign-out cannot be reliably enforced on distressed visitors; tracking without enforcement creates more problems than it solves
- **Approved visitor lists deferred** — real clinical value but requires governance work that should not delay the core system
- **Bay movement handled silently** — if a patient moves bay, the system redirects a visitor's request without revealing the move, so families are never told about a transfer by a kiosk screen; the redirect expires automatically after 24 hours
- **EOL handling moved to the roadmap entirely** — rather than a simple flag, a brief conversation with a research-level nurse suggested current EOL practice may differ substantially from a routine queue-priority model; proper design needs a real conversation with current clinical staff before it resumes
- **Generic by design** — deployable on any locked ward, not specific to HDU/ITU

---

## Status

> Blueprint in progress. Development not yet started.

The interactive blueprint (HTML, CSS, and JS) is included in this repository and documents the intended system including all screens, data models, rules, and roadmap items. The coordinator-led dashboard and bay-movement handling described above are recent decisions from clinical review.

---

## Licence

Licensed under the [GNU Affero General Public License v3.0 (AGPL v3)](https://www.gnu.org/licenses/agpl-3.0.en.html) during development and pilot phases.

This means anyone using, modifying, or running this software as a web service must release their modifications under the same licence. This is intentional — it ensures improvements made by any organisation deploying this system are shared back with the community.

**The licence will transition to Apache 2.0 upon formal NHS trust adoption.**

The intent behind this approach is to keep the system genuinely open during development, protect against proprietary capture, and then move to a more permissive licence that reduces friction for NHS IT procurement at the point of formal adoption.
