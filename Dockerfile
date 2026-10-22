FROM node:18

# Instalar python3, ffmpeg y curl usando apt-get
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Descargar e instalar yt-dlp de forma oficial
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