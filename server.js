const express = require("express");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DIR = path.join(__dirname, "downloads");
fs.mkdirSync(DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"];
function validUrl(raw) {
  try {
    const u = new URL(raw);
    return ["http:", "https:"].includes(u.protocol) && HOSTS.includes(u.hostname);
  } catch { return false; }
}

app.post("/api/convert", (req, res) => {
  const url = String(req.body.url || "").trim();
  if (!validUrl(url)) return res.status(400).json({ error: "Enlace de YouTube no válido." });

  const args = [
    "-x", "--audio-format", "mp3", "--audio-quality", "0",
    "--no-playlist", "--no-simulate", "--restrict-filenames",
    "-o", path.join(DIR, "%(id)s.%(ext)s"),
    "--print", "%(id)s|||%(title)s",
    url,
  ];
  execFile("yt-dlp", args, { timeout: 5 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr || err.message);
      return res.status(500).json({ error: "No se pudo convertir. Revisa que yt-dlp y ffmpeg estén instalados y que el video esté disponible." });
    }
    const line = stdout.split("\n").find((l) => l.includes("|||"));
    if (!line) return res.status(500).json({ error: "Respuesta inesperada de yt-dlp." });
    const [id, ...rest] = line.split("|||");
    const title = rest.join("|||").trim();
    res.json({ id: id.trim(), title, file: `/api/download/${id.trim()}?name=${encodeURIComponent(title)}` });
  });
});

app.get("/api/download/:id", (req, res) => {
  const { id } = req.params;
  if (!/^[\w-]{6,20}$/.test(id)) return res.status(400).end();
  const file = path.join(DIR, `${id}.mp3`);
  if (!fs.existsSync(file)) return res.status(404).send("Archivo no encontrado o expirado.");
  const name = String(req.query.name || id).replace(/[\\/:*?"<>|]+/g, "").slice(0, 120) || id;
  res.download(file, `${name}.mp3`);
});

// Borra archivos con más de 1 hora
setInterval(() => {
  const limit = Date.now() - 60 * 60 * 1000;
  fs.readdirSync(DIR).forEach((f) => {
    const p = path.join(DIR, f);
    if (fs.statSync(p).mtimeMs < limit) fs.unlinkSync(p);
  });
}, 10 * 60 * 1000);

app.listen(PORT, () => console.log(`Abre http://localhost:${PORT}`));
