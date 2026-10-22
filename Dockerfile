FROM node:18-alpine

# Instalar ffmpeg, python y curl para descargar yt-dlp
RUN apk add --no-cache python3 py3-pip ffmpeg curl

# Descargar e instalar yt-dlp de forma oficial y actualizada
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

# Instalar dependencias de Node.js
COPY package*.json ./
RUN npm install --production

# Copiar el resto del código
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]