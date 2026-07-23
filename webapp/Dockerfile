FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Explicit copy list instead of `COPY . .` — only what the running app needs,
# so dev config, tests, and anything unintended can never end up in the image.
COPY server.js validation.js ./
COPY public ./public

# Run as the unprivileged 'node' user baked into this image instead of root.
USER node

EXPOSE 3000
CMD ["node", "server.js"]
