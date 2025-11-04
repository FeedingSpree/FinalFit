import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ✅ Pre-create base folders
ensureDir(path.join(__dirname, "uploads/concerns"));
ensureDir(path.join(__dirname, "uploads/gadgets"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = req.body.folder || "uploads"; // e.g. "uploads/gadgets"
    const destPath = path.join(__dirname, folder);
    ensureDir(destPath);
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}_${timestamp}${ext}`);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const folder = req.body.folder || "uploads";
  const relativePath = `/${folder}/${req.file.filename}`.replace(/\\/g, "/");
  res.json({ filePath: relativePath });
});

app.listen(4000, () => console.log("✅ Upload server running at http://localhost:4000"));
