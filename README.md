# Me&Me Boutique - Digital Platform

Me&Me Boutique is a premium, modern web application designed for a luxury fashion boutique. It features a stunning, responsive frontend for customers and a comprehensive, easy-to-use Content Management System (CMS) for site administrators.

## ✨ Features

### Customer Experience
- **Responsive Design**: Optimized for desktop and mobile, ensuring a premium experience on all devices.
- **Dynamic Content**: Displays the latest collections, brands, and boutique stories.
- **Weekly Inspiration**: A curated gallery of the latest trends and products.
- **Interactive Map**: Integration for locating the boutique's physical stores.

### Content Management System (CMS)
- **Real-time Updates**: Manage site content (text, images, SEO) without touching the code.
- **Media Management**: Advanced drag-and-drop support for reordering image galleries on both desktop and mobile.
- **Store & Brand Management**: Easily update store locations, opening hours, and brand partnerships.
- **SEO Optimization**: Integrated tools to manage metadata and Open Graph images for social sharing.

## 🚀 Technology Stack

- **Frontend**: [Vue.js 3](https://vuejs.org/) (Composition API)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL + Real-time)
- **Styling**: Vanilla CSS (Custom Material Design 3 implementation for CMS)
- **Editor**: [Quill.js](https://quilljs.com/) for rich-text editing

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0 or higher)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/malikjannico/meandme-homepage.git
   ```
2. Navigate to the project directory:
   ```bash
   cd meandme-homepage
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure environment variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## 📦 Deployment
The project is configured for easy deployment on platforms like Vercel, Netlify, or AWS Amplify. Simply connect your GitHub repository and set the environment variables in the deployment dashboard.

---

Designed and built by Antigravity AI.

