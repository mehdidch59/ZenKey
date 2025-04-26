const express = require("express");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");
const { exec } = require("child_process");
const fs = require("fs");
const connectToDatabase = require("./db/database");
connectToDatabase();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});
const cors = require("cors");
app.use(cors());
const mongoose = require("mongoose");
const User = require("./model/User");

const USB_PATH = "/mnt/usb";
const DOCKER_IMAGE = "clamav-scan";

// 🔍 Vérifie si une clé est montée
const isUsbMounted = () => {
  try {
    return fs.existsSync(USB_PATH) && fs.readdirSync(USB_PATH).length > 0;
  } catch {
    return false;
  }
};

// Variable pour suivre l'état de la clé USB
let previousUsbState = false;

// 🔄 Vérification périodique des clés USB (toutes les 500ms)
const usbCheckInterval = setInterval(() => {
  const currentUsbState = isUsbMounted();
  
  // Si l'état a changé depuis la dernière vérification
  if (currentUsbState !== previousUsbState) {
    previousUsbState = currentUsbState;
    
    // Notifier tous les clients connectés
    io.emit(currentUsbState ? "usb_inserted" : "usb_removed", 
      currentUsbState ? { path: USB_PATH } : {});
    
    console.log(`💾 Changement d'état USB détecté: ${currentUsbState ? "Inséré" : "Retiré"}`);
  }
}, 500);

// ⚡ WebSocket logic
io.on("connection", (socket) => {
  console.log("📡 Client connecté");
  socket.emit("status", { msg: "Connecté au backend ClamAV Node.js" });

  // ✅ Envoie l'état initial de la clé USB dès la connexion
  const currentUsbState = isUsbMounted();
  socket.emit("usb_status", {
    state: currentUsbState ? "inserted" : "removed",
    path: currentUsbState ? USB_PATH : null
  });

  socket.on("usb_check", () => {
    const currentUsbState = isUsbMounted();
    socket.emit("usb_status", {
      state: currentUsbState ? "inserted" : "removed",
      path: currentUsbState ? USB_PATH : null
    });
  });

  socket.on("analyze", () => {
    console.log("🧪 Analyse demandée par le client");
    socket.emit("status", { msg: "Analyse en cours avec ClamAV..." });

    if (!isUsbMounted()) {
      console.warn("❌ Aucune clé USB détectée ou clé vide.");
      socket.emit("scan_result", {
        status: "error",
        report: "❌ Aucune clé USB détectée ou clé vide.",
      });
      return;
    }

    const REPORT_PATH = `${USB_PATH}/scan_report.txt`;
    const cmd = `docker run --rm -v ${USB_PATH}:${USB_PATH} ${DOCKER_IMAGE} ${USB_PATH}`;

    // Envoyer une mise à jour de progression initiale
    socket.emit("scan_progress", { progress: 0 });
    
    // Simuler des mises à jour de progression pendant le scan
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      if (progress <= 90) {
        socket.emit("scan_progress", { progress });
      } else {
        clearInterval(progressInterval);
      }
    }, 1000);

    exec(cmd, { timeout: 120000 }, (error, stdout, stderr) => {
      clearInterval(progressInterval); // Arrêter la simulation de progression
      socket.emit("scan_progress", { progress: 100 }); // 100% terminé
      
      if (error) {
        socket.emit("scan_result", {
          status: "error",
          report: stderr || error.message,
        });
        return;
      }

      if (fs.existsSync(REPORT_PATH)) {
        const report = fs.readFileSync(REPORT_PATH, "utf-8");
        socket.emit("scan_result", { status: "done", report });
      } else {
        socket.emit("scan_result", {
          status: "done",
          report: "⚠️ Aucun rapport trouvé. ClamAV n'a peut-être rien scanné.",
        });
      }
    });
  });

  socket.on("format", () => {
    socket.emit("status", { msg: "Formatage simulé (non encore implémenté)" });
    
    // Simuler la progression du formatage
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      socket.emit("format_progress", { progress });
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        socket.emit("format_complete", { success: true });
      }
    }, 500);
  });
  
  socket.on("disconnect", () => {
    console.log("📡 Client déconnecté");
  });
});

// Nettoyer l'intervalle quand le serveur s'arrête
process.on('SIGINT', () => {
  clearInterval(usbCheckInterval);
  process.exit(0);
});

// 🧑‍💻 Auth routes
app.use(express.json());

app.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email déjà utilisé" });

    const newUser = new User({ email, password, role });
    await newUser.save();
    res.status(201).json({ msg: "Utilisateur créé avec succès ✅" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Mot de passe incorrect" });

    res.json({ msg: "Connexion réussie", role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🚀 Server start
server.listen(5000, "0.0.0.0", () => {
  console.log("🚀 Serveur WebSocket en écoute sur le port 5000");
});
