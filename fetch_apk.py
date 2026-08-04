import urllib.request, json, time, sys, os, io, zipfile, shutil, subprocess

import os
TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO = "zhuliliui/college-workbench"
OUTDIR = r"D:\buddycode\college-workbench"
OUT = os.path.join(OUTDIR, "app-debug.apk")
TMP = os.path.join(OUTDIR, "apk_tmp")

def api(path):
    url = "https://api.github.com" + path
    req = urllib.request.Request(url, headers={
        "Authorization": "Bearer " + TOKEN,
        "Accept": "application/vnd.github+json",
        "User-Agent": "apk-fetch"})
    return urllib.request.urlopen(req, timeout=60)

# 找到 android-build 分支最新一次 run
data = json.load(api("/repos/%s/actions/runs?branch=android-build&per_page=1" % REPO))
run_id = data["workflow_runs"][0]["id"]
print("RUN_ID", run_id, flush=True)

status = ""; conclusion = ""
for i in range(50):
    d = json.load(api("/repos/%s/actions/runs/%d" % (REPO, run_id)))
    status = d["status"]; conclusion = d.get("conclusion")
    print("poll %d: %s %s" % (i, status, conclusion), flush=True)
    if status == "completed":
        break
    time.sleep(12)

if conclusion != "success":
    print("BUILD_NOT_SUCCESS", status, conclusion, flush=True)
    try:
        jd = json.load(api("/repos/%s/actions/runs/%d/jobs?per_page=50" % (REPO, run_id)))
        for j in jd["jobs"]:
            print("JOB", j["name"], j.get("conclusion"), flush=True)
            for step in j.get("steps", []):
                if step.get("conclusion") in ("failure", "cancelled"):
                    print("  FAIL_STEP", step["name"], step.get("number"), flush=True)
    except Exception as e:
        print("jobs err", e, flush=True)
    sys.exit(2)

ad = json.load(api("/repos/%s/actions/runs/%d/artifacts" % (REPO, run_id)))
art_id = ad["artifacts"][0]["id"]
print("ART_ID", art_id, flush=True)

# 取临时下载地址（GitHub 返回 302 到 Azure blob；token 不能带去 blob，否则 401）
# 用 -I HEAD 请求拿 Location，避免 body 写入问题
hdr = subprocess.check_output(
    ["curl", "-sI", "-H", "Authorization: Bearer " + TOKEN,
     "https://api.github.com/repos/%s/actions/artifacts/%d/zip" % (REPO, art_id)],
    timeout=60).decode("utf-8", "ignore")
loc = ""
for line in hdr.splitlines():
    if line.lower().startswith("location:"):
        loc = line.split(":", 1)[1].strip()
        break
print("REDIRECT", (loc[:90] if loc else None), flush=True)
if not loc:
    print("NO_LOCATION", flush=True)
    sys.exit(4)

# blob 用 curl 直接下，不带 token（且 -k 规避部分环境 blob 证书过期）
# artifact 是 zip 包，大文件容易中断，用断点续传 + 重试
zip_path = os.path.join(OUTDIR, "apk_dl.zip")
for attempt in range(3):
    print("DOWNLOAD_ATTEMPT", attempt, flush=True)
    subprocess.run(["curl", "-C", "-", "-sL", "-k", "--retry", "5", "--retry-delay", "3", loc, "-o", zip_path], check=True)
    if os.path.getsize(zip_path) > 1024 * 1024:
        break
    time.sleep(2)
with open(os.path.join(OUTDIR, "apk_dl.zip"), "rb") as f:
    raw = f.read()
print("ZIP_BYTES", len(raw), flush=True)

if os.path.isdir(TMP):
    shutil.rmtree(TMP)
os.makedirs(TMP, exist_ok=True)
z = zipfile.ZipFile(io.BytesIO(raw))
print("ZIP_NAMES", z.namelist(), flush=True)
z.extractall(TMP)

apk = None
for root, _, files in os.walk(TMP):
    for f in files:
        if f == "app-debug.apk":
            apk = os.path.join(root, f)
            break
    if apk:
        break

if not apk:
    print("NO_APK_FOUND", flush=True)
    sys.exit(3)

shutil.copy(apk, OUT)
print("APK_SAVED", OUT, os.path.getsize(OUT), flush=True)
