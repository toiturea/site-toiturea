# Carte de visite NFC Toituréa – mode d'emploi

## Comment ça marche
La carte contient une petite puce NFC **sans pile** (type NTAG213/215/216). Elle contient seulement un lien :

```
https://www.toiturea.fr/carte?src=nfc
```

Quand quelqu'un approche son téléphone de la carte, ce lien s'ouvre et affiche la page **toiturea.fr/carte** :
- **Je partage** : bouton « Enregistrer mon contact » (fiche contact avec logo), Appeler, WhatsApp, SMS, e-mail, site, devis.
- **Je reçois** : formulaire « Échangeons nos coordonnées ». Ce que la personne remplit arrive chez toi par e-mail (Netlify Forms).

Le QR code au dos fait la même chose pour les téléphones sans NFC (`?src=qr`).
Tu peux modifier la page quand tu veux : **la puce n'a jamais besoin d'être reprogrammée**.

## 1. Ce qu'il faut acheter

| Option | Ce qu'il faut | Pour qui |
|---|---|---|
| **A. Clé en main** | Un imprimeur qui fait des « cartes de visite NFC » : tu lui envoies le PDF + le lien ci-dessus | Le plus propre, sans bricolage |
| **B. Fait maison (pas cher)** | Cartes imprimées classiques (PDF fourni, papier épais 400 g+) + **autocollants NFC NTAG213 ou NTAG215, 25 mm** collés au dos | Pour démarrer vite |
| **C. Haut de gamme « artisan »** | Carte en bois (gravée laser chez un graveur local) avec un autocollant NFC incrusté au dos | Pour marquer les esprits, colle au métier de charpentier |

Points importants :
- Puce **NTAG213, 215 ou 216** : les trois marchent (le lien fait moins de 40 caractères).
- **Pas de carte en métal/zinc** avec une puce normale : le métal bloque le NFC. Il faudrait des puces « anti-métal ».
- Achète quelques puces en plus pour tester.

## 2. Programmer la puce (2 minutes, avec ton téléphone)
1. Installe l'appli gratuite **NFC Tools** (iPhone ou Android).
2. Onglet **Écrire** → **Ajouter un enregistrement** → **URL / URI**.
3. Tape : `www.toiturea.fr/carte?src=nfc` (le https est ajouté par l'appli).
4. **Écrire** → approche le téléphone de la carte jusqu'à la confirmation.
5. Teste avec un autre téléphone (iPhone : écran allumé ; Android : NFC activé).
6. Quand tout fonctionne : onglet **Autres** → **Verrouiller le tag** (empêche quelqu'un de modifier ta carte). ⚠️ Définitif : verrouille seulement après test.

## 3. Recevoir les contacts (à faire une fois sur Netlify)
1. Déploie le site (les fichiers `carte.html`, `toiturea.vcf`, `_headers`, `_redirects`).
2. Netlify → ton site → **Forms** → **Enable form detection**, puis redéploie.
3. Le formulaire **echange-carte** apparaît. Va dans **Form notifications** → **Add notification** → **Email notification** → `toiturea.contact@gmail.com`.
4. Teste : ouvre `toiturea.fr/carte`, remplis le formulaire, vérifie que l'e-mail arrive (regarde les spams la première fois).

Chaque contact reçu indique la **source** : `carte-nfc` (puce), `carte-qr` (QR code) ou `carte-lien` (lien partagé). Tu sauras ce qui marche le mieux.
L'offre gratuite de Netlify reçoit 100 formulaires par mois.

## 4. Imprimer la carte
- Fichier : `carte-toiturea-85x55-fond-perdu-3mm.pdf` (page 1 = recto, page 2 = verso).
- Format final 85 × 55 mm, avec 3 mm de fond perdu de chaque côté (91 × 61 mm) : c'est le format demandé par les imprimeurs en ligne.
- Pour modifier le texte : `carte-imprimable.html`.

## Astuce sur le terrain
Sur la page de la carte, le bouton **Afficher le QR code** affiche un grand QR code sur ton propre écran : le client le scanne directement sur ton téléphone, même si tu n'as plus de carte sur toi.
