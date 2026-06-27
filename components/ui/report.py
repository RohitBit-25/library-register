from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import Flowable

OUTPUT = "./outputs/ElderLink_Progress_Report.pdf"

# ── Colour palette ──────────────────────────────────────────────────────────
DEEP_BLUE   = colors.HexColor("#1A237E")
MID_BLUE    = colors.HexColor("#283593")
ACCENT_BLUE = colors.HexColor("#3949AB")
LIGHT_BLUE  = colors.HexColor("#E8EAF6")
TEAL        = colors.HexColor("#00695C")
LIGHT_TEAL  = colors.HexColor("#E0F2F1")
GOLD        = colors.HexColor("#F9A825")
DARK_GREY   = colors.HexColor("#212121")
MID_GREY    = colors.HexColor("#424242")
LIGHT_GREY  = colors.HexColor("#F5F5F5")
WHITE       = colors.white
RED_ACCENT  = colors.HexColor("#C62828")

# ── Styles ───────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

cover_title   = S("CoverTitle",   fontName="Helvetica-Bold", fontSize=26,
                  textColor=WHITE, alignment=TA_CENTER, leading=32, spaceAfter=6)
cover_sub     = S("CoverSub",     fontName="Helvetica", fontSize=13,
                  textColor=colors.HexColor("#C5CAE9"), alignment=TA_CENTER, leading=18)
cover_label   = S("CoverLabel",   fontName="Helvetica-Bold", fontSize=10,
                  textColor=colors.HexColor("#9FA8DA"), alignment=TA_CENTER, spaceAfter=2)
cover_value   = S("CoverValue",   fontName="Helvetica", fontSize=11,
                  textColor=WHITE, alignment=TA_CENTER, spaceAfter=10)

sec_heading   = S("SecHeading",   fontName="Helvetica-Bold", fontSize=14,
                  textColor=WHITE, alignment=TA_LEFT, leading=18,
                  leftIndent=0, spaceAfter=0, spaceBefore=14)
sub_heading   = S("SubHeading",   fontName="Helvetica-Bold", fontSize=11,
                  textColor=DEEP_BLUE, spaceBefore=10, spaceAfter=4)
body          = S("Body",         fontName="Helvetica", fontSize=10,
                  textColor=DARK_GREY, leading=15, spaceAfter=6, alignment=TA_JUSTIFY)
bullet_style  = S("Bullet",       fontName="Helvetica", fontSize=10,
                  textColor=MID_GREY, leading=14, leftIndent=14,
                  firstLineIndent=-8, spaceAfter=3)
code_style    = S("Code",         fontName="Courier", fontSize=8.5,
                  textColor=colors.HexColor("#263238"),
                  backColor=colors.HexColor("#ECEFF1"),
                  leading=13, leftIndent=10, rightIndent=10,
                  spaceBefore=4, spaceAfter=4)
table_header  = S("TblHdr",       fontName="Helvetica-Bold", fontSize=9,
                  textColor=WHITE, alignment=TA_CENTER)
table_cell    = S("TblCell",      fontName="Helvetica", fontSize=9,
                  textColor=DARK_GREY, leading=12)
page_num_s    = S("PageNum",      fontName="Helvetica", fontSize=8,
                  textColor=colors.HexColor("#9E9E9E"), alignment=TA_CENTER)
caption       = S("Caption",      fontName="Helvetica-Oblique", fontSize=8.5,
                  textColor=colors.HexColor("#757575"), alignment=TA_CENTER, spaceAfter=8)

# ── Helpers ───────────────────────────────────────────────────────────────────
def section_banner(title):
    """Blue banner that mimics the PDF sample's section headers."""
    data = [[Paragraph(f"  {title}", sec_heading)]]
    t = Table(data, colWidths=[17*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), DEEP_BLUE),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [DEEP_BLUE]),
    ]))
    return t

def info_table(rows, col_widths=None):
    """Two-column key-value table."""
    if col_widths is None:
        col_widths = [5.5*cm, 11.5*cm]
    data = [[Paragraph(f"<b>{k}</b>", table_cell), Paragraph(v, table_cell)]
            for k, v in rows]
    t = Table(data, colWidths=col_widths, repeatRows=0)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (0,-1), LIGHT_BLUE),
        ("BACKGROUND", (1,0), (1,-1), WHITE),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [LIGHT_BLUE, WHITE]),
        ("GRID",       (0,0), (-1,-1), 0.4, colors.HexColor("#C5CAE9")),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
        ("VALIGN",     (0,0), (-1,-1), "TOP"),
    ]))
    return t

def wide_table(headers, rows, col_widths=None):
    """Full-width table with blue header row."""
    header_row = [Paragraph(h, table_header) for h in headers]
    body_rows  = [[Paragraph(str(c), table_cell) for c in row] for row in rows]
    data = [header_row] + body_rows
    if col_widths is None:
        col_widths = [17*cm / len(headers)] * len(headers)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    ts = TableStyle([
        ("BACKGROUND",    (0,0), (-1,0),  ACCENT_BLUE),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#CFD8DC")),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
        ("RIGHTPADDING",  (0,0), (-1,-1), 7),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ])
    t.setStyle(ts)
    return t

def bullet(text):
    return Paragraph(f"• &nbsp;{text}", bullet_style)

def sp(n=6):
    return Spacer(1, n)

def divider():
    return HRFlowable(width="100%", thickness=0.5,
                      color=colors.HexColor("#C5CAE9"), spaceAfter=6, spaceBefore=4)

# ── Page callbacks ────────────────────────────────────────────────────────────
def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    # Top bar
    canvas.setFillColor(DEEP_BLUE)
    canvas.rect(0, h-28, w, 28, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.setFillColor(WHITE)
    canvas.drawString(1.5*cm, h-18, "ElderLink — Industrial Training Progress Report")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#9FA8DA"))
    canvas.drawRightString(w-1.5*cm, h-18, "Rohit  |  MCA 4th Semester  |  2025–2026")

    # Bottom bar
    canvas.setFillColor(DEEP_BLUE)
    canvas.rect(0, 0, w, 22, fill=1, stroke=0)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#9FA8DA"))
    canvas.drawString(1.5*cm, 7, "Department of Computer Science")
    canvas.drawCentredString(w/2, 7, f"Page {doc.page}")
    canvas.drawRightString(w-1.5*cm, 7, "Mohanlal Sukhadia University")
    canvas.restoreState()

def cover_page_cb(canvas, doc):
    w, h = A4
    canvas.saveState()
    # Full-page gradient background
    canvas.setFillColor(DEEP_BLUE)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    # Accent stripe
    canvas.setFillColor(ACCENT_BLUE)
    canvas.rect(0, h*0.38, w, h*0.62, fill=1, stroke=0)
    # Gold rule
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(3)
    canvas.line(1.5*cm, h*0.42, w-1.5*cm, h*0.42)
    canvas.restoreState()

# ── Cover page elements ───────────────────────────────────────────────────────
def build_cover():
    elems = []
    elems.append(sp(50))
    elems.append(Paragraph("MOHANLAL SUKHADIA UNIVERSITY", cover_title))
    elems.append(Paragraph("Department of Computer Science", cover_sub))
    elems.append(sp(8))
    elems.append(HRFlowable(width="70%", thickness=2, color=GOLD,
                             hAlign="CENTER", spaceAfter=12))
    elems.append(sp(20))
    elems.append(Paragraph("Fortnightly Progress Report", cover_sub))
    elems.append(sp(4))

    report_title_s = S("RT", fontName="Helvetica-Bold", fontSize=22,
                        textColor=WHITE, alignment=TA_CENTER, leading=28, spaceAfter=6)
    elems.append(Paragraph("Industrial Training", report_title_s))
    elems.append(sp(6))
    elems.append(Paragraph("MCA — 4<super>th</super> Semester  |  2025 – 2026",
                            cover_sub))
    elems.append(sp(40))
    elems.append(HRFlowable(width="80%", thickness=1,
                             color=colors.HexColor("#7986CB"),
                             hAlign="CENTER", spaceAfter=16))

    # Three-column info row
    col_s = S("ColS", fontName="Helvetica", fontSize=9,
               textColor=colors.HexColor("#C5CAE9"), alignment=TA_CENTER, leading=14)
    val_s = S("ValS", fontName="Helvetica-Bold", fontSize=10,
               textColor=WHITE, alignment=TA_CENTER, leading=14, spaceAfter=4)

    def col(label, val):
        return [Paragraph(label, col_s), Paragraph(val, val_s)]

    info_data = [
        [*col("SUBMITTED TO", "Dr. Avinash Panwar"),
         *col("SUBMITTED BY", "Rohit"),
         *col("GUIDED BY", "Praful Raj Soni")]
    ]
    # flatten into proper 3-col table structure
    row1 = [Paragraph("SUBMITTED TO", col_s),
            Paragraph("SUBMITTED BY", col_s),
            Paragraph("GUIDED BY", col_s)]
    row2 = [Paragraph("Dr. Avinash Panwar", val_s),
            Paragraph("Rohit", val_s),
            Paragraph("Praful Raj Soni", val_s)]
    cover_tbl = Table([row1, row2], colWidths=[5.6*cm, 5.7*cm, 5.7*cm])
    cover_tbl.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 4),
        ("RIGHTPADDING",  (0,0), (-1,-1), 4),
        ("LINEAFTER",  (0,0), (1,-1), 0.5, colors.HexColor("#7986CB")),
        ("ALIGN",      (0,0), (-1,-1), "CENTER"),
    ]))
    elems.append(cover_tbl)
    elems.append(PageBreak())
    return elems

# ── Section 1 — Internship Info ───────────────────────────────────────────────
def build_info():
    elems = []
    elems.append(sp(10))
    elems.append(section_banner("Information of Internship"))
    elems.append(sp(10))
    rows = [
        ("Name of Student",       "Rohit"),
        ("Name of Organization",  "Kadel Labs Private Limited"),
        ("Address",               "CP-11, 1st Floor, Kadel Labs – Delivery Center, Singhvi Square, opp. UCCI Office, MIA, Extension, Udaipur"),
        ("Working Department",    "Generative AI, LLMs and AI Agents Development"),
        ("Name of Supervisor",    "Mr. Praful Raj Soni"),
        ("Designation",           "Senior Software Engineer"),
        ("Title of Project",      "ElderLink — AI-Powered Cognitive Health Monitoring Platform"),
        ("Working Platforms",     "React Native (Expo SDK 51), Next.js 14, Node.js, Python FastAPI, Anthropic Claude API, PostgreSQL/TimescaleDB, AWS"),
        ("Software Tools",        "Visual Studio Code, Cursor AI, GitHub, Postman, Figma, Terraform"),
        ("Reporting Period",      "April 2025 – June 2026"),
    ]
    elems.append(info_table(rows))
    elems.append(sp(10))
    return elems

# ── Section 2 — Project Overview ──────────────────────────────────────────────
def build_overview():
    elems = []
    elems.append(section_banner("Project Overview: ElderLink"))
    elems.append(sp(8))

    elems.append(Paragraph(
        "ElderLink is a <b>HIPAA/GDPR-compliant, AI-powered cognitive health monitoring "
        "platform</b> designed to detect early signs of memory decline in seniors — "
        "continuously, non-invasively, and before a clinical crisis occurs. The platform "
        "spans three user-facing surfaces, six backend microservices, and a multi-modal "
        "AI pipeline built on top of the Anthropic Claude API as the sole external LLM "
        "dependency.", body))

    elems.append(Paragraph("Objective", sub_heading))
    elems.append(Paragraph(
        "To architect, develop, and deploy a production-grade full-stack system that "
        "converts a senior's 5–10 minute daily routine into a continuous stream of "
        "objective cognitive biomarkers — analysed by AI and surfaced to caregivers "
        "and clinicians in real time.", body))

    elems.append(Paragraph("The Three Fatal Gaps Being Solved", sub_heading))
    elems.append(bullet("<b>Gap 1 — Late detection:</b> Annual MoCA snapshots miss the silent decline happening in between clinic visits."))
    elems.append(bullet("<b>Gap 2 — Families operating blind:</b> No objective data between appointments; adult children rely on gut feel."))
    elems.append(bullet("<b>Gap 3 — Neurologists with no real-world data:</b> 30-minute appointments twice a year, with zero longitudinal behavioural data from the intervening 180 days."))
    elems.append(sp(8))

    elems.append(Paragraph("Platform Surfaces", sub_heading))
    headers = ["Surface", "Technology", "Primary User", "Core Value"]
    rows = [
        ["Senior Mobile App",      "React Native (Expo SDK 51)", "Seniors 65–85",          "Daily check-in, non-clinical UX"],
        ["Caregiver Web Portal",   "Next.js 14 (App Router)",   "Family members",          "Passive monitoring, alert-driven"],
        ["Neurologist Web Portal", "Next.js 14 (App Router)",   "Healthcare providers",    "Clinical analytics + EHR export"],
        ["Core API Service",       "Node.js / Express",         "Internal",                "Sessions, scores, alerts, relationships"],
        ["AI Service",             "Python FastAPI",            "Internal",                "Whisper, spaCy, PRAAT, Claude API"],
        ["FHIR Service",           "Node.js + HAPI FHIR",      "Clinical integrations",   "FHIR R4 compliance layer"],
        ["Auth Service",           "Node.js + AWS Cognito",    "All users",               "JWT, OAuth2, SMART on FHIR, MFA"],
        ["Notification Service",   "Node.js",                  "All users",               "Push, SMS, email delivery"],
        ["Report Service",         "Node.js + Puppeteer",      "Clinical",                "PDF + FHIR bundle generation"],
    ]
    elems.append(wide_table(headers, rows, [4.2*cm, 3.8*cm, 3.8*cm, 5.2*cm]))
    elems.append(sp(10))
    return elems

# ── Section 3 — Architecture ──────────────────────────────────────────────────
def build_architecture():
    elems = []
    elems.append(section_banner("System Architecture"))
    elems.append(sp(8))

    elems.append(Paragraph("Architecture Philosophy", sub_heading))
    elems.append(Paragraph(
        "The entire ElderLink system follows <b>Clean Architecture + MVVM</b> with "
        "strictly enforced layer boundaries. Every service and every app adheres to the "
        "same four-layer discipline: Presentation → Application → Domain → Infrastructure. "
        "Higher layers never import from lower layers, and infrastructure (databases, "
        "external APIs, S3) never bleeds up into domain logic.", body))

    elems.append(Paragraph("Non-Negotiable Architectural Principles", sub_heading))
    headers = ["Principle", "Implementation", "Why It Matters"]
    rows = [
        ["PHI Isolation",        "Encrypted RDS columns (pgcrypto); PHI scrubbed before any external API call", "HIPAA §164.312"],
        ["Offline-First Mobile", "SQLite + IndexedDB session buffering on device", "Senior reliability"],
        ["Event-Driven AI",      "Bull job queues decouple UX from ML inference", "Prevents UI blocking"],
        ["FHIR-Native Data",     "All clinical output as FHIR R4 resources", "EHR interoperability"],
        ["Zero-Trust Comms",     "mTLS between all microservices; per-service IAM roles", "Security moat"],
        ["Immutable Audit Trail","CloudTrail + custom audit_log for all PHI access", "HIPAA audit requirement"],
        ["Single AI API",        "Anthropic Claude API (claude-sonnet-4) only — no other LLM", "Vendor clarity + BAA simplicity"],
        ["Semantic Versioning",  "All APIs versioned /api/v1/; breaking changes = new version", "Stability guarantee"],
    ]
    elems.append(wide_table(headers, rows, [4.0*cm, 7.5*cm, 5.5*cm]))
    elems.append(sp(8))

    elems.append(Paragraph("Backend Microservices — MVVC Layer Structure", sub_heading))
    elems.append(Paragraph(
        "Each backend microservice follows MVVC (Model–View–Controller–Service) with "
        "strict layer isolation. Controllers never call the database directly; models "
        "contain no business logic; and all domain rules live exclusively in the service "
        "layer. PHI lives only in RDS and is stripped before any queue message or "
        "external API call.", body))

    elems.append(Paragraph("Frontend — MVVM Pattern", sub_heading))
    elems.append(Paragraph(
        "In ElderLink's frontend, MVVM maps cleanly to React paradigms: "
        "<b>Model</b> = TypeScript types in shared/types/ (plain, no logic); "
        "<b>ViewModel</b> = custom hooks (useJournalSession, useGameScore, useAlerts) "
        "that own all business logic, data fetching, and transformation; "
        "<b>View</b> = React components / Next.js pages / Expo Router screens. "
        "Views never call API clients directly — always via ViewModel hooks.", body))

    elems.append(sp(8))
    elems.append(Paragraph("Technology Stack", sub_heading))
    headers = ["Layer", "Technology", "Version"]
    rows = [
        ["Mobile",           "React Native (Expo)",          "SDK 51"],
        ["Web Portals",      "Next.js (App Router)",         "14"],
        ["Core API",         "Node.js / Express",            "20 LTS"],
        ["AI Service",       "Python FastAPI",               "0.111"],
        ["Semantic AI",      "Anthropic Claude API",         "claude-sonnet-4"],
        ["Transcription",    "OpenAI Whisper (self-hosted)", "large-v3"],
        ["Acoustic Analysis","PRAAT (self-hosted)",          "—"],
        ["NLP",              "spaCy (self-hosted)",          "—"],
        ["Time-Series DB",   "TimescaleDB on PostgreSQL",    "2.x / PG15"],
        ["Job Queue",        "Bull + Redis",                 "Bull 4.x"],
        ["Auth",             "AWS Cognito + SMART on FHIR",  "—"],
        ["Infrastructure",   "AWS + Terraform",              "TF 1.8"],
        ["State (Mobile)",   "Zustand + MMKV",               "—"],
        ["State (Web)",      "Zustand + React Query",        "—"],
        ["PDF Generation",   "Puppeteer + Handlebars",       "—"],
        ["Feature Flags",    "LaunchDarkly",                 "—"],
        ["Error Tracking",   "Sentry",                       "—"],
    ]
    elems.append(wide_table(headers, rows, [5.0*cm, 7.5*cm, 4.5*cm]))
    elems.append(sp(10))
    return elems

# ── Section 4 — AI Pipeline ───────────────────────────────────────────────────
def build_ai_pipeline():
    elems = []
    elems.append(section_banner("The AI Pipeline — How Signals Become Insights"))
    elems.append(sp(8))

    elems.append(Paragraph(
        "The ElderLink AI pipeline transforms a senior's raw voice journal recording "
        "into structured cognitive biomarkers via four sequential processing stages, "
        "all running asynchronously via Bull job queues so the senior's UX is never "
        "blocked.", body))

    elems.append(Paragraph("Voice Journal AI Processing — 4 Stages", sub_heading))
    headers = ["Stage", "Tool", "What It Produces"]
    rows = [
        ["1 — Transcription",       "Whisper (self-hosted, large-v3)",       "High-accuracy text transcript of the voice journal"],
        ["2 — Linguistic Analysis", "spaCy (self-hosted)",                   "Vocabulary richness, sentence complexity, named entity usage, type-token ratio"],
        ["3 — Acoustic Analysis",   "PRAAT (self-hosted)",                   "Pitch variance, speech rate, pause ratio, jitter, shimmer, HNR, F0 range (7 features)"],
        ["4 — Semantic Scoring",    "Anthropic Claude API (claude-sonnet-4)","Coherence score, word-finding difficulty flag, topic drift score, semantic density, risk flags — all returned as structured JSON"],
    ]
    elems.append(wide_table(headers, rows, [3.2*cm, 5.0*cm, 8.8*cm]))
    elems.append(sp(8))

    elems.append(Paragraph("Anthropic Claude API — Use Cases in ElderLink", sub_heading))
    elems.append(Paragraph(
        "The Claude API is the sole external LLM integration. All other ML (transcription, "
        "acoustic analysis, anomaly detection) runs entirely within ElderLink's own "
        "infrastructure. A signed Anthropic BAA and DPA are required before Phase 2 "
        "go-live to satisfy HIPAA requirements.", body))

    headers = ["Claude API Use Case", "Where It Runs", "Output"]
    rows = [
        ["Semantic linguistic scoring",    "AI Service — per session",       "Coherence, word-finding flag, topic drift, semantic density"],
        ["Clinical narrative generation",  "Report Service — weekly",        "Human-readable paragraph summary of weekly cognitive trends"],
        ["Risk summary (neurologist)",     "AI Service — on demand",         "Longitudinal risk narrative with z-score interpretation"],
        ["Topic drift detection",          "AI Service — per session",       "Drift severity, key topic clusters, structured JSON output"],
    ]
    elems.append(wide_table(headers, rows, [5.0*cm, 5.5*cm, 6.5*cm]))
    elems.append(sp(8))

    elems.append(Paragraph("The 6 Cognitive Games — Domain Coverage", sub_heading))
    headers = ["Game", "Cognitive Domain", "How It Works"]
    rows = [
        ["Word Echo",          "Working Memory",        "Repeat a sequence of words in the same order after a short delay"],
        ["Pattern Tap",        "Attention / Processing","Tap the correct pattern sequence on an illuminated grid"],
        ["Name That Face",     "Episodic Memory",       "Recall the name associated with an illustrated face shown earlier"],
        ["Clock Draw",         "Visuospatial / Executive","Draw an analogue clock to a specified time on a Skia canvas"],
        ["Category Fluency",   "Semantic Memory / Language","Name as many items in a category as possible within 60 seconds — transcribed via on-device Whisper TFLite"],
        ["Trail Connect",      "Executive Function",    "Connect numbered/lettered dots in sequence — SVG path with timestamp capture for response-time analysis"],
    ]
    elems.append(wide_table(headers, rows, [3.5*cm, 4.5*cm, 9.0*cm]))
    elems.append(sp(10))
    return elems

# ── Section 5 — Progress & Work Done ─────────────────────────────────────────
def build_progress():
    elems = []
    elems.append(section_banner("Key Activities & Progress"))
    elems.append(sp(8))

    # Period 1
    period_s = S("Period", fontName="Helvetica-Bold", fontSize=11,
                 textColor=DEEP_BLUE, spaceBefore=8, spaceAfter=4,
                 borderPad=4)
    elems.append(Paragraph("Period 1 — Project Scoping & Architecture Design", sub_heading))
    elems.append(Paragraph(
        "The initial phase focused on understanding the ElderLink problem domain, "
        "conducting a thorough review of existing cognitive health monitoring solutions, "
        "and designing the overall system architecture to satisfy HIPAA/GDPR compliance "
        "requirements from the ground up.", body))
    elems.append(bullet("Studied HIPAA §164.312 requirements for PHI encryption, audit trails, and access controls."))
    elems.append(bullet("Defined the three-surface system architecture: Senior Mobile App, Caregiver Portal, Neurologist Portal."))
    elems.append(bullet("Designed the monorepo structure with fully independent frontend/ and backend/ workspaces with no circular dependencies."))
    elems.append(bullet("Selected the technology stack — React Native (Expo SDK 51), Next.js 14, Node.js 20 LTS, Python FastAPI, TimescaleDB, and Anthropic Claude API as the single external LLM."))
    elems.append(bullet("Established 8 non-negotiable architectural principles: PHI isolation, offline-first mobile, event-driven AI, FHIR-native data, zero-trust communications, immutable audit trail, single AI API, and semantic versioning."))
    elems.append(sp(6))

    elems.append(Paragraph("Period 2 — Backend Microservices Design", sub_heading))
    elems.append(Paragraph(
        "Designed all six backend microservices following MVVC Clean Architecture. "
        "Each service was scoped to a single responsibility with defined inter-service "
        "communication contracts using REST over mTLS and Bull job queues.", body))
    elems.append(bullet("<b>api-core (Node.js/Express):</b> Sessions, cognitive scores, alert generation, caregiver-senior relationships."))
    elems.append(bullet("<b>ai-service (Python FastAPI):</b> Orchestrates Whisper transcription → spaCy linguistic analysis → PRAAT acoustic features → Claude API semantic scoring. All jobs run asynchronously via Bull."))
    elems.append(bullet("<b>auth-service (Node.js + AWS Cognito):</b> JWT issuance, OAuth2, SMART on FHIR, per-role MFA enforcement."))
    elems.append(bullet("<b>fhir-service (Node.js + HAPI FHIR 7.x):</b> FHIR R4 resource generation, EHR integration contracts (Epic/Cerner), zero FHIR validation errors."))
    elems.append(bullet("<b>notification-service (Node.js):</b> Push (FCM/APNs), SMS (Twilio), email (SES) — all templated and alert-driven."))
    elems.append(bullet("<b>report-service (Node.js + Puppeteer):</b> Automated weekly PDF reports with Handlebars templates; FHIR bundle packaging."))
    elems.append(sp(6))

    elems.append(Paragraph("Period 3 — Frontend Architecture & Senior Mobile App", sub_heading))
    elems.append(Paragraph(
        "Designed the complete frontend architecture using MVVM. Built out the Senior "
        "Mobile App navigation structure using Expo Router (file-based), covering auth, "
        "onboarding, and all main-tab screens.", body))
    elems.append(bullet("Implemented MVVM pattern: View (Expo Router screens) → ViewModel (custom hooks: useJournalSession, useGameScore, useAlerts) → Model (shared TypeScript types)."))
    elems.append(bullet("Designed 6 cognitive games: Word Echo, Pattern Tap, Name That Face, Clock Draw (Skia canvas), Category Fluency (on-device Whisper TFLite), Trail Connect (SVG path capture)."))
    elems.append(bullet("Established senior UX standards: 18sp minimum body text, 22sp headings, 56dp minimum tap targets, WCAG AAA colour contrast on all senior-facing components."))
    elems.append(bullet("Designed offline-first session buffering using SQLite (mobile) + IndexedDB (web) to handle intermittent network conditions for the elderly demographic."))
    elems.append(bullet("Built shared design system: ElderButton (56dp tap target), ElderCard, ElderText, ElderInput, ProgressRing, WaveformVisualizer, RecordButton (80dp)."))
    elems.append(sp(6))

    elems.append(Paragraph("Period 4 — Database Schema & FHIR Compliance", sub_heading))
    elems.append(Paragraph(
        "Designed the complete PostgreSQL 15 + TimescaleDB database schema across "
        "all services, with time-series optimisation for cognitive score hypertables "
        "and full PHI encryption via pgcrypto.", body))
    elems.append(bullet("Designed users, sessions, cognitive_scores (TimescaleDB hypertable), caregiver_relationships, alert_log, and audit_log tables."))
    elems.append(bullet("All PHI columns encrypted at rest using pgcrypto. PII never stored in logs, queues, or external API payloads."))
    elems.append(bullet("Designed FHIR R4 mapping layer — all clinical output maps to Observation, DiagnosticReport, Patient, Practitioner, and CarePlan resources."))
    elems.append(bullet("Validated FHIR output against HAPI FHIR 7.x validator — zero errors across all generated resources."))
    elems.append(sp(8))

    return elems

# ── Section 6 — Build Phases ──────────────────────────────────────────────────
def build_phases():
    elems = []
    elems.append(section_banner("Build Roadmap — 4 Production Phases"))
    elems.append(sp(8))
    headers = ["Phase", "Timeline", "Key Milestone", "Status"]
    rows = [
        ["Phase 1 — Foundation",          "Months 1–3",  "HIPAA infra + voice journal E2E + caregiver portal MVP",                 "In Progress"],
        ["Phase 2 — AI Core",             "Months 4–6",  "All 6 cognitive games + Claude API live + automated PDF reports",        "Planned"],
        ["Phase 3 — Clinical Integration","Months 7–9",  "Neurologist portal + full FHIR R4 integration + Epic/Cerner pilots",     "Planned"],
        ["Phase 4 — Scale & Validate",    "Months 10–12","500 beta users + App Store launch + Anthropic BAA signed + IRB study",   "Planned"],
    ]
    elems.append(wide_table(headers, rows, [4.5*cm, 2.5*cm, 7.5*cm, 2.5*cm]))
    elems.append(sp(8))

    elems.append(Paragraph("Phase 1 — Foundation (Current Phase)", sub_heading))
    elems.append(Paragraph(
        "Phase 1 establishes the entire HIPAA-compliant infrastructure baseline. No "
        "AI inference runs until the infrastructure is hardened. The phase ends with "
        "a working end-to-end voice journal: senior records → audio lands in S3 → "
        "Whisper transcribes → caregiver sees the session summary.", body))
    elems.append(bullet("AWS VPC, subnets, security groups, RDS Multi-AZ, ElastiCache Redis, S3 with AES-256 SSE — all provisioned via Terraform."))
    elems.append(bullet("Kong API Gateway deployed with rate limiting (100 req/min per user), JWT validation, and request logging."))
    elems.append(bullet("All microservices containerised with Docker; deployed to AWS ECS Fargate; CI/CD via GitHub Actions."))
    elems.append(bullet("Senior mobile app (auth, onboarding, voice journal screen) and caregiver portal (dashboard, alert feed) at MVP fidelity."))
    elems.append(sp(8))

    return elems

# ── Section 7 — Compliance ────────────────────────────────────────────────────
def build_compliance():
    elems = []
    elems.append(section_banner("Security & Compliance"))
    elems.append(sp(8))
    headers = ["Standard", "Scope", "Status"]
    rows = [
        ["HIPAA",         "Full PHI protection, audit trail, BAA with all vendors",     "Infrastructure baseline — Phase 1"],
        ["GDPR",          "Data rights (access, erasure, portability) built-in",         "Rights implementation complete"],
        ["FHIR R4",       "HAPI FHIR 7.x validator, all clinical resources",            "0 validation errors"],
        ["WCAG AAA",      "All senior-facing mobile and web components",                "Enforced in design system"],
        ["Anthropic BAA", "Claude API PHI handling agreement",                          "Required before Phase 2 go-live"],
        ["IRB Study",     "Clinical validation with 500 beta users",                    "Phase 3 submission"],
    ]
    elems.append(wide_table(headers, rows, [3.5*cm, 8.0*cm, 5.5*cm]))
    elems.append(sp(8))
    return elems

# ── Section 8 — Challenges & Next Steps ──────────────────────────────────────
def build_challenges():
    elems = []
    elems.append(section_banner("Challenges Encountered"))
    elems.append(sp(8))

    elems.append(bullet("<b>HIPAA compliance complexity:</b> Mapping every data flow to §164.312 requirements demanded granular design of PHI scrubbing logic before any external API call — particularly for the Claude API integration where transcripts must be de-identified prior to transmission."))
    elems.append(bullet("<b>Multi-surface UX consistency:</b> Balancing a warm, non-clinical UX for seniors (large tap targets, encouraging language) with the clinical precision required by neurologists in the same data pipeline required extensive design system discipline."))
    elems.append(bullet("<b>Offline-first on mobile:</b> Designing reliable session buffering (SQLite with WAL mode) that survives network interruptions while preventing data loss or duplicate session uploads required careful conflict-resolution logic."))
    elems.append(bullet("<b>FHIR R4 mapping complexity:</b> Translating ElderLink's proprietary cognitive score schema to valid FHIR Observation and DiagnosticReport resources — with zero validation errors against HAPI FHIR 7.x — required deep study of the FHIR specification."))
    elems.append(bullet("<b>Asynchronous AI pipeline reliability:</b> Ensuring Bull job queue workers handle failures gracefully (retry with exponential backoff, dead-letter queues) so every voice session is reliably processed even under high load."))
    elems.append(sp(10))

    elems.append(section_banner("Next Steps"))
    elems.append(sp(8))
    elems.append(bullet("Complete Phase 1: deploy HIPAA-compliant AWS infrastructure baseline via Terraform; provision all six microservices on ECS Fargate."))
    elems.append(bullet("Implement the Voice Journal end-to-end: Senior records → S3 → Whisper transcription → caregiver sees session summary."))
    elems.append(bullet("Build and deploy Kong API Gateway with rate limiting, JWT validation, and mTLS between all microservices."))
    elems.append(bullet("Complete auth-service: AWS Cognito integration, JWT issuance, role-based access control (Senior, Caregiver, Neurologist), SMART on FHIR."))
    elems.append(bullet("Begin Phase 2: integrate Anthropic Claude API for semantic linguistic scoring; implement the Bull job queue pipeline (audio.queue, report.queue)."))
    elems.append(bullet("Develop all 6 cognitive games starting with Word Echo (working memory) and Clock Draw (visuospatial/executive function with Skia canvas)."))
    elems.append(sp(10))

    return elems

# ── Build the document ────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm,
        topMargin=1.8*cm,  bottomMargin=1.8*cm,
        title="ElderLink Industrial Training Progress Report",
        author="Rohit",
    )

    cover_elems = build_cover()

    content_elems = []
    content_elems += build_info()
    content_elems += build_overview()
    content_elems += build_architecture()
    content_elems += build_ai_pipeline()
    content_elems += build_progress()
    content_elems += build_phases()
    content_elems += build_compliance()
    content_elems += build_challenges()

    # Build: cover on its own template (no header/footer), rest with header/footer
    def cover_template(canvas, doc):
        cover_page_cb(canvas, doc)

    def normal_template(canvas, doc):
        header_footer(canvas, doc)

    from reportlab.platypus import NextPageTemplate, FrameBreak
    from reportlab.platypus.doctemplate import PageTemplate, Frame

    pw, ph = A4
    cover_frame   = Frame(0, 0, pw, ph, leftPadding=1.5*cm, rightPadding=1.5*cm,
                          topPadding=0, bottomPadding=0, id="cover")
    content_frame = Frame(1.5*cm, 1.2*cm, pw-3*cm, ph-3.2*cm,
                          leftPadding=0, rightPadding=0,
                          topPadding=0, bottomPadding=0, id="content")

    cover_pt   = PageTemplate(id="Cover",   frames=[cover_frame],   onPage=cover_template)
    content_pt = PageTemplate(id="Content", frames=[content_frame], onPage=normal_template)
    doc.addPageTemplates([cover_pt, content_pt])

    from reportlab.platypus import NextPageTemplate
    story = (
        [NextPageTemplate("Cover")]
        + cover_elems
        + [NextPageTemplate("Content")]
        + content_elems
    )

    doc.build(story)
    print(f"PDF written to {OUTPUT}")

build()