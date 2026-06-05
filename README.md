# Ward Visitor Management System

A web-based visitor management system for locked hospital wards. Designed to replace intercom and telephone-based entry systems with a simple kiosk, staff dashboard, and ward admin panel.

---

## The Problem

On locked wards — HDU, ITU, and similar critical care environments — visitors arrive at a locked entrance and must signal their presence by bell or telephone. When the ward is busy, which is often, nobody answers. The visitor has no way of knowing whether their signal was received. They wait, try again, and may become distressed.

This is not a staffing failure. It is a system failure. The current system provides no acknowledgement, no feedback, and no resilience when the people responsible for the door are occupied with patients.

The core problem: **visitors are forgotten — not through neglect, but because there is no reliable mechanism to ensure their arrival is registered.**

---

## The Solution

A lightweight web application with three components:

**1. Visitor Kiosk** — a tablet at each entrance running a full-screen browser. The visitor enters their name and bay number. The screen immediately confirms their arrival has been registered. They are never left without information.

**2. Staff Dashboard** — a browser page open on any ward PC. Shows a live queue of waiting visitors, colour-coded by wait time. Any staff member can act — no login required, no assigned responsibility. Two actions: Admit or Send Message.

**3. Ward Admin Panel** — PIN-protected. Used by the ward sister or nurse manager. Configures the ward: visiting hours, restricted periods (ward rounds, handover), EOL bay flags, canned messages, and kiosk languages. No IT support needed for day-to-day use.

### Core design principle

> The nurse at the bay is always the decision-maker. This system's job is to make sure that decision gets triggered reliably — and that the visitor always knows their arrival has been registered.

---

## Key Features — v1 (Core)

- **Immediate visitor acknowledgement** — kiosk confirms receipt before any staff action
- **Shared queue** — any staff member on any ward PC can action a request
- **Escalating alerts** — wait times colour-code from green to red; visitor can send a reminder after 15 minutes
- **EOL flagging** — end-of-life bays shown at top of queue with distinct visual treatment
- **Restricted period toggle** — ward rounds, handover, or emergency closure; kiosk updates immediately
- **Automatic nightly reset** — sessions close and bay counts reset at a configured time; visit log retained
- **Automatic visiting hours** — kiosk opens and closes at configured start and end times; no staff action needed
- **Canned messages** — staff send pre-written messages to the visitor's kiosk screen with one tap
- **Multi-language kiosk** — language selector persists for the session; bay number entry is numeric and language-neutral
- **Visit log** — full timestamped record of arrivals, wait times, admissions, and actioning staff member
- **Pilot feedback widget** — anonymous 1–4 star rating with optional comment; visitor or staff checkbox; active during pilot only

---

## What is Deliberately Out of Scope — v1

These features are designed and documented but excluded from v1 to keep the system simple and deliverable. They are held on the roadmap.

| Feature | Phase | Reason deferred |
|---|---|---|
| Visitor sign-out and real-time bay capacity | 2 | Unreliable without enforced sign-out; causes more interruptions than it saves |
| Approved visitor lists and next-of-kin designation | 3 | Requires IG and legal review; patient consent process to be defined |
| Electronic door release integration | 3 | Estates and IT feasibility unknown |
| Multi-ward management view | 4 | Depends on stable single-ward deployment first |
| Reporting and analytics | 4 | Visit log accumulates data; reporting view can be added later |

---

## System Architecture

### Frontend

| File | Purpose |
|---|---|
| `kiosk.html` | Visitor-facing entrance screen; full-screen mode on tablets |
| `dashboard.html` | Staff view; open on ward PCs |
| `admin.html` | Ward admin panel; PIN-protected |
| `style.css` | Shared styles |
| `app.js` | Shared logic — form handling, WebSocket updates |

### Backend

| Component | Purpose |
|---|---|
| Node.js + Express | HTTP server and API routes |
| Socket.io | Real-time updates — dashboard and kiosk update instantly |
| SQLite (pilot) / PostgreSQL (production) | Visit records, ward state, feedback |
| Cron jobs | Nightly reset; visiting hours start/end |

### Real-time flow

```
Visitor submits form on kiosk
  → POST to server
  → Record saved to database
  → WebSocket broadcast to all dashboard instances
  → Dashboard updates live
  → Kiosk shows confirmation immediately
```

---

## Data Model — Summary

The system stores the minimum necessary. **No patient names are stored at any point.**

**Visit record** — visitor name, bay number, ward, entrance, arrived\_at, admitted\_at, status, actioned\_by, reminder\_sent, messages, language

**Bay record** — bay\_id, ward, eol\_flag, visitor\_admitted\_today, active

**Ward state** — ward\_name, visiting\_start\_time, visiting\_end\_time, visiting\_active, restricted\_period\_active, restriction\_type, resume\_time, entrances, languages, canned\_messages

**Feedback record** (pilot only) — stars, comment, respondent\_type (visitor/staff), source (kiosk/dashboard), submitted\_at. No link to visit records.

Bay number is the only link between a visitor record and a patient location.

---

## Kiosk States

| State | Trigger |
|---|---|
| Ready for input | Default during visiting hours |
| Confirmed | After visitor submits name and bay number |
| Restricted period | Ward round / handover / emergency — set by staff |
| Visiting hours ended | Automatic at configured end time |
| Staff message | Staff sends canned or custom message to waiting visitor |

---

## Hosting

### Pilot
A small VPS (e.g. DigitalOcean, Hetzner) in a UK data centre. Approximately £5–10/month. HTTPS via Let's Encrypt (free). All data on the server — no third-party services.

### Production
Trust-hosted infrastructure or NHS-accredited cloud platform. Trust IT and information governance team must be involved before production deployment.

### Not suitable
GitHub Pages (static only — no backend). Personal web hosting (not appropriate for patient-adjacent data).

---

## Security and Network Notes

This system is intended to run over HTTPS at all times. This is non-negotiable.

The pilot envisages using open NHS hospital WiFi. This creates two considerations:

1. **HTTPS** encrypts traffic between browser and server and mitigates the main risk of a public network.
2. **Staff dashboard on open WiFi** is a concern — visitor names and bay numbers are displayed. Ideally the dashboard is accessed from the trust's internal staff network rather than the public WiFi. Raise with trust IT before pilot.
3. **Captive portal** — NHS open WiFi often requires a browser sign-in page. Tablets in kiosk mode may not handle this automatically. A dedicated ward SSID or VLAN would solve this and is the recommended approach.

---

## Outstanding Items Before Pilot

| # | Item | Owner |
|---|---|---|
| A | Electronic door integration — estates/IT feasibility assessment | Trust IT / Estates |
| B | Confirm wait time thresholds (proposed: 5 min amber, 15 min red) with ward staff | Ward sister / matron |
| C | Identify languages needed on kiosk beyond English; arrange translations | Ward / developer |
| D | Information governance review; DPIA if required | Trust IG team |
| E | Procure and install kiosk tablets at entrances | Trust / developer |
| F | Resolve ward WiFi / captive portal issue for kiosk tablets | Trust IT |
| G | Notify trust IT and IG before go-live, even for limited pilot | Project lead |

---

## Roadmap

### Phase 2 — Visitor sign-out and capacity tracking
Visitor taps "I am leaving" on kiosk. Bay count updated. Staff can manually clear a visitor from the dashboard. Real-time bay capacity enforced once sign-out is reliable.

**Known problem to solve first:** visitors who step out temporarily and forget to sign out are locked out on return. This must be addressed before sign-out can gate admission.

### Phase 3 — Approved visitor lists and electronic door release
Each patient has a list of approved visitors, built at the bedside by the patient or next of kin with nursing assistance. One next-of-kin designation per patient. Unlisted visitors held pending verification. Ward sister has override authority.

**Prerequisite:** IG and legal review. The distinction between next of kin and Lasting Power of Attorney holder must be clarified by the trust's legal team before next-of-kin is formalised as an access control role.

Electronic door release: Admit button triggers door latch directly. Requires estates and IT feasibility assessment.

### Phase 4 — Multi-ward deployment and reporting
The system is already designed to be configurable per ward. Phase 4 adds a trust-wide management view and a reporting dashboard drawing on the accumulated visit log.

---

## Background and Design Process

This system was designed through an extended requirements-gathering process with a senior critical care nurse. The design iterated through six blueprint versions, each incorporating new requirements and constraints as they emerged.

Key decisions made during design:

- **No reliance on visitor mobile phones** — the kiosk screen is the only visitor-facing output
- **No login required for the staff dashboard** — any staff member on any ward PC can act; no single point of failure
- **Bay capacity tracking deferred** — sign-out cannot be reliably enforced on distressed visitors; tracking without enforcement creates more problems than it solves
- **Approved visitor lists deferred** — real clinical value but requires governance work that should not delay the core system
- **Self-configurable by ward staff** — no IT involvement needed for day-to-day operation
- **Generic by design** — deployable on any locked ward, not specific to HDU/ITU

---

## Status

> Blueprint complete. Development not yet started.

The interactive blueprint (HTML) is included in this repository and documents the full intended system including all screens, data models, rules, and roadmap items.

---

## Licence

To be confirmed prior to any trust deployment.
