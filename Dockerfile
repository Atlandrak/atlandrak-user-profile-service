# Stage 1: Build the TypeScript code
# We use a specific version of Node.js for consistency.
FROM node:20-slim AS builder

# Set the working directory inside the container.
WORKDIR /app

# Copy the package.json and tsconfig.json files first.
# This helps Docker cache the dependencies if they don't change.
COPY package.json tsconfig.json ./

# Install all dependencies needed for the application.
RUN npm install

# Copy the rest of the source code into the container.
COPY src ./src

# Compile the TypeScript code into JavaScript.
# The output will be in the /app/dist directory.
RUN npm run build

# Stage 2: Create the final, lightweight production image
# We start from a fresh, clean Node.js image.
FROM node:20-slim

# Set the final working directory.
WORKDIR /app

# Copy only the compiled code and the necessary dependencies from the 'builder' stage.
# This makes the final image much smaller and more secure.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the application will run on.
# Cloud Run will use this port to send traffic to the container.
EXPOSE 8080

# The command to run when the container starts.
# This executes the compiled JavaScript code.
CMD [ "node", "dist/index.js" ]
