#!/bin/bash
set -e
cd "$(dirname "$0")"
REPO_DIR="$(pwd)"
REPO="zhuliliui/college-workbench"
TOKEN="$GH_TOKEN"
API="https://api.github.com/repos/$REPO"
OUT="$REPO_DIR/app-debug.apk"
HEAD="$(git rev-parse HEAD)"

json_get() { node -e "let d=JSON.parse(require('fs').readFileSync(0,'utf8')); ${1}"; }

echo "repo=$REPO_DIR head=$HEAD"
echo "waiting for workflow run with our head_sha ..."
run_id=""
status=""
for i in $(seq 1 48); do
  resp=$(curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" "$API/actions/runs?branch=android-build&per_page=20")
  run_id=$(printf '%s' "$resp" | json_get "const r=(d.workflow_runs||[]).find(x=>x.head_sha==='$HEAD'); console.log(r?r.id:'');")
  status=$(printf '%s' "$resp" | json_get "const r=(d.workflow_runs||[]).find(x=>x.head_sha==='$HEAD'); console.log(r?r.status:'');")
  echo "attempt $i: run=$run_id status=$status"
  if [ -n "$run_id" ] && [ "$status" = "completed" ]; then break; fi
  sleep 15
done

if [ -z "$run_id" ]; then echo "NO RUN FOUND for head_sha"; exit 3; fi

concl=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/actions/runs/$run_id" | json_get "console.log(d.conclusion||'')")
echo "conclusion=$concl"
if [ "$concl" != "success" ]; then echo "BUILD NOT SUCCESS ($concl)"; exit 2; fi

art_id=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/actions/runs/$run_id/artifacts" | json_get "console.log((d.artifacts||[])[0]?.id||'')")
echo "artifact=$art_id"

loc=$(curl -s -o /dev/null -D - -H "Authorization: Bearer $TOKEN" "$API/actions/artifacts/$art_id/zip" | grep -i '^location:' | tr -d '\r\n' | awk '{print $2}')
echo "blob=${loc:0:60}..."

curl -sL -o "$OUT" "$loc"
echo "DOWNLOADED $(wc -c < "$OUT") bytes -> $OUT"
