FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 ffmpeg curl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp
WORKDIR /app
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["sh","-c","yt-dlp -U || true; node server.js"]
