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

export default function ZenKeyApp() {
  const [page, setPage] = useState("home");
  const [scanStatus, setScanStatus] = useState("idle");
  const [authTab, setAuthTab] = useState("login");
  const [scanProgress, setScanProgress] = useState(0);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Détecter si l'appareil est tactile
  useEffect(() => {
    console.log("Tentative de connexion WebSocket...");
  
    socket.on("connect", () => {
      console.log("✅ Connecté au WebSocket !");
    });
  
    socket.on("status", (data) => {
      console.log("📡 Status :", data.msg);
    });
  
    socket.on("scan_result", (data) => {
      console.log("🧪 Résultat reçu :", data);
  
      if (data.status === "done") {
        const menace = !data.report.includes("Infected files: 0");
        console.log("👉 Analyse terminée, menace détectée ?", menace);
        setScanStatus(menace ? "threat" : "clean");
      } else {
        setScanStatus("idle");
      }
    });
  
    return () => {
      socket.off("connect");
      socket.off("status");
      socket.off("scan_result");
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
    setScanStatus("scanning");
    setScanProgress(0);
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 300);

    // Envoi d'une commande de scan au backend
    socket.emit("analyze");
  };

  // Calculer les paramètres du cercle de progression
  const circleRadius = 95;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (scanProgress / 100) * circumference;

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
                className={getIosButtonStyles(page === "auth")}
                onClick={() => setPage("auth")}
              >
                <UserCircle size={20} className={page === "auth" ? "text-blue-500" : "text-gray-500"} />
                <span className={cn("text-xs", page === "auth" ? "text-blue-500" : "text-gray-500")}>Compte</span>
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

                <div className={cn(
                  "w-64 h-64 mx-auto rounded-full flex items-center justify-center transition-all duration-300 relative",
                  {
                    "bg-blue-50": scanStatus === "idle",
                    "bg-blue-100": scanStatus === "scanning",
                    "bg-green-50": scanStatus === "clean",
                    "bg-red-50": scanStatus === "threat"
                  }
                )}>
                  {/* Cercle de progression SVG optimisé */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 240 240">
                    {/* Effet de lueur d'arrière-plan */}
                    <defs>
                      <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor={
                          scanStatus === "idle" ? "rgba(59, 130, 246, 0.6)" :
                            scanStatus === "scanning" ? "rgba(59, 130, 246, 0.8)" :
                              scanStatus === "clean" ? "rgba(34, 197, 94, 0.6)" :
                                "rgba(239, 68, 68, 0.6)"
                        } />
                        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                      </radialGradient>

                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={
                          scanStatus === "scanning" ? "#3b82f6" :
                            scanStatus === "clean" ? "#10b981" :
                              scanStatus === "threat" ? "#ef4444" : "#3b82f6"
                        } />
                        <stop offset="100%" stopColor={
                          scanStatus === "scanning" ? "#6366f1" :
                            scanStatus === "clean" ? "#22c55e" :
                              scanStatus === "threat" ? "#f87171" : "#6366f1"
                        } />
                      </linearGradient>

                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Effet de lueur */}
                    <circle
                      cx="120"
                      cy="120"
                      r="110"
                      fill="url(#bgGlow)"
                      className="animate-pulse-slow"
                    />

                    {/* Cercle de fond avec effet de profondeur */}
                    <circle
                      cx="120"
                      cy="120"
                      r={circleRadius}
                      className="fill-none stroke-2 opacity-20"
                      style={{
                        stroke: scanStatus === "idle" ? "#93c5fd" :
                          scanStatus === "scanning" ? "#93c5fd" :
                            scanStatus === "clean" ? "#86efac" : "#fca5a5",
                        filter: "drop-shadow(0 0 2px rgba(0, 0, 0, 0.15))"
                      }}
                      strokeWidth="8"
                    />

                    {/* Cercle de progression avec gradient */}
                    {(scanStatus === "scanning" || scanStatus === "clean" || scanStatus === "threat") && (
                      <circle
                        cx="120"
                        cy="120"
                        r={circleRadius}
                        className="fill-none transition-all duration-700 ease-out"
                        stroke="url(#progressGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={scanStatus === "scanning" ? strokeDashoffset : 0}
                        filter="url(#glow)"
                      />
                    )}
                  </svg>

                  {/* Bouton de scan style iOS */}
                  <Button
                    className={cn(
                      "w-40 h-40 rounded-full text-lg transition-all duration-300 z-10",
                      "bg-gradient-to-b from-blue-500 to-blue-600",
                      "border border-blue-400/50",
                      "shadow-lg shadow-blue-300/30",
                      !isTouchDevice && "hover:scale-105 hover:shadow-xl",
                      "active:scale-95 active:shadow-inner active:bg-blue-700",
                      "focus:outline-none focus:ring-4 focus:ring-blue-300/50",
                      isButtonPressed && "ios-button-press",
                      {
                        "bg-gradient-to-b from-blue-500 to-blue-600": scanStatus === "idle",
                        "bg-gradient-to-b from-blue-600 to-blue-700": scanStatus === "scanning",
                        "bg-gradient-to-b from-green-500 to-green-600": scanStatus === "clean",
                        "bg-gradient-to-b from-red-500 to-red-600": scanStatus === "threat"
                      }
                    )}
                    onClick={handleScan}
                    onTouchStart={() => setIsButtonPressed(true)}
                    onTouchEnd={() => setIsButtonPressed(false)}
                    onMouseDown={() => !isTouchDevice && setIsButtonPressed(true)}
                    onMouseUp={() => !isTouchDevice && setIsButtonPressed(false)}
                    onMouseLeave={() => !isTouchDevice && isButtonPressed && setIsButtonPressed(false)}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className={cn(
                        "absolute w-full h-full rounded-full animate-ping",
                        "opacity-30 bg-blue-600",
                        !isButtonPressed && "hidden"
                      )}></div>
                      <div className="flex flex-col items-center justify-center gap-1">
                        {scanStatus === "scanning" && (
                          <span className="text-base font-medium">{scanProgress}%</span>
                        )}
                        <span>Scanner ma clé</span>
                      </div>
                    </div>
                  </Button>
                </div>

                <div className="mt-4">
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
                        <Input className="text-base py-4 rounded-2xl bg-gray-50/80 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" placeholder="Email" type="email" inputMode="email" />
                        <Input className="text-base py-4 rounded-2xl bg-gray-50/80 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" placeholder="Mot de passe" type="password" />
                        <Button
                          className={cn(
                            "w-full py-4 text-base rounded-full shadow-md transition-all duration-300",
                            "bg-gradient-to-b from-blue-500 to-blue-600 text-white",
                            "border border-blue-400/50",
                            "active:scale-95 active:shadow-inner active:from-blue-600 active:to-blue-700",
                            !isTouchDevice && "hover:shadow-lg hover:shadow-blue-300/20",
                            "focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                          )}
                        >
                          Se connecter
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="register">
                    <Card className="border-0 shadow-md rounded-3xl">
                      <CardContent className="p-4 space-y-4">
                        <Input className="text-base py-4 rounded-2xl bg-gray-50/80 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" placeholder="Email" type="email" />
                        <Input className="text-base py-4 rounded-2xl bg-gray-50/80 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" placeholder="Mot de passe" type="password" />
                        <Input className="text-base py-4 rounded-2xl bg-gray-50/80 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" placeholder="Confirmer le mot de passe" type="password" />
                        <Button
                          className={cn(
                            "w-full py-4 text-base rounded-full shadow-md transition-all duration-300",
                            "bg-gradient-to-b from-blue-500 to-blue-600 text-white",
                            "border border-blue-400/50",
                            "active:scale-95 active:shadow-inner active:from-blue-600 active:to-blue-700",
                            !isTouchDevice && "hover:shadow-lg hover:shadow-blue-300/20",
                            "focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                          )}
                        >
                          Créer un compte
                        </Button>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}