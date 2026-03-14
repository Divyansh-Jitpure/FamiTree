# FamiTree

This repository has been moved from a split `client` and `server` starter into a single Next.js app.

## Current direction

- `app/` contains the new Next.js App Router structure.
- `messages/` contains the English and Hindi dictionaries.
- `prisma/schema.prisma` contains the first relational data model for family trees.

## Next steps

1. Install dependencies at the repo root.
2. Start a local PostgreSQL database and copy `.env.example` to `.env.local`.
3. Use `prisma.config.ts` for the database URL on Prisma 7.
4. Run `npx prisma generate`.
5. Add the first create-person flow and simple family board UI.
