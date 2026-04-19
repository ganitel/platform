# 📧 Configuration Gmail pour les Notifications CI/CD

## 🎯 Objectif

Recevoir des emails automatiques à **hansou.business@gmail.com** quand :
- ✅ Le déploiement réussit
- ❌ Les tests ou le déploiement échouent

---

## 📝 Étapes Rapides

### 1. Activer la vérification en 2 étapes sur Gmail

1. Allez sur https://myaccount.google.com/security
2. Recherchez "Validation en deux étapes"
3. Cliquez sur "Activer"
4. Suivez les instructions (SMS ou application d'authentification)

**⚠️ Important :** Sans la vérification en 2 étapes, vous ne pourrez pas créer un mot de passe d'application.

---

### 2. Générer un mot de passe d'application

1. Une fois la 2FA activée, allez sur https://myaccount.google.com/apppasswords
2. Si le lien ne fonctionne pas :
   - Allez sur https://myaccount.google.com/security
   - Cherchez "Mots de passe des applications" (App passwords)
   - Cliquez dessus

3. Sélectionnez :
   - **App** : Mail
   - **Device** : Other (Custom name)
   
4. Nom : `GitHub Actions Ganitel`

5. Cliquez sur "Generate" / "Générer"

6. **Copiez le mot de passe de 16 caractères**
   - Format : `xxxx xxxx xxxx xxxx`
   - Exemple : `abcd efgh ijkl mnop`

---

### 3. Ajouter les secrets dans GitHub

Allez sur votre repo GitHub :
```
https://github.com/hansou237/ganitel-backend/settings/secrets/actions
```

#### Secret 1 : MAIL_USERNAME
```
Valeur : hansou.business@gmail.com
```

#### Secret 2 : MAIL_PASSWORD
```
Valeur : Le mot de passe de 16 caractères (SANS ESPACES)
Exemple : abcdefghijklmnop
```

**⚠️ Attention :** 
- Ne mettez PAS votre mot de passe Gmail habituel
- Utilisez uniquement le mot de passe d'application généré
- Enlevez les espaces du mot de passe

---

## 🧪 Test

Une fois configuré, faites un push sur `develop` :

```bash
git checkout develop
git add .
git commit -m "test: CI/CD notifications"
git push origin develop
```

Vous devriez recevoir un email à **hansou.business@gmail.com** avec :
- ✅ Le résultat du déploiement
- 📝 Les détails du commit
- 🔗 Les liens vers staging

---

## 🔍 Format des emails

### Email de succès ✅
```
Sujet : ✅ Ganitel Staging - Déploiement réussi

Contenu :
- Environnement : Staging
- Branche : develop
- Commit : abc1234
- Auteur : hansou237
- Message du commit
- Liens : Staging, API Docs, Health Check, Workflow
```

### Email d'échec ❌
```
Sujet : ❌ Ganitel Staging - Déploiement échoué

Contenu :
- Statut des tests
- Statut du déploiement
- Détails du commit
- Lien vers les logs
- Actions recommandées
```

---

## 🛠️ Dépannage

### "App passwords is not available"
➜ Vous devez d'abord activer la vérification en 2 étapes

### "Invalid credentials" dans GitHub Actions
➜ Vérifiez que :
- Le mot de passe d'application est correct (sans espaces)
- `MAIL_USERNAME` contient bien l'adresse complète

### Email non reçu après test
➜ Vérifiez :
1. Le workflow s'est bien exécuté (onglet Actions sur GitHub)
2. Les secrets `MAIL_USERNAME` et `MAIL_PASSWORD` sont bien configurés
3. Votre boîte Gmail (regardez aussi dans Spam)

---

## 🔐 Sécurité

✅ **Bonnes pratiques :**
- Le mot de passe d'application est spécifique à GitHub Actions
- Vous pouvez le révoquer à tout moment sur https://myaccount.google.com/apppasswords
- Ne partagez jamais ce mot de passe
- Ne le committez jamais dans Git (il est dans GitHub Secrets)

❌ **Ne JAMAIS :**
- Utiliser votre mot de passe Gmail principal
- Partager le mot de passe d'application
- Committer le mot de passe dans le code

---

## 🎯 Résumé visuel

```
1. Gmail Security Settings
   └── Enable 2FA
       └── App Passwords
           └── Create "GitHub Actions Ganitel"
               └── Copy password (xxxx xxxx xxxx xxxx)

2. GitHub Repository
   └── Settings
       └── Secrets and variables
           └── Actions
               ├── MAIL_USERNAME = hansou.business@gmail.com
               └── MAIL_PASSWORD = xxxxxxxxxxxxxxxx (no spaces)

3. Test
   └── git push origin develop
       └── Check email ✉️
```

---

## 📚 Ressources

- [Google App Passwords Documentation](https://support.google.com/accounts/answer/185833)
- [GitHub Actions Send Mail](https://github.com/dawidd6/action-send-mail)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

---

**Questions ?** Vérifiez les logs GitHub Actions pour plus de détails sur les erreurs d'envoi d'email.
