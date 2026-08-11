#!/bin/bash
cd /d/buddycode/college-workbench
TOK=$(git remote get-url github | sed -E 's#https://[^:]+:([^@]+)@.*#\1#')
API="https://api.github.com/repos/zhuliliui/college-workbench"
RUN="31505538917"
echo "[wait] run=$RUN"
for i in $(seq 1 45); do
  sleep 20
  ST=$(curl -sSL --retry 8 --retry-all-errors --retry-delay 3 --tlsv1.2 --http1.1 -H "Authorization: Bearer $TOK" -H "Accept: application/vnd.github+json" "$API/actions/runs/$RUN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);console.log((j.status||'?')+' '+(j.conclusion||''));}catch(e){console.log('ERR');}})")
  echo "[$i] $ST"
  case "$ST" in
    completed\ success*) break ;;
    completed\ failure*|completed\ cancelled*|completed\ timed_out*) echo "BUILD FAILED"; exit 1 ;;
  esac
done
ART=$(curl -sSL --retry 8 --retry-all-errors --retry-delay 3 --tlsv1.2 --http1.1 -H "Authorization: Bearer $TOK" -H "Accept: application/vnd.github+json" "$API/actions/runs/$RUN/artifacts")
AID=$(echo "$ART" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);const a=(j.artifacts||[])[0];if(a)console.log(a.id);}catch(e){}})")
[ -z "$AID" ] && { echo "NO ARTIFACT"; exit 1; }
LOC=$(curl -sSI --retry 8 --retry-all-errors --retry-delay 3 --tlsv1.2 --http1.1 -H "Authorization: Bearer $TOK" -H "Accept: application/vnd.github+json" "$API/actions/artifacts/$AID/zip" | tr -d '\r' | grep -i '^location:' | cut -d' ' -f2-)
curl -sSL --retry 6 --retry-all-errors --retry-delay 3 "$LOC" -o apk-artifact.zip
rm -rf apk-extract && mkdir -p apk-extract && cd apk-extract && unzip -o ../apk-artifact.zip >/dev/null 2>&1
cp *.apk ../app-debug.apk 2>/dev/null && echo "DONE -> app-debug.apk ($(ls -la ../app-debug.apk | awk '{print $5}') bytes)"
cd .. && rm -rf apk-extract apk-artifact.zip
