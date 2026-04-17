# Slooze Food Ordering App

A full-stack food ordering application with Role-Based Access Control (RBAC) and Relational Access Control (ReBAC) built for the Slooze take-home assignment.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Apollo Client |
| Backend | NestJS, GraphQL (Apollo Server), Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (role + country embedded in token) |
| Real-time | GraphQL Subscriptions over WebSocket |
| DevOps | Docker Compose (one-command setup) |

---

## Quickstart (Docker — recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run the whole stack in one command

```bash
git clone <your-repo-url>
cd slooze-challenge
docker compose up --build
```

That's it. Docker will:
1. Start PostgreSQL
2. Run Prisma migrations
3. Seed the database with all 6 Marvel characters, restaurants, menus, and sample orders
4. Start the NestJS backend on **http://localhost:3001**
5. Start the Next.js frontend on **http://localhost:3000**

Open **http://localhost:3000** and log in.

---

## Local Development (without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL running locally (or use Docker just for the DB)

### 1. Start the database only

```bash
docker compose up postgres -d
```

### 2. Backend setup

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

Backend runs at **http://localhost:3001/graphql**

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## Login Credentials

All users share the password: **`password123`**

| Name | Email | Role | Country |
|------|-------|------|---------|
| Nick Fury | nick.fury@shield.com | ADMIN | Global (no restriction) |
| Captain Marvel | captain.marvel@shield.com | MANAGER | India |
| Captain America | captain.america@shield.com | MANAGER | America |
| Thanos | thanos@shield.com | MEMBER | India |
| Thor | thor@shield.com | MEMBER | India |
| Travis | travis@shield.com | MEMBER | America |

> **Tip:** Use the **"Switch User"** dropdown in the navbar to instantly switch between characters without logging out.

---

## Access Control Matrix

| Feature | Admin | Manager | Member |
|---------|-------|---------|--------|
| View restaurants & menus | ✅ All countries | ✅ Own country only | ✅ Own country only |
| Create order | ✅ | ✅ | ✅ |
| Place order (checkout & pay) | ✅ | ✅ Own country only | ❌ |
| Cancel order | ✅ | ✅ Own country only | ❌ |
| Manage payment methods | ✅ | ❌ | ❌ |
| Real-time order notifications | ✅ All | ✅ Own country | ❌ |

---

## Architecture

### RBAC (Role-Based Access Control)
Implemented via `RolesGuard` in NestJS. Every GraphQL resolver is decorated with `@Roles(Role.ADMIN, Role.MANAGER)` etc. The guard reads the JWT token, extracts the role, and compares it against the required roles. If the role doesn't match, a `403 ForbiddenException` is thrown.

### ReBAC (Relational/Relationship-Based Access Control) — Bonus
Implemented via `CountryGuard.assertCountryAccess()`. This is called inside resolvers *after* the resource is fetched. It compares `user.country` (from JWT) against the resource's `country` field. Admin always bypasses this check.

**Example flow:**
1. Thanos (Member · India) tries to fetch an American restaurant via `/restaurant?id=...`
2. `RolesGuard` passes — MEMBER can view restaurants
3. Restaurant is fetched from DB
4. `CountryGuard.assertCountryAccess(user, restaurant.country)` throws 403 because `INDIA !== AMERICA`

### Real-time Subscriptions
When a Manager places an order, the backend publishes an `ORDER_PLACED` event via `graphql-subscriptions` PubSub. The subscription filter function checks the event's `country` against the subscriber's `country` (from JWT in WebSocket `connectionParams`), so only the correct country's managers receive the toast notification.

### JWT Payload
```json
{
  "sub": "user-id",
  "email": "captain.marvel@shield.com",
  "name": "Captain Marvel",
  "role": "MANAGER",
  "country": "INDIA"
}
```
Both `role` and `country` are embedded so guards work without extra DB calls.

---

## Project Structure

```
slooze-challenge/
├── docker-compose.yml          # One-command startup
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Full data model
│   │   └── seed.ts             # Marvel characters + sample data
│   └── src/
│       ├── auth/               # Login mutation, JWT signing
│       ├── common/             # RolesGuard, CountryGuard, decorators
│       ├── restaurants/        # Resolver + service
│       ├── orders/             # Resolver + service + subscriptions
│       ├── payments/           # Resolver + service
│       └── users/              # me() + teamMembers() queries
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx         # Login page with quick-login grid
        │   ├── restaurants/     # Restaurant listing + menu + cart
        │   ├── orders/          # Orders list + real-time toasts
        │   ├── checkout/        # Cart review + payment
        │   └── payments/        # Payment method management (Admin)
        ├── components/
        │   ├── AccessGate.tsx   # RBAC wrapper component
        │   └── Navbar.tsx       # Identity switcher
        └── lib/
            ├── apollo.ts        # Apollo client + WS subscriptions
            └── auth-context.tsx # Auth state + switchUser()
```

---

## GraphQL API Reference

**Endpoint:** `http://localhost:3001/graphql`

### Mutations
```graphql
mutation Login { login(email: String!, password: String!) }
mutation CreateOrder { createOrder(restaurantId, items, notes) }
mutation PlaceOrder { placeOrder(orderId, paymentMethodId) }   # ADMIN, MANAGER
mutation CancelOrder { cancelOrder(orderId) }                  # ADMIN, MANAGER
mutation AddPaymentMethod { addPaymentMethod(...) }            # ADMIN only
mutation RemovePaymentMethod { removePaymentMethod(id) }       # ADMIN only
mutation SetDefaultPaymentMethod { setDefaultPaymentMethod(id) } # ADMIN only
```

### Queries
```graphql
query { restaurants { ... } }     # Country-scoped automatically
query { orders { ... } }          # Scoped by role (all/country/own)
query { myPaymentMethods { ... } }
query { me { ... } }
query { teamMembers { ... } }
```

### Subscriptions
```graphql
subscription { orderPlaced { id status country user { name } restaurant { name } } }
```

---

## Wow Factor: Real-time Country-Scoped Notifications

When any order is placed:
- **Nick Fury (Admin):** Gets notified for all orders globally
- **Captain Marvel (Manager · India):** Gets toast notifications only for Indian orders
- **Captain America (Manager · America):** Gets toast notifications only for American orders
- **Members:** Don't receive notifications (not subscribed)

This demonstrates WebSocket-based real-time communication with ReBAC filtering at the subscription layer.
