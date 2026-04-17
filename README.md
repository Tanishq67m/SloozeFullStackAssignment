# S.H.I.E.L.D Food Command Center 🛡️

![Live Demo](https://img.shields.io/badge/Live_Project-Vercel-black?style=for-the-badge&logo=vercel)

A beautifully themed, superhero-driven full-stack web application built for the Slooze assignment. Step into a classified command center and execute intelligence-based supply requests (food orders) while testing advanced role-based access controllers.

🚀 **Live Project URL:** [https://slooze-full-stack-assignment.vercel.app/](https://slooze-full-stack-assignment.vercel.app/)

---

## 🛠 Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS, Apollo Client (GraphQL), Glassmorphism UI
- **Backend:** NestJS, GraphQL (Code-First), Apollo Server
- **Database Architecture:** PostgreSQL (managed by Prisma ORM)
- **Deployment:** Vercel (Frontend), Render (Backend), Neon (Database)

## 🌟 Core Features

- **Marvel Avengers Aesthetic:** Built from scratch with a custom dark-mode tailwind configuration (`#020617` obsidian base) featuring smooth keyframe animations, glowing elements, and `stark-neon` accents.
- **RBAC (Role-Based Access Control):** Custom `@Roles()` decorators ensure that `MEMBERS` cannot check out or modify payment clearances, isolating actions securely.
- **ReBAC (Relationship/Country-Based Access Control):** Employs strict global scoping via `CountryGuard`. Operatives logged into specific regions (e.g., India) are completely locked out from fetching, searching, or seeing data in unrelated branches (e.g., America).

---

## 💻 Running the Project Locally

If you fork or download this repository, follow these steps to spin up the local development environment seamlessly.

### Prerequisites
- Node.js (v18 or v20+)
- A local or cloud PostgreSQL database (you can easily grab a free one from [Neon.tech](https://neon.tech))

### 1. Backend Setup (NestJS)
Navigate to the `backend` directory:
```bash
cd backend
```
Install all necessary packages:
```bash
npm install
```
Configure your environment variables by creating a `.env` file:
```bash
touch .env
```
Inside the `.env`, provide your PostgreSQL connection string and secure a JWT secret:
```env
# .env
DATABASE_URL="postgresql://user:password@localhost/slooze_db?schema=public"
JWT_SECRET="super_secret_shield_code"
PORT=4000
```
Generate the Prisma Client, run migrations, and automatically seed database with Operatives and Menus:
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```
Start the backend development server:
```bash
npm run start:dev
```
*(The backend should now securely run and listen globally on `http://localhost:4000/graphql`)*

### 2. Frontend Setup (Next.js)
Open a new terminal tab and navigate to the `frontend` directory:
```bash
cd frontend
```
Install all UI and client dependencies:
```bash
npm install
```
Start the frontend development server:
```bash
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) to view the application!

---

## 🕵️‍♂️ S.H.I.E.L.D Operatives (Test Logins)

The database seed will generate these exact operatives. Use them to test the RBAC/ReBAC permission limits! 
> **Universal Password:** `password123`

| Name | Clearances (Role) | Assigned Region | Email Login |
| :--- | :--- | :--- | :--- |
| **Nick Fury** | `ADMIN` | Global (All Regions) | `nick.fury@shield.com` |
| **Captain Marvel** | `MANAGER` | India | `captain.marvel@shield.com` |
| **Captain America** | `MANAGER` | America | `captain.america@shield.com` |
| **Thanos** | `MEMBER` | India | `thanos@shield.com` |
| **Thor** | `MEMBER` | India | `thor@shield.com` |
| **Travis** | `MEMBER` | America | `travis@shield.com` |

---
*Developed for Slooze. All Rights Reserved.*
