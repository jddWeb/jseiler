#!/bin/zsh
# ======================================================
# Sass Watch Script für TYPO3-Sitepackage
# Kompiliert main.scss -> main.css mit modernem Dart Sass
# ======================================================

SRC="Resources/Private/Scss/main.scss"
DEST="Resources/Public/Css/main.css"
INCLUDE="Resources/Private/Scss"

cd "$(dirname "$0")"

# Prüfen, ob Sass installiert ist
if ! command -v sass &>/dev/null; then
  echo "❌  Fehler: Sass ist nicht installiert."
  echo "👉  Installiere es mit: brew install sass/sass/sass"
  exit 1
fi

echo "👀  Beobachte Änderungen an $SRC ..."
echo "💾  Ausgabe: $DEST"
echo "📦  Include-Pfad: $INCLUDE"

# Sass-Watch starten
sass --watch \
  "$SRC":"$DEST" \
  --style=compressed \
  --load-path="$INCLUDE" \
  --no-error-css
