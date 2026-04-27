# Product Requirements Document (PRD): Me&Me Homepage and CMS

## 1. Overview
Me&Me is a women's fashion boutique from Germany with two locations: Potsdam-Babelsberg and Berlin-Charlottenburg. The goal of this project is to build a responsive, bilingual (German and English) homepage and an integrated Content Management System (CMS) to manage its content.

## 2. Technical Stack
- **Frontend Framework**: Vue.js v3.5.33
- **Styling**: Vanilla CSS with modern, clean, and aesthetic design (Rich Aesthetics).
- **Backend/Database**: Supabase (PostgreSQL).
- **Authentication**: Supabase Auth (for CMS access).
- **Storage**: Supabase Storage for managing image uploads.
- **Typography**: Local Google Fonts (Playfair-Display for titles, Raleway-Regular for body).
- **Colors**: Background `#deefef`, Typography/Icons `#575756`.

## 3. Homepage Structure & Features
The homepage must be responsive and accessible, consisting of the following sections in order:
1. **Header**: Fixed header with logo (left), centered navigation links for sections, and language toggle & social icons (right).
2. **Collection Section**: Full-screen image carousel showing 2 images at a time, auto-sliding.
3. **Brands Section**: Displays all available brands with their logos and names.
4. **Stores Section**: Side-by-side display of both stores. Includes image carousel, store name, address, zip code, city, phone number, and business hours.
5. **Contact Section**: Displays full business name and contact email without a section title.
6. **Inspiration Section**: Displays the latest 9 posts (first image only) from their Instagram account (`@meandme_official`) in a 3x3 grid.
7. **About Us Section**: Centered text with a group image of the boutique owners.
8. **Footer**: Navigation links to Imprint and Data Privacy pages (left) and the full business name (right).

**Subpages**:
- `[domain]/imprint`: Imprint page.
- `[domain]/dataprivacy`: Data Privacy page.

## 4. Content Management System (CMS)
Accessible via `[domain]/management` and protected by username/password login.
Features:
- **Authentication**: Login, logout, and return to homepage capabilities.
- **Global Settings**: Update social media URLs, business name, contact email, and target Instagram account for the inspiration section.
- **Localization**: Update section titles in both English and German.
- **Collection Management**: Add/remove collection images (must auto-transform/validate to 3:4 aspect ratio). Minimum 1 image required.
- **Brand Management**: Add, update, and remove brands (logo upload, name, homepage URL). Minimum 1 brand required.
- **Store Management**: Add, update, and remove stores (images, name, address, zip, city, phone, business hours). All attributes required. Minimum 1 store required.
- **About Us Management**: Update the text and image for the "About Us" section.
- **Legal Pages**: Rich text editor for updating Imprint and Data Privacy text.
