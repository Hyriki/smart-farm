# Yolo Farm

A modern full-stack web application built with [Next.js](https://nextjs.org), [Prisma ORM](https://www.prisma.io), and [PostgreSQL](https://www.postgresql.org).

## Overview

This project is a production-ready application featuring:

- **Next.js 16** – Modern React framework with server-side rendering and API routes
- **Prisma ORM** – Type-safe database access and migrations
- **PostgreSQL Database** – Hosted on [Supabase](https://supabase.com)
- **Docker & Docker Compose** – Containerized deployment for consistency across environments
- **TypeScript** – End-to-end type safety

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) and Docker Compose
- [Node.js](https://nodejs.org) 20+ (for local development)

## Getting Started

### Using Docker (Recommended)

The easiest way to run the application with all dependencies is using Docker Compose:

```bash
docker-compose up --build
```

This will:
1. Build the Docker image from the Dockerfile
2. Start the application container
3. Expose the application on [http://localhost:3000](http://localhost:3000)

**Note:** Ensure you have a `.env` file with your Supabase connection string:

```env
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```

### Local Development

For development without Docker:

```bash
npm install
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000) and hot-reload as you make changes.

## Project Structure

```
src/
├── app/          # Next.js pages and layouts
├── lib/          # Utilities and shared functions
├── db/           # Database repositories
└── generated/    # Auto-generated Prisma client
prisma/
├── schema.prisma # Database schema
└── migrations/   # Database migrations
```

## Key Commands

```bash
# Development
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint

# Database
npx prisma studio  # Open Prisma Studio UI
npx prisma migrate # Run pending migrations

# Docker
docker-compose up --build      # Build and start containers
docker-compose up              # Start with cached image
docker-compose down            # Stop and remove containers
docker-compose logs -f         # View application logs
```

## Database

This project uses PostgreSQL hosted on [Supabase](https://supabase.com). Database operations are managed with [Prisma ORM](https://www.prisma.io).

To update the schema:

1. Modify `prisma/schema.prisma`
2. Create and apply migrations:
   ```bash
   npx prisma migrate dev --create-only
   npx prisma migrate deploy
   ```

## Deployment

Docker is configured for production deployment. Build and push the image to your container registry:

```bash
docker build -t your-registry/yolo-farm:latest .
docker push your-registry/yolo-farm:latest
```

For deployment on Docker containers or Kubernetes, ensure the following environment variables are set:

- `DATABASE_URL` – PostgreSQL connection string
- `NODE_ENV=production`

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Documentation](https://docs.docker.com)

## License

Proprietary – All rights reserved.
