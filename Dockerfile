FROM node:22-alpine
WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy app source
COPY server.js rates.js index.html styles.css ./

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
