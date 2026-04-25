

## Plan: Add Toptal Logo to Login Page and Page Headers

### Overview
Copy the uploaded Toptal SVG logo into the project, then add it to:
1. The login/password page (centered above the lock icon or title)
2. The blue header area (top-left) on all pages that have one: LandingPage, ResultsPage, AdminReportPage

Pages without a blue header (SurveyPage, UserInfoPage, ThankYouPage) will not get the logo since they lack that header pattern.

### Changes

**1. Copy logo asset**
- Copy `user-uploads://Toptal_Logo_White_RGB.svg` → `src/assets/toptal-logo-white.svg`

**2. `src/pages/LoginPage.tsx`**
- Import the logo
- Add the logo image above the lock icon in the card, sized appropriately (e.g., `h-8` auto width, centered)

**3. `src/pages/LandingPage.tsx`**
- Import the logo
- Add `<img>` at the top of the `bg-primary` hero div, left-aligned, before the existing text content (e.g., `h-7 mb-6`)

**4. `src/pages/ResultsPage.tsx`**
- Same pattern: add logo top-left inside the blue header div

**5. `src/pages/AdminReportPage.tsx`**
- Add logo top-left inside the existing blue header div (before the title row or as part of the flex layout)

**6. `src/pages/ThankYouPage.tsx`**
- No blue header exists, but we can add a small top bar or place the logo at the top of the card. Will add a subtle blue top strip with the logo for consistency.

### Technical Notes
- The SVG has white fill (`#FFFFFF`), which works perfectly on the blue (`bg-primary`) backgrounds.
- On the login page (white/card background), the logo will need to be displayed differently — could use a version with color, or wrap in a blue container. Since only the white version is provided, will place it inside a small blue accent strip or the existing blue circle area.
- Import via ES module: `import toptalLogo from "@/assets/toptal-logo-white.svg"`

