<div align="center">

# 🛠️ Spota – Backend API

[![Node.js](https://img.shields.io/badge/Node.js-v14+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

**Une base robuste, sécurisée et légère pour connecter l'expérience utilisateur**

Ce backend, développé avec Node.js et Express, alimente l'application mobile Spota. Il permet de gérer l'authentification, les utilisateurs et leurs événements favoris, avec une base de données locale en SQLite et des pratiques de sécurité intégrées dès la conception.

</div>

---

## 📋 Table des matières

- [🎯 Objectifs du backend](#-objectifs-du-backend)
- [📚 Fonctionnalités principales](#-fonctionnalités-principales)
- [🏗️ Architecture du projet](#️-architecture-du-projet)
- [🚀 Installation et lancement](#-installation-et-lancement)
- [🔐 Configuration](#-configuration)
- [🌐 Documentation API](#-documentation-api)
- [🧪 Tests manuels](#-tests-manuels)
- [🧠 Stack technique](#-stack-technique)
- [💡 Bonnes pratiques](#-bonnes-pratiques)
- [📖 Contribuer](#-contribuer)

---

## 🎯 Objectifs du backend

- 🔐 **Authentifier** les utilisateurs via JWT de manière sécurisée
- 📦 **Gérer** les favoris liés aux événements sélectionnés
- 🛡️ **Sécuriser** les échanges grâce à du middleware et des validations
- ⚙️ **Structurer** un backend simple, lisible et extensible

---

## 📚 Fonctionnalités principales

| Fonctionnalité | Description |
|---|---|
| 👥 **Auth complète** | Inscription, connexion, suppression de compte |
| ❤️ **Favoris** | Ajouter, lister et supprimer ses événements favoris |
| 🛡️ **Sécurité intégrée** | Helmet, bcrypt, JWT, validation des entrées |
| 🧩 **Middleware personnalisé** | Vérification JWT, contrôle des données |
| 🏥 **Health check API** | Vérifie que le serveur fonctionne correctement |

---

## 🏗️ Architecture du projet

```
backend/
├── server.js               # Point d'entrée du serveur Express
├── config/                 # Configuration base SQLite
│   └── database.js
├── models/                 # Modèles de données
│   ├── User.js
│   └── Favorite.js
├── controllers/            # Logique métier
│   ├── authController.js
│   └── favoritesController.js
├── routes/                 # Routes API REST
│   ├── auth.js
│   └── favorites.js
├── middleware/             # Middlewares de sécurité et validation
│   ├── auth.js
│   ├── validation.js
│   └── security.js
└── database.sqlite         # Base de données SQLite (auto-générée)
```

---

## 🚀 Installation et lancement

### ✅ Prérequis

- **Node.js** v14 ou supérieur
- **npm** ou **yarn**

### 🛠️ Étapes d'installation

```bash
# 1️⃣ Accéder au dossier backend
cd backend

# 2️⃣ Installer les dépendances
npm install

# 3️⃣ Lancer le serveur en mode développement
npm run dev
```

> 👉 Le serveur tourne par défaut sur **http://localhost:5001**

---

## 🔐 Configuration

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
PORT=5001
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🌐 Documentation API

### 🔑 Authentification

| Route | Méthode | Description |
|---|---|---|
| `/api/auth/register` | `POST` | Créer un nouveau compte |
| `/api/auth/login` | `POST` | Se connecter et recevoir un token |
| `/api/auth/delete-account` | `DELETE` | Supprimer son compte |

### ❤️ Favoris

| Route | Méthode | Description |
|---|---|---|
| `/api/favorites` | `GET` | Lister ses événements favoris |
| `/api/favorites` | `POST` | Ajouter un favori |
| `/api/favorites/:eventId` | `DELETE` | Supprimer un favori |

### 🏥 Monitoring

| Route | Méthode | Description |
|---|---|---|
| `/health` | `GET` | Vérifie que le serveur fonctionne |

---

## 🧪 Tests manuels

### Health Check
```bash
curl http://localhost:5001/health
```

### Inscription d'un utilisateur
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@mail.com",
    "password": "123456",
    "confirmPassword": "123456"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@mail.com",
    "password": "123456"
  }'
```

---

## 🧠 Stack technique

| Technologie | Rôle | Version |
|---|---|---|
| **Node.js** | Serveur JavaScript | v14+ |
| **Express.js** | Framework HTTP minimaliste | 4.x |
| **SQLite** | Base de données légère, locale | 3.x |
| **JWT** | Authentification sécurisée par token | - |
| **Bcrypt** | Hachage de mot de passe | - |
| **Helmet** | Sécurité HTTP (headers) | - |
| **Express-rate-limit** | Protection anti-spam | - |
| **CORS** | Communication frontend ↔ backend | - |

---

## 💡 Bonnes pratiques intégrées

- 🔒 **Authentification sécurisée** (JWT + bcrypt)
- 🧱 **Architecture MVC claire** et modulaire
- 🧼 **Validation des données** (sanitisation incluse)
- 🔁 **Logs serveur** + health route de monitoring
- ⚡ **Création automatique** de la base au démarrage
- 🛡️ **Middleware de sécurité** complet
- 📝 **Gestion d'erreurs** centralisée

---

