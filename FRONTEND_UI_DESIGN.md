# Frontend UI Design Specification

This document outlines the visual structure, layout, typography, and interactive components of all the primary pages within the Library Management System. The application follows a "glassmorphic" dark-mode first design approach with a premium, app-like native feel, heavily inspired by modern Apple HIG and iOS interfaces.

---

## 1. Landing Page (Public Home / Authentication)
**Path:** `/` (when unauthenticated)

### Design Elements
- **Layout:** Centered alignment. It uses a high-contrast blurred background to direct focus to the central action cards.
- **Hero Section:** Large typography displaying the branded "Gangaur Library" identity with a subtle blue to indigo gradient text effect.
- **Visitor Action:** A prominent, glowing "Browse Seats" call-to-action button for visitors to view availability without logging in.
- **Admin Authentication:**
  - Standard floating-label input for the 6-digit Admin PIN.
  - Features real-time validation and a red "wiggle" animation via Framer Motion upon an invalid login attempt.
  - Contextual Toast popups providing immediate feedback.

---

## 2. Public Browse Page (Visitor Facing)
**Path:** `/browse`

### Design Elements
- **Layout:** Read-only architectural view of the library designed to run flawlessly on mobile.
- **Seat Grid Visualization:**
  - Interactive top-down view representing desks. 
  - Vacant seats are highlighted in a bright, inviting blue, whereas occupied seats are styled in a muted gray to signify unavailability.
  - Hover / Tap micro-animations (scaling effects) when an available seat is selected.
- **Booking Flow Container:**
  - **Mobile:** A buttery-smooth `BottomSheet` slides up covering 90% of the screen.
  - **Desktop:** A side-drawer slides in gracefully from the right edge.
- **UPI Payment UI:**
  - Displayed immediately upon selecting a seat.
  - Features a highly visible, clean QR Code container (via `QRCodeCanvas`) centered contextually with a subtle colored gradient shadow.
  - Contains standard floating inputs for User's **Name**, **WhatsApp Number**, and the mandatory **Transaction/UTR ID**.

---

## 3. Floorplan / Admin Dashboard
**Path:** `/` (when authenticated)

### Design Elements
- **Layout:** Dashboard split. A sprawling 2D seat grid takes up the primary canvas. Uncluttered and distraction-free.
- **Header:** Sticky top header featuring a Global Search bar that can instantly locate members using names, phone numbers, or seat numbers.
- **Global Search:** Utilizes a backdrop blur, displaying a dropdown of matched members featuring avatar icons and current subscription statuses.
- **Seat States and Indicators:**
  - **Vacant (Blue):** Shows seat number.
  - **Active (Green):** User icon along with a badge indicating the shift (Morning, Evening, Full).
  - **Expired (Red):** Emits a soft, pulsing red border calling immediate attention to an overdue payment or expired subscription.
  - **Upcoming Expiry (Yellow):** Seats expiring within the next 3 days show a caution highlight.
- **Contextual Side Panels (`SeatDetailPanel` & `AddMemberSheet`):**
  - **Desktop:** The grid safely shrinks slightly to the left to reveal a fully featured management tray on the right side without overlapping data.
  - **Details:** Includes segmented controls for shifts and durations (1M, 3M, etc.), native date pickers, and single-click buttons for "Mark as Paid", "Renew", or "Vacate".

---

## 4. Requests Inbox
**Path:** `/requests`

### Design Elements
- **Layout:** Classic mobile-style inbox list tailored for rapid triaging.
- **Navigation Tabs:** Horizontal scrollable pills across the top (Pending, Approved, Rejected, All) mimicking high-end native iOS lists.
- **Notification Badges:** Glowing numerical indicators drawing the admin's eye to incoming, unchecked requests.
- **Request Cards:**
  - **Pending State:** Accented in blue gradients. Distinct visual typography isolates the user’s name, phone, chosen seat, and timestamp.
  - **Transaction Highlight:** The User's Transaction/UTR ID is boxed inside an emerald-green heavily bordered container to clearly distinguish the verification code from the rest of the text.
  - **Actions:** Twin buttons side-by-side. The primary "Verify & Add" button utilizes an accented gradient with a subtle drop-shadow. The secondary "Reject" button is a muted grayscale.

---

## 5. Analytics Dashboard
**Path:** `/analytics`

### Design Elements
- **Overview Cards:** A 4-column metric grid displaying Total Members, Daily Check-ins, Revenue states, and Expiring accounts.
- **Data Visualizations:**
  - **Donut Charts:** SVG-based pie charts breaking down memberships by shift (Morning vs Evening vs Full). Colors are carefully selected from a contrasting semantic palette.
  - **Sparklines:** Real-time trendlines tracking growth over specific trailing day periods using smoothed Bezier curves.
- **Detailed Insights Table:** Expandable rows showing member lifecycle data.

---

## 6. Attendance & Log System
**Path:** `/attendance`

### Design Elements
- **Interactive Roster:** A fast, sortable list showing all currently occupied seats.
- **Live Status Toggles:** Instead of simple checkboxes, it uses a premium dual-state thumb switch (Check-In / Check-Out) displaying green when in the building and grey when outside.
- **Timestamps:** Clear tracking indicating exact entry and exit times with typography prioritizing legibility.

---

### UX / UI Core Systems Deployed:
* **Tailwind CSS + Custom Variables**: `globals.css` manages strict token variables (e.g., `--bg-surface`, `--text-primary`) ensuring perfect dark/light mode parity.
* **Framer Motion**: Enables `<AnimatePresence />` to handle smooth page transitions, list reordering, and modal popping.
* **Lucide Iconography**: High-quality, consistent stroke-weight icons across all screens.
* **Floating Labels**: Minimalist form inputs that reduce clutter while retaining field context after text is entered.
* **Skeleton Loading**: Used extensively (e.g., `SeatSkeleton`) to avoid layout shift while SWR fetches data across the network.
