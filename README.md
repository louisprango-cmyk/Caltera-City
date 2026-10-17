# Caltera City Forum

Eine responsive, pinke Community-Forum-Vorlage für Caltera City Roleplay. Das Layout orientiert sich an der vom Nutzer verlinkten Olymp Roleplay Forum-Seite und dem beigefügten Screenshot: dunkle Kopfzeile, breites Begrüßungsbanner, Aktionsleiste, Forenkategorien und rechte Seitenleiste. Die Live-Referenz war beim letzten Abruf durch eine Cloudflare-Sicherheitsprüfung geschützt. Die Vorlage läuft ohne Build-Schritt und kann direkt als GitHub Pages Website veröffentlicht werden.

## Lokal ansehen

`index.html` im Browser öffnen. Für lokale Entwicklung kannst du z. B. die VS Code Erweiterung **Live Server** verwenden.

## Auf GitHub veröffentlichen

1. Erstelle ein neues Repository auf GitHub.
2. Lade `index.html`, `style.css`, `script.js` und `README.md` aus diesem Ordner in das Repository hoch.
3. Öffne **Settings → Pages**.
4. Wähle bei **Build and deployment** die Option **Deploy from a branch**, dann `main` und `/ (root)` und speichere.
5. Nach dem GitHub-Pages-Deployment ist das Forum unter der angezeigten Pages-Adresse erreichbar.

## Funktionen und Grenzen

- Responsive Startseite mit Kategorien, Beiträgen, Aktivitätskarten und Suchfilter.
- Wähle ein Forum über eine Zeile der Forenliste; danach zeigt der Pfad das gewählte Forum und neue Themen werden dort erstellt, ohne eine Kategorie im Formular auszuwählen. Tags und Organisation sind optional; der Username wird aus dem angemeldeten Konto übernommen.
- Das Standardpräfix lautet „Wartet auf Bearbeitung“. Teammitglieder können beim Erstellen oder im Thema einen anderen Präfix setzen.
- Registrierung und Anmeldung fragen Username, E-Mail und Passwort ab. Der Inhabercode für diese lokale Demo ist `CALTERA-OWNER-7F3K-9Q2M`.
- Die zusätzlichen Themenangaben enthalten eine erforderliche Spieler-ID sowie optionale Organisation und Tags.
- Das Team kann Ränge vergeben: Leiter einer Orga, Moderator, Administrator, Adminleitung oder Inhaber. Inhaber können eigene Ränge mit ausgewählten Rechten anlegen. Teammitglieder können Themen schließen und wieder öffnen; geschlossene Themen sind für Antworten auf Accounts mit Schließrecht beschränkt.
- Spieler können Beiträge anderer über die Themenliste öffnen und beantworten, solange das Thema offen ist. „Alle Themen“ zeigt Beiträge über alle Foren hinweg.
- Beim Präfix „Angenommen“ oder „Abgelehnt“ erhalten der Beitrag und der Verfasser eine passende Auszeichnung.
- Spieler-Einstellungen enthalten Username, Profil-Sichtbarkeit, Erwähnungsbenachrichtigungen und den Inhabercode. Admin-Einstellungen werden als separater Knopf nur bei passenden Rechten angezeigt.
- Beim ersten Besuch wird ein lokaler Gastname mit dem Rang „Spieler“ angelegt. Spieler-Einstellungen sind für alle sichtbar; Team-Einstellungen sind ein separater Knopf, der nur Teamrängen angezeigt wird.
- **Das sind nur lokale Demo-Funktionen, keine echten Sicherheitsrechte.** Konten, Rollen, Themen und Antworten liegen im Browser-Speicher und werden nicht zwischen Besuchern geteilt. Der Inhabercode ist im öffentlichen JavaScript lesbar und darf nicht als echtes Geheimnis verwendet werden. Für echte Konten und geschützte Adminrechte brauchst du ein Backend (z. B. Supabase oder Firebase), Authentifizierung und serverseitige Rollenprüfung.
- Das nächtliche Stadtbild ist als CSS-Grafik gebaut; Google Fonts benötigen Internetzugang, sonst greift eine Systemschrift.
