#!/bin/sh

SCAN_DIR=${1:-/mnt/f}
LOG_FILE="$SCAN_DIR/scan_report.txt"

echo "🔍 Scanning $SCAN_DIR..."

# 🔁 Vide le rapport avant chaque scan
echo "" > "$LOG_FILE"

clamscan -r --remove=yes --log="$LOG_FILE" "$SCAN_DIR"
echo "✅ Fini."
cat "$LOG_FILE"
