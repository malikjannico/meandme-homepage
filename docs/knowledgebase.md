# Technical Knowledgebase: Me&Me

## 1. Architecture Overview
The application follows a Jamstack architecture using Vue.js for the frontend and Supabase as a Backend-as-a-Service (BaaS). The Vue app handles routing, state, and rendering, while communicating with Supabase for data fetching, authentication, and file storage.

## 2. Database Schema (Supabase PostgreSQL)

### 2.1 `site_settings` (Singleton Table)
Stores global configuration and single-instance content.
- `id`: Int (Primary Key, Fixed to 1)
- `business_name`: Text
- `contact_email`: Text
- `instagram_account`: Text
- `about_us_image_url`: Text
- `about_us_text_en`: Text
- `about_us_text_de`: Text
- `imprint_text_en`: Text
- `imprint_text_de`: Text
- `data_privacy_text_en`: Text
- `data_privacy_text_de`: Text
- `social_links`: JSONB (Array of social platforms and URLs)

### 2.2 `section_titles`
Stores localized titles for each homepage section.
- `id`: UUID (Primary Key)
- `section_key`: Text (collection, brands, stores, inspiration, about_us)
- `title_en`: Text
- `title_de`: Text

### 2.3 `collection_images`
- `id`: UUID (Primary Key)
- `image_url`: Text
- `display_order`: Integer
- `created_at`: Timestamptz

### 2.4 `brands`
- `id`: UUID (Primary Key)
- `name`: Text
- `logo_url`: Text
- `homepage_url`: Text
- `display_order`: Integer
- `created_at`: Timestamptz

### 2.5 `stores`
- `id`: UUID (Primary Key)
- `name`: Text
- `address`: Text
- `zip_code`: Text
- `city`: Text
- `phone_number`: Text
- `business_hours`: Text
- `display_order`: Integer
- `created_at`: Timestamptz

### 2.6 `store_images`
- `id`: UUID (Primary Key)
- `store_id`: UUID (Foreign Key to `stores.id`)
- `image_url`: Text
- `display_order`: Integer

## 3. Storage
A public Supabase Storage bucket named `meandme_assets` will be used. It will contain subdirectories for `collection`, `brands`, `stores`, and `general` (for about us image, etc.). Form uploads from the CMS will validate file sizes and automatically adjust aspect ratios where required (e.g., 3:4 for collection images) using client-side canvas transformations before upload.

## 4. Internationalization (i18n)
The application will use `vue-i18n` to handle localization between German (de) and English (en). Static strings (like button labels) will be stored in local JSON files, while dynamic content (like section titles and text blocks) will be fetched from the Supabase database based on the active locale.

## 5. Security & Authentication
- Supabase Auth handles email/password authentication for the `/management` route.
- Row Level Security (RLS) policies in PostgreSQL will restrict `INSERT`, `UPDATE`, and `DELETE` operations on all tables to authenticated users only.
- `SELECT` operations will be open to anonymous users (public read access).

## 6. Instagram Integration
For the Inspiration section, since we only need the last 9 images, we will use a lightweight Supabase Edge Function to securely fetch data from Instagram (either via Basic Display API or scraping) and serve it to the frontend, preventing CORS issues and API key leaks.
