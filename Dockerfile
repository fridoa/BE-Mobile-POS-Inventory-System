FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first (leverages Docker layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source code & TypeScript config
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript → JavaScript (output goes to /app/dist)
RUN npm run build

# Expose the port your app listens on (default 3000, overridable via .env)
EXPOSE 3000

# Run the compiled JavaScript entry point
CMD ["node", "dist/index.js"]
