const mongoose = require("mongoose");

const connectToDatabase = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/zenkey");
    console.log("✅ MongoDB connecté !");
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB :", error);
  }
};

module.exports = connectToDatabase;
