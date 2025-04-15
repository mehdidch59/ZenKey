import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { CheckCircle, ShieldAlert, Loader2, Home, UserCircle, Settings, Glasses } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import socket from "~/lib/socket";
import { toast } from "sonner";

export default function ZenKeyApp() {
  const [page, setPage] = useState("home");
  const [scanStatus, setScanStatus] = useState("idle");
  const [authTab, setAuthTab] = useState("login");
  const [scanProgress, setScanProgress] = useState(0);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [usbState, setUsbState] = useState<"waiting" | "inserted" | "removed">("waiting");
  const [usbPath, setUsbPath] = useState("");
  const [mainAction, setMainAction] = useState<'none' | 'scan' | 'format'>("none");
  const [formatProgress, setFormatProgress] = useState(0);

  type InfectedFile = {
    path: string;
    threat: string;
    removed: boolean;
  };

  const [infectedFiles, setInfectedFiles] = useState<InfectedFile[]>([]);

  // Détecter si l'appareil est tactile
  useEffect(() => {
    console.log("Tentative de connexion WebSocket...");

    socket.on("connect", () => {
      console.log("✅ Connecté au WebSocket !");
    });

    socket.on("status", (data) => {
      console.log("📡 Status :", data.msg);
    });

    socket.on("usb_status", (data) => {
      console.log("💾 État USB reçu :", data);
      setUsbState(data.state);
      setUsbPath(data.path);
    });

    socket.emit("usb_check");

    socket.on("usb_inserted", (data) => {
      console.log("🟢 USB détectée", data);
      setUsbState("inserted");
      setUsbPath(data.path);
    });

    socket.on("usb_removed", () => {
      console.log("🔴 USB retirée");
      setUsbState("removed");
      setUsbPath("");
    });

    setUsbState("waiting");

    socket.on("scan_result", (data) => {
      console.log("🧪 Résultat reçu :", data);

      if (data.status === "error") {
        setScanStatus("error");
        setInfectedFiles([]);
        setScanProgress(0);
        setErrorMessage(data.report || "❌ Erreur inconnue");
        return;
      }

      if (!data?.report) {
        console.warn("⚠️ Pas de rapport reçu !");
        setScanStatus("idle");
        return;
      }

      const report = data.report;
      const infectedMatch = report.match(/Infected files:\s*(\d+)/i);
      const infectedCount = infectedMatch ? parseInt(infectedMatch[1], 10) : 0;

      const lines = report.split("\n");
      const foundFiles = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(.*?): (.+) FOUND$/i);
        if (match) {
          const filePath = match[1];
          const threatName = match[2];
          const removed = lines[i + 1]?.includes("Removed.");
          foundFiles.push({ path: filePath, threat: threatName, removed });
        }
      }

      setInfectedFiles(foundFiles);
      setScanStatus(infectedCount > 0 ? "threat" : "clean");
    });

    console.log(usbState);

    return () => {
      socket.off("connect");
      socket.off("status");
      socket.off("usb_status");
      socket.off("scan_result");
      socket.off("usb_inserted");
      socket.off("usb_removed");
    };
  }, []);

  // Fonction utilitaire pour les styles bouton iOS
  const getIosButtonStyles = (isActive = false) => {
    return cn(
      "flex-col gap-1 h-auto py-2 px-4 rounded-full transition-all duration-300",
      "border border-gray-200/50 shadow-sm",
      "bg-white/80 backdrop-blur-md",
      isActive ? "bg-gray-50/90 shadow-inner" : "hover:bg-white hover:shadow",
      "active:scale-95 active:shadow-inner active:bg-gray-50/90",
      "focus:outline-none focus:ring-2 focus:ring-blue-400/30"
    );
  };

  const handleScan = () => {
    if (!isAuthenticated) {
      alert("🚫 Vous devez être connecté pour lancer une analyse.");
      return;
    }

    if (usbState !== "inserted") {
      toast.error("❌ Aucune clé USB détectée !");
      return;
    }

    setMainAction("scan");
    setScanStatus("scanning");
    setInfectedFiles([]);
    setScanProgress(0);
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 300);

    // Simuler progression (pour démonstration)
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
        
        // Envoi d'une commande de scan au backend
        socket.emit("analyze");
        
        // Dans un cas réel, nous attendrions la réponse du backend
        // Ici on simule un délai
        setTimeout(() => {
          if (Math.random() > 0.7) {
            setScanStatus("threat");
          } else {
            setScanStatus("clean");
          }
          setTimeout(() => setMainAction("none"), 500);
        }, 1000);
      }
    }, 100);
  };

  const handleLogout = () => {
    setUserEmail("");
    setLoginEmail("");
    setLoginPassword("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterConfirm("");
    toast.success("✅ Déconnexion réussie !");
    setTimeout(() => {
      setIsAuthenticated(false);
      setPage("auth");
    }, 2000);
  };

  const handleFormat = () => {
    if (!isAuthenticated) {
      alert("🚫 Vous devez être connecté pour formater la clé.");
      return;
    }
    
    if (usbState !== "inserted") {
      toast.error("❌ Aucune clé USB détectée !");
      return;
    }
    
    setMainAction("format");
    setFormatProgress(0);
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 300);
    
    // Simuler une progression
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      setFormatProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
        toast.success("✅ Clé USB formatée (simulation)");
        setTimeout(() => setMainAction("none"), 500);
      }
    }, 100);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans p-0 touch-manipulation overflow-hidden flex items-center justify-center">
      <Card className="w-full max-w-5xl mx-auto shadow-xl rounded-3xl overflow-hidden border-0 h-[98vh]">
        <CardContent className="p-0 flex flex-col h-full relative">
          {/* Navigation en bas (style iOS) - positionnée de manière absolue */}
          <div className="absolute bottom-2 left-0 right-0 z-10">
            <div className="flex justify-around items-center py-2 px-3 max-w-md mx-auto bg-white/70 backdrop-blur-lg rounded-full shadow-lg border border-white/50">
              <Button
                variant="ghost"
                className={getIosButtonStyles(page === "home")}
                onClick={() => setPage("home")}
              >
                <Home size={20} className={page === "home" ? "text-blue-500" : "text-gray-500"} />
                <span className={cn("text-xs", page === "home" ? "text-blue-500" : "text-gray-500")}>Accueil</span>
              </Button>
              <Button
                variant="ghost"
                className={getIosButtonStyles(page === "auth" || page === "profile")}
                onClick={() => setPage(isAuthenticated ? "profile" : "auth")}
              >
                <UserCircle size={20} /><span className={cn("text-xs", page === "auth" || page === "profile" ? "text-blue-500" : "text-gray-500")}>{isAuthenticated ? "Profil" : "Compte"}</span>
              </Button>
              <Button
                variant="ghost"
                className={getIosButtonStyles(page === "admin")}
                onClick={() => setPage("admin")}
              >
                <Settings size={20} className={page === "admin" ? "text-blue-500" : "text-gray-500"} />
                <span className={cn("text-xs", page === "admin" ? "text-blue-500" : "text-gray-500")}>Admin</span>
              </Button>
            </div>
          </div>

          <div className="p-4 pb-14 flex-1 overflow-y-auto hide-scrollbar">
            <h1 className="text-2xl font-bold text-center mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">ZenKey</span>
            </h1>

            {page === "home" && (
              <div className="max-w-md mx-auto text-center space-y-15">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Décontamination USB</h2>
                </div>

                {usbState === "inserted" && (
                  <div className="text-green-700 bg-green-100 rounded-xl p-2 mb-2 shadow border border-green-200">
                    ✅ Clé USB détectée : <span className="font-mono">{usbPath}</span>
                  </div>
                )}

                {usbState === "removed" && (
                  <div className="text-red-700 bg-red-100 rounded-xl p-2 mb-2 shadow border border-red-200">
                    ❌ Aucune clé USB détectée
                  </div>
                )}

                {usbState === "waiting" && (
                  <div className="text-gray-600 bg-gray-100 rounded-xl p-2 mb-2 shadow border border-gray-200">
                    🔍 En attente de clé USB...
                  </div>
                )}

                <div className={cn(
                  "w-64 h-64 mx-auto rounded-full flex items-center justify-center transition-all duration-300 relative",
                  {
                    "bg-blue-50": scanStatus === "idle",
                    "bg-blue-100": scanStatus === "scanning",
                    "bg-green-50": scanStatus === "clean",
                    "bg-red-50": scanStatus === "threat",
                    "bg-red-100": scanStatus === "error"
                  }
                )}>
                  {/* Gélule de progression avec deux actions */}
                  <div className="relative w-96 max-w-full mx-auto flex flex-col items-center justify-center">
                    {/* Suppression du cercle bleu en arrière-plan */}
                    <div
                      className={cn(
                        "relative flex w-full h-20 overflow-hidden transition-all duration-500 bg-white",
                        "shadow-2xl shadow-blue-100/40 border border-gray-100",
                        mainAction === "scan" && "bg-blue-50",
                        mainAction === "format" && "bg-yellow-50"
                      )}
                      style={{ borderRadius: 40 }}
                    >
                      {/* Barre de séparation centrale */}
                      <div className={cn(
                        "absolute left-1/2 top-3 h-14 w-1 bg-gray-200 rounded-full z-20 transition-all duration-500 -translate-x-1/2",
                        (mainAction === "scan" || mainAction === "format") && "opacity-0 scale-0"
                      )} />
                      {/* Progression horizontale pour Scan */}
                      {mainAction === "scan" && (
                        <div
                          className="absolute left-0 top-0 h-full bg-blue-500/30 z-0 transition-all duration-500"
                          style={{
                            width: `${scanProgress}%`,
                            borderTopLeftRadius: 40,
                            borderBottomLeftRadius: 40,
                            borderTopRightRadius: scanProgress === 100 ? 40 : 0,
                            borderBottomRightRadius: scanProgress === 100 ? 40 : 0,
                          }}
                        />
                      )}
                      
                      {/* Progression pour Format */}
                      {mainAction === "format" && (
                        <div
                          className="absolute left-0 top-0 h-full bg-yellow-400/30 z-0 transition-all duration-500"
                          style={{
                            width: `${formatProgress}%`,
                            borderTopLeftRadius: 40,
                            borderBottomLeftRadius: 40,
                            borderTopRightRadius: formatProgress === 100 ? 40 : 0,
                            borderBottomRightRadius: formatProgress === 100 ? 40 : 0,
                          }}
                        />
                      )}
                      {/* Scanner */}
                      <Button
                        disabled={!isAuthenticated || mainAction === "format" || usbState !== "inserted"}
                        className={cn(
                          "flex-1 h-20 text-lg font-semibold transition-all duration-500 flex items-center justify-center relative z-10",
                          mainAction === "scan" 
                            ? "rounded-full bg-gradient-to-r from-blue-400 to-blue-500 text-white scale-105 active:!bg-blue-100 active:!text-blue-700 left-0 right-0 mx-auto absolute inset-0 w-full" 
                            : "rounded-l-full rounded-r-none",
                          mainAction === "format"
                            ? "scale-0 opacity-0 pointer-events-none absolute left-0 top-0 w-0"
                            : "bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100",
                          (!isAuthenticated || usbState !== "inserted") && "opacity-50 cursor-not-allowed border-gray-200",
                          "border border-r-0 border-blue-200"
                        )}
                        style={{ borderTopLeftRadius: 40, borderBottomLeftRadius: 40, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        onClick={handleScan}
                        onTouchStart={() => setIsButtonPressed(true)}
                        onTouchEnd={() => setIsButtonPressed(false)}
                        onMouseDown={() => !isTouchDevice && setIsButtonPressed(true)}
                        onMouseUp={() => !isTouchDevice && setIsButtonPressed(false)}
                        onMouseLeave={() => !isTouchDevice && isButtonPressed && setIsButtonPressed(false)}
                      >
                        {mainAction === "scan" && (
                          <span className="text-base font-medium">{scanProgress}%</span>
                        )}
                        <span>Scanner</span>
                      </Button>
                      {/* Formater */}
                      <Button
                        disabled={!isAuthenticated || mainAction === "scan" || usbState !== "inserted"}
                        className={cn(
                          "flex-1 h-20 text-lg font-semibold transition-all duration-500 flex items-center justify-center relative z-10",
                          mainAction === "format" 
                            ? "rounded-full bg-gradient-to-l from-yellow-400 to-yellow-500 text-white scale-105 active:!bg-yellow-100 active:!text-yellow-700 left-0 right-0 mx-auto absolute inset-0 w-full" 
                            : "rounded-r-full rounded-l-none",
                          mainAction === "scan"
                            ? "scale-0 opacity-0 pointer-events-none absolute right-0 top-0 w-0"
                            : "bg-white text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100",
                          (!isAuthenticated || usbState !== "inserted") && "opacity-50 cursor-not-allowed border-gray-200",
                          "border border-l-0 border-yellow-200"
                        )}
                        style={{ borderTopRightRadius: 40, borderBottomRightRadius: 40, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        onClick={handleFormat}
                        onTouchStart={() => setIsButtonPressed(true)}
                        onTouchEnd={() => setIsButtonPressed(false)}
                        onMouseDown={() => !isTouchDevice && setIsButtonPressed(true)}
                        onMouseUp={() => !isTouchDevice && setIsButtonPressed(false)}
                        onMouseLeave={() => !isTouchDevice && isButtonPressed && setIsButtonPressed(false)}
                      >
                        {mainAction === "format" && (
                          <span className="text-base font-medium">{formatProgress}%</span>
                        )}
                        <span>Formater</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {!isAuthenticated && (
                    <div className="text-amber-600 bg-amber-50/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-amber-100 mb-4">
                      ⚠️ Vous devez vous connecter pour utiliser les fonctionnalités
                    </div>
                  )}
                  
                  {isAuthenticated && usbState !== "inserted" && (
                    <div className="text-amber-600 bg-amber-50/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-amber-100 mb-4">
                      ⚠️ Insérez une clé USB pour utiliser les fonctionnalités
                    </div>
                  )}
                  
                  {scanStatus === "idle" && (
                    <p className="text-gray-500">Prêt à scanner</p>
                  )}
                  {scanStatus === "scanning" && (
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-lg">Analyse en cours...</span>
                    </div>
                  )}
                  {scanStatus === "clean" && (
                    <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-green-100">
                      <CheckCircle size={20} />
                      <span className="text-lg font-medium">Clé saine ✅</span>
                    </div>
                  )}
                  {scanStatus === "threat" && (
                    <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-red-100">
                      <ShieldAlert size={20} />
                      <span className="text-lg font-medium">Menace détectée ⚠️</span>
                    </div>
                  )}
                  {scanStatus === "error" && errorMessage && (
                    <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-red-100 mt-4">
                      <ShieldAlert size={20} />
                      <span className="text-lg font-medium">{errorMessage}</span>
                    </div>
                  )}

                  {infectedFiles.length > 0 && (
                    <div className="mt-4 text-left text-sm bg-white/70 rounded-xl p-4 shadow border border-red-200">
                      <p className="font-semibold text-red-700 mb-2">Détails des fichiers infectés :</p>
                      <ul className="list-disc ml-6 space-y-1">
                        {infectedFiles.map((file, index) => (
                          <li key={index}>
                            <span className="font-medium text-gray-800">{file.path}</span><br />
                            <span className="text-red-600">{file.threat}</span> —{" "}
                            <span className={file.removed ? "text-green-600" : "text-yellow-600"}>
                              {file.removed ? "Supprimé ✅" : "Non supprimé ⚠️"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </div>
            )}

            {page === "auth" && (
              <div className="max-w-md mx-auto space-y-16">
                <h2 className="text-2xl font-semibold text-center">Authentification</h2>
                <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
                  <div className="flex justify-center mb-6">
                    <TabsList className="grid grid-cols-2 rounded-full overflow-hidden bg-gray-100 p-1 w-full h-full max-w-xs">
                      <TabsTrigger
                        value="login"
                        className="rounded-full py-2 font-medium text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        Connexion
                      </TabsTrigger>
                      <TabsTrigger
                        value="register"
                        className="rounded-full py-2 font-medium text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        Inscription
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="login">
                    <Card className="border-0 shadow-md rounded-3xl">
                      <CardContent className="p-4 space-y-4">
                        <Input className="text-base py-4 rounded-2xl bg-gray-50/80 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" placeholder="Email" type="email" inputMode="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                        <Input className="text-base py-4 rounded-2xl bg-gray-50/80 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" placeholder="Mot de passe" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                        <Button
                          className={cn(
                            "w-full py-4 text-base rounded-full shadow-md transition-all duration-300",
                            "bg-gradient-to-b from-blue-500 to-blue-600 text-white",
                            "border border-blue-400/50",
                            "active:scale-95 active:shadow-inner active:from-blue-600 active:to-blue-700",
                            !isTouchDevice && "hover:shadow-lg hover:shadow-blue-300/20",
                            "focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                          )}
                          onClick={async () => {
                            try {
                              const res = await fetch("http://localhost:5000/login", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                  email: loginEmail,
                                  password: loginPassword
                                })
                              });

                              const data = await res.json();
                              if (!res.ok) {
                                toast.error(`❌ ${data.error}`);
                              } else {
                                toast.success("✅ Connexion réussie !");
                                setIsAuthenticated(true);
                                setUserEmail(loginEmail); // Ajouter cette ligne pour définir l'email
                                setTimeout(() => {
                                  setPage("home");
                                }, 2000);
                              }
                            } catch (err) {
                              console.error(err);
                              toast.error("❌ Erreur de connexion au serveur");
                            }
                          }}
                        >
                          Se connecter
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="register">
                    <Card className="border-0 shadow-md rounded-3xl">
                      <CardContent className="p-4 space-y-4">
                        <Input className="text-base py-4 rounded-2xl bg-gray-50/80 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" placeholder="Email" type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
                        <Input className="text-base py-4 rounded-2xl bg-gray-50/80 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" placeholder="Mot de passe" type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                        <Input className="text-base py-4 rounded-2xl bg-gray-50/80 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" placeholder="Confirmer le mot de passe" type="password" value={registerConfirm} onChange={(e) => setRegisterConfirm(e.target.value)} />
                        <Button
                          className={cn(
                            "w-full py-4 text-base rounded-full shadow-md transition-all duration-300",
                            "bg-gradient-to-b from-blue-500 to-blue-600 text-white",
                            "border border-blue-400/50",
                            "active:scale-95 active:shadow-inner active:from-blue-600 active:to-blue-700",
                            !isTouchDevice && "hover:shadow-lg hover:shadow-blue-300/20",
                            "focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                          )}
                          // Dans le gestionnaire de clic pour l'inscription
                          onClick={async () => {
                            if (registerPassword !== registerConfirm) {
                              setRegisterMessage("Les mots de passe ne correspondent pas !");
                              return;
                            }
                            try {
                              const res = await fetch("http://localhost:5000/register", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                  email: registerEmail,
                                  password: registerPassword,
                                  role: "user"
                                })
                              });
                              const data = await res.json();
                              if (!res.ok) {
                                toast.error(`❌ ${data.error}`);
                              } else {
                                toast.success("✅ Compte créé !");
                                setIsAuthenticated(true);
                                setUserEmail(registerEmail); // Ajouter cette ligne pour définir l'email
                                setTimeout(() => {
                                  setPage("home");
                                }, 2000);
                              }
                            } catch (err) {
                              console.error(err);
                              toast.error("❌ Erreur de connexion au serveur");
                            }
                          }}
                        >
                          Créer un compte
                        </Button>
                        {loginMessage && (
                          <p className="text-sm mt-2 text-center text-gray-700">{loginMessage}</p>
                        )}
                        {registerMessage && (
                          <p className="text-sm mt-2 text-center text-gray-700">{registerMessage}</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {page === "admin" && (
              <div className="max-w-4xl mx-auto space-y-4">
                <h2 className="text-2xl font-semibold text-center">Panel d'administration</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="rounded-3xl shadow-md border-0 overflow-hidden transition-transform ios-gradient backdrop-blur-sm active:scale-98">
                    <div className="bg-blue-50 h-2"></div>
                    <CardContent className="p-3">
                      <p className="text-gray-500 font-medium">Total scans</p>
                      <p className="text-3xl font-bold">72</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-3xl shadow-md border-0 overflow-hidden transition-transform ios-gradient backdrop-blur-sm active:scale-98">
                    <div className="bg-red-50 h-2"></div>
                    <CardContent className="p-3">
                      <p className="text-gray-500 font-medium">Menaces détectées</p>
                      <p className="text-3xl font-bold">9</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-3xl shadow-md border-0 overflow-hidden transition-transform ios-gradient backdrop-blur-sm active:scale-98">
                    <div className="bg-green-50 h-2"></div>
                    <CardContent className="p-3">
                      <p className="text-gray-500 font-medium">Utilisateurs actifs</p>
                      <p className="text-3xl font-bold">18</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Graphique de tendance */}
                  <Card className="rounded-3xl shadow-md border-0 overflow-hidden ios-gradient backdrop-blur-sm">
                    <CardContent className="p-3">
                      <h3 className="text-lg font-semibold mb-2">Tendance des scans</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart
                          data={[
                            { date: 'Lun', scans: 10, menaces: 2 },
                            { date: 'Mar', scans: 8, menaces: 1 },
                            { date: 'Mer', scans: 15, menaces: 0 },
                            { date: 'Jeu', scans: 12, menaces: 3 },
                            { date: 'Ven', scans: 18, menaces: 2 },
                            { date: 'Sam', scans: 5, menaces: 0 },
                            { date: 'Dim', scans: 4, menaces: 1 },
                          ]}
                          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="scanColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="menaceColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <Tooltip contentStyle={{ borderRadius: '12px' }} />
                          <Area type="monotone" dataKey="scans" stroke="#3b82f6" fillOpacity={1} fill="url(#scanColor)" />
                          <Area type="monotone" dataKey="menaces" stroke="#ef4444" fillOpacity={1} fill="url(#menaceColor)" />
                          <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Graphique circulaire */}
                  <Card className="rounded-3xl shadow-md border-0 overflow-hidden ios-gradient backdrop-blur-sm">
                    <CardContent className="p-3">
                      <h3 className="text-lg font-semibold mb-2">Répartition des scans</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Sains', value: 63, fill: '#22c55e' },
                              { name: 'Menaces', value: 9, fill: '#ef4444' },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={60}
                            innerRadius={45}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          />
                          <Tooltip formatter={(value) => `${value} scans`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-3xl shadow-md border-0 overflow-hidden ios-gradient backdrop-blur-sm">
                  <CardContent className="p-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-sm border-b border-gray-100">
                            <th className="py-2 px-3 font-semibold">Utilisateur</th>
                            <th className="py-2 px-3 font-semibold">Clé USB</th>
                            <th className="py-2 px-3 font-semibold">Statut</th>
                            <th className="py-2 px-3 font-semibold">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="transition-colors active:bg-gray-50 touch-callout-none">
                            <td className="py-2 px-3 text-sm">jane.doe@zenkey.com</td>
                            <td className="py-2 px-3 text-sm">Kingston</td>
                            <td className="py-2 px-3 text-sm"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">✅ Sain</span></td>
                            <td className="py-2 px-3 text-sm">08/04/2025</td>
                          </tr>
                          <tr className="transition-colors active:bg-gray-50 touch-callout-none">
                            <td className="py-2 px-3 text-sm">john.smith@zenkey.com</td>
                            <td className="py-2 px-3 text-sm">Sandisk</td>
                            <td className="py-2 px-3 text-sm"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">⚠️ Infecté</span></td>
                            <td className="py-2 px-3 text-sm">07/04/2025</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {page === "profile" && isAuthenticated && (
              <div className="max-w-md mx-auto space-y-6">
                <Card className="border-0 shadow-md rounded-3xl overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-100 mx-auto rounded-full flex items-center justify-center mb-4">
                        <UserCircle size={40} className="text-blue-500" />
                      </div>
                      <h2 className="text-2xl font-semibold">Bienvenue</h2>
                      <p className="text-blue-600 font-medium bg-blue-50 py-2 px-4 rounded-full inline-block mt-2">
                        {userEmail}
                      </p>
                    </div>

                    <div className="space-y-4 mt-6">
                      <Card className="rounded-2xl border-0 shadow-sm bg-gray-50/80 backdrop-blur-sm p-4">
                        <p className="font-medium text-gray-700 mb-2">Vos statistiques</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-xl shadow-sm">
                            <p className="text-gray-500 text-xs">Scans effectués</p>
                            <p className="text-xl font-bold text-gray-800">8</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl shadow-sm">
                            <p className="text-gray-500 text-xs">Menaces détectées</p>
                            <p className="text-xl font-bold text-gray-800">2</p>
                          </div>
                        </div>
                      </Card>

                      <Button
                        onClick={handleLogout}
                        className={cn(
                          "w-full py-3 rounded-full shadow-md transition-all duration-300",
                          "bg-gradient-to-b from-red-500 to-red-600 text-white",
                          "border border-red-400/50",
                          "active:scale-95 active:shadow-inner",
                          !isTouchDevice && "hover:shadow-lg",
                          "focus:outline-none focus:ring-2 focus:ring-red-400/50"
                        )}
                      >
                        Se déconnecter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div >
  );
}