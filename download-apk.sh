#!/bin/bash
set -e
REPO="zhuliliui/college-workbench"
TOKEN="$GH_TOKEN"
API="https://api.github.com/repos/$REPO"
OUT="/d/buddycode/college-workbench/app-debug.apk"

json_get() { node -e "let d=JSON.parse(require('fs').readFileSync(0,'utf8')); ${1}"; }

echo "polling workflow run on android-build..."
run_id=""
status=""
for i in $(seq 1 40); do
  resp=$(curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" "$API/actions/runs?branch=android-build&per_page=1")
  run_id=$(printf '%s' "$resp" | json_get "console.log(d.workflow_runs[0]?.id||'')")
  status=$(printf '%s' "$resp" | json_get "console.log(d.workflow_runs[0]?.status||'')")
  echo "attempt $i: run=$run_id status=$status"
  if [ "$status" = "completed" ]; then break; fi
  sleep 15
done

concl=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/actions/runs/$run_id" | json_get "console.log(d.conclusion||'')")
echo "conclusion=$concl"
if [ "$concl" != "success" ]; then echo "BUILD NOT SUCCESS ($concl)"; exit 2; fi

art_id=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/actions/runs/$run_id/artifacts" | json_get "console.log(d.artifacts[0]?.id||'')")
echo "artifact=$art_id"

# GitHub artifact zip: API returns 302 to Azure blob; download blob WITHOUT auth header
loc=$(curl -s -o /dev/null -D - -H "Authorization: Bearer $TOKEN" "$API/actions/artifacts/$art_id/zip" | grep -i '^location:' | tr -d '\r\n' | awk '{print $2}')
echo "blob=$loc"

curl -sL -o "$OUT" "$loc"
echo "DOWNLOADED $(wc -c < "$OUT") bytes -> $OUT"
