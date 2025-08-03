# Stage 1: Final Production Build Environment
FROM node:20-slim AS production

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy files required to install all dependencies for the monorepo
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY services ./services

# Install ALL dependencies (including dev dependencies). This creates a robust node_modules structure.
RUN pnpm install -r

# Build the specific service we want to deploy
RUN pnpm --filter user-profile-service build

# --- The application will now run from within this fully prepared environment ---

# Set the final working directory to the location of the compiled code
WORKDIR /app/services/user-profile-service/dist

EXPOSE 8081

# Command to run the now-correctly-located application
CMD [ "node", "index.js" ]
