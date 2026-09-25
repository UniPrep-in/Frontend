# 🎓 UniPrep.in

UniPrep is a modern, responsive, and highly interactive EdTech platform built specifically for students preparing for the CUET entrance exams. It focuses on delivering an immersive student experience through mock tests, performance analysis, study materials, and ranker mentorship.

The project utilizes a modern frontend-heavy architecture optimized for performance, smooth transitions, and public accessibility, ensuring fast load times and strong search engine visibility.

---

## 💻 Technology Stack

### Core Framework
*   **[Next.js (v16 App Router)](https://nextjs.org/)**: The primary framework powering the platform, enabling server-side rendering (SSR), SEO optimization, file-based routing, and high-performance page delivery. It also includes built-in SEO utilities such as `sitemap.ts` and `robots.ts`.
*   **[React 19](https://react.dev/)**: Used to build dynamic, component-based user interfaces and interactive application logic.
*   **[TypeScript](https://www.typescriptlang.org/)**: Provides strict typing, improved development tooling, and better maintainability for the codebase.

### Styling & UI Components
*   **[Tailwind CSS (v4)](https://tailwindcss.com/)**: A utility-first styling framework used to build responsive and scalable UI quickly.
*   **[Styled-Components](https://styled-components.com/)**: Used alongside Tailwind to implement component-scoped CSS-in-JS styling where dynamic styles are required.
*   **Iconography**: The platform integrates `react-icons` and `lucide-react` for scalable SVG icons across the UI.

### Animations & Interactions
*   **[Motion](https://motion.dev/)**: Used to create smooth page transitions, hover interactions, and UI animations.
*   **[GSAP](https://gsap.com/)**: Provides advanced animation timelines and high-performance DOM animations.
*   **[Lenis](https://lenis.darkroom.engineering/)**: Implements smooth scrolling across the platform for a more fluid user experience.

### Backend, State & Data Management
*   **[Supabase](https://supabase.com/)**: Acts as the primary backend service providing authentication, PostgreSQL database connectivity, and Row Level Security (RLS). Server-side authentication is handled using `@supabase/ssr`.
*   **[Zustand](https://github.com/pmndrs/zustand)**: Used for global state management across the frontend, replacing heavier solutions like Redux.
*   **Data Fetching**: External APIs are handled using `axios`, alongside Next.js Server Actions for secure server-side operations.

---

## 🚀 Core Features & Architecture

### 1. Authentication Engine (`/auth` & `AuthProvider`)
*   Secure student login, registration, and session management powered by Supabase authentication.
*   A global `AuthProvider` wraps the React application to protect routes and supply user session data to APIs.

### 2. Modern Landing Page (`/app/page.tsx`)
A visually engaging, conversion-focused homepage built with modular components.
*   **`Hero.tsx`**: High-impact hero section featuring gradient headlines, trust indicators, and call-to-action buttons.
*   **`StatsStrip.tsx`**: Displays platform statistics and usage metrics.
*   **`infiniteCarousel` / `grid.tsx`**: Animated marquee sections showcasing university names (DU, JNU, SRCC) and feature grids.
*   **`Usp.tsx` & `CuetCoverage.tsx`**: Explain the platform’s core benefits and CUET syllabus coverage.
*   **`Review.tsx` & `faq.tsx`**: Student testimonials and collapsible FAQ components.

### 3. Mock Test Engine & Execution (`/mock-tests`, `/api/submit-test`)
The core functionality of the platform.
*   Dynamically loads mock tests using `lib/mock-tests.ts`.
*   Dedicated dynamic routes (`[test-id]`) render the exam interface.
*   A `ProceedLoader` component prepares students before entering the timed exam environment.
*   The `/api/submit-test` endpoint handles grading, analytics, and secure database storage.

### 4. Student Dashboard & Analytics (`/dashboard`, `/attempts`)
A protected dashboard where students can:
*   View previous test attempts
*   Analyze performance reports
*   Identify weak subjects and improvement areas.

### 5. Study Materials & Notices (`/materials`, `/notice`)
*   **`/materials`**: Repository for subject-wise notes, PDFs, and CUET preparation resources.
*   **`/notice`**: Announcement board for updates such as syllabus changes, new tests, or live sessions.

### 6. User Customization (`/profile`)
Allows students to manage:
*   Personal information
*   Account preferences
*   Credentials and settings.

### 7. Legal & Informational Pages (`/footer`)
Fully structured responsive pages including:
*   About Us
*   Contact Us
*   Privacy Policy
*   Terms & Conditions
*   Refund Policy.

### 8. SEO & Public Optimization
UniPrep is designed to be publicly accessible and optimized for search engines.
*   Dynamic metadata generation per route
*   Built-in Next.js `sitemap.ts` and `robots.ts`
*   Server-side rendering for faster indexing
*   Optimized page structure for CUET search visibility.
