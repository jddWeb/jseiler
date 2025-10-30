#!/bin/zsh

SRC="Resources/Private/Scss/main.scss"
DEST="Resources/Public/Css/main.css"

cd "$(dirname "$0")"

if ! command -v sass &>/dev/null; then
  echo "Fehler: Sass ist nicht installiert. Installiere es mit:"
  echo "brew install sass/sass/sass"
  exit 1
fi

echo "Beobachte Änderungen an $SRC ..."

sass --watch "$SRC":"$DEST" --style=compressed