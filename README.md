# Station Blanche USB ZenKey

Une solution moderne et sécurisée pour l'analyse antivirus des clés USB, utilisant React Router pour l'interface et ClamAV pour la détection des menaces.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/mehdidch59/zenkey/tree/main/default)

## Fonctionnalités

- 🔍 Analyse antivirus des clés USB via ClamAV
- 🚀 Interface web réactive avec React Router
- 🔄 Détection automatique des clés USB
- 📊 Suivi en temps réel de la progression des analyses
- 🔒 Authentification des utilisateurs
- 📝 Rapports détaillés des menaces détectées
- 💾 Suppression automatique des fichiers infectés
- 🎨 Interface utilisateur moderne avec TailwindCSS
- 📱 Interface tactile adaptée pour écrans tactiles

## Prérequis

- Docker et Docker Compose
- Node.js 18+ et npm
- Windows avec WSL2 (Windows Subsystem for Linux) ou un système Linux natif
- Support pour la détection de périphériques USB

## Installation

1. Clonez le dépôt :

```bash
git clone https://github.com/mehdidch59/zenkey.git
cd zenkey
```

2. Installez les dépendances :

```bash
npm install
```

3. Construisez l'image Docker ClamAV :

```bash
cd Back/clamav-scan
docker build -t clamav-scan .
cd ../..
```

## Configuration pour WSL

Ce projet a été initialement conçu pour fonctionner sous WSL (Windows Subsystem for Linux). Pour l'utiliser correctement :

1. Montez manuellement votre clé USB dans WSL :

```bash
# Identifiez votre clé USB sous Windows (ex: D:)
# Puis montez-la dans WSL
sudo mkdir -p /mnt/usb
sudo mount -t drvfs D: /mnt/usb
```

2. Modifiez l'adresse IP du backend :

Ouvrez le fichier `app/routes/home.tsx` et modifiez la configuration du socket pour pointer vers votre adresse IP locale WSL ou utilisez localhost :

```javascript
// Remplacez ceci
const socket = io("adresse_ip_actuelle:5000");

// Par ceci pour localhost
const socket = io("localhost:5000");
// ou par votre adresse IP WSL
const socket = io("192.168.x.x:5000");
```

## Configuration pour Linux natif

Si vous utilisez un système Linux natif, vous pouvez automatiser le montage des clés USB :

1. Installez udev et créez une règle pour monter automatiquement les clés USB :

```bash
sudo apt install udev
```

2. Créez un fichier de règle udev :

```bash
sudo nano /etc/udev/rules.d/99-usb-mount.rules
```

3. Ajoutez la règle suivante :

```
ACTION=="add", SUBSYSTEM=="block", ENV{DEVTYPE}=="partition", RUN+="/bin/mount -o umask=000 %E{DEVNAME} /mnt/usb"
```

4. Rechargez les règles udev :

```bash
sudo udevadm control --reload-rules
```

## Démarrage

1. Lancez le backend :

```bash
cd Back/usb-scan-backend
node index.js
```

2. Dans un autre terminal, lancez le frontend :

```bash
npm run dev
```

3. Accédez à l'application via `http://localhost:5173` ou via l'adresse IP de votre machine sur le réseau local pour y accéder depuis un appareil tactile.

## Utilisation

1. **Connexion** : Créez un compte ou connectez-vous avec vos identifiants.
2. **Insertion de clé USB** : 
   - Sous WSL : Montez manuellement la clé comme indiqué ci-dessus.
   - Sous Linux : La clé sera détectée automatiquement si les règles udev sont configurées.
3. **Analyse** : Cliquez/touchez le bouton d'analyse pour lancer la recherche de virus avec ClamAV.
4. **Résultats** : Consultez les résultats de l'analyse, avec la liste des fichiers infectés et les menaces détectées.
5. **Suppression** : Les fichiers infectés sont automatiquement supprimés (comportement configurable).

## Interface tactile

L'interface est optimisée pour une utilisation tactile, idéale pour les écrans tactiles ou kiosques interactifs. Tous les boutons et contrôles sont dimensionnés pour être facilement manipulables au doigt.

## Fonctionnement technique

- **Backend** : Node.js avec Express et Socket.io pour la communication en temps réel
- **Analyse antivirus** : Conteneur Docker ClamAV exécutant `clamscan` sur le répertoire monté
- **Détection USB** : Vérification périodique du point de montage `/mnt/usb`
- **Interface** : React avec React Router et TailwindCSS

## Déploiement en production

Créez une build de production :

```bash
npm run build
```

Vous pouvez déployer l'application sur n'importe quelle plateforme supportant Docker et Node.js.

### Déploiement Docker

```bash
docker build -t zenkey .
```

## Sécurité

Cette application est conçue pour être utilisée dans un environnement contrôlé. Assurez-vous que seuls les utilisateurs autorisés ont accès à l'interface d'administration.

---

Développé avec ❤️ pour renforcer la sécurité informatique.
