# Multi-stage build for the Next.js storefront
FROM node:20-alpine AS base
RUN npm i -g pnpm@9
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @rc/web build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
