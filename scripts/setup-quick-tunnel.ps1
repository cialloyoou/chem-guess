param(
  [string]$CloudflaredExe = "D:\guess\cloudflared-windows-amd64.exe",
  [string]$ProjectRoot = "d:\guess\anime-character-guessr-main",
  [string]$PagesProjectName = "chem-guess",
  [int]$ServerPort = 3000
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg){ Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg){ Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host "[ERR]  $msg" -ForegroundColor Red }

Write-Info "Checking cloudflared executable at $CloudflaredExe"
if (!(Test-Path $CloudflaredExe)) {
  Write-Err "cloudflared not found at $CloudflaredExe. Edit the script param -CloudflaredExe."
  exit 1
}

# 1) Start backend server if not running
$serverDir = Join-Path $ProjectRoot 'server'
$serverJs = Join-Path $serverDir 'server.js'
Write-Info "Ensuring backend server is running: $serverJs"

$nodeProc = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path -like '*node*' }
$serverRunning = $false
if ($nodeProc) {
  foreach($p in $nodeProc){
    try {
      $cmdline = (Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)").CommandLine
      if ($cmdline -match [regex]::Escape($serverJs)) { $serverRunning = $true; break }
    } catch {}
  }
}

if (-not $serverRunning) {
  Write-Info "Starting backend server on http://localhost:$ServerPort"
  Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $serverDir -WindowStyle Minimized
  Start-Sleep -Seconds 2
}

# 2) Start Quick Tunnel and capture URL
$logDir = Join-Path $env:TEMP 'cloudflared-logs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$logFile = Join-Path $logDir ('quick-tunnel-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')

Write-Info "Starting cloudflared Quick Tunnel; logging to $logFile"
$cfArgs = "tunnel --url http://localhost:$ServerPort"
# Note: Start-Process cannot redirect stdout and stderr to the same file
$errFile = $logFile -replace '\\.log$','-err.log'
Start-Process -FilePath $CloudflaredExe -ArgumentList $cfArgs -RedirectStandardOutput $logFile -RedirectStandardError $errFile -WindowStyle Minimized

# Wait for URL to appear in log
$apiUrl = $null
Write-Info "Waiting for trycloudflare URL to be issued..."
for ($i=0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 2
  if (Test-Path $logFile) {
    $content = Get-Content -Path $logFile -Raw
    $m = [regex]::Match($content, 'https://[a-z0-9\-]+\.trycloudflare\.com')
    if ($m.Success) { $apiUrl = $m.Value; break }
  }
}

if (-not $apiUrl) {
  Write-Err "Could not detect trycloudflare URL from cloudflared logs. Check $logFile"
  exit 2
}
Write-Ok "Cloudflared issued URL: $apiUrl"

# 3) Write client/.env.production
$clientDir = Join-Path $ProjectRoot 'client'
$envFile = Join-Path $clientDir '.env.production'
"VITE_SERVER_URL=$apiUrl" | Out-File -FilePath $envFile -Encoding UTF8
Write-Ok "Wrote $envFile with VITE_SERVER_URL=$apiUrl"

# 4) Build front-end
Write-Info "Building front-end with Vite"
$build = Start-Process -FilePath "npm" -ArgumentList "run build" -WorkingDirectory $clientDir -NoNewWindow -PassThru -Wait
if ($build.ExitCode -ne 0) { Write-Err "npm run build failed with code $($build.ExitCode)"; exit 3 }
Write-Ok "Front-end build completed"

# 5) Deploy to Cloudflare Pages
Write-Info "Deploying to Cloudflare Pages project $PagesProjectName"
$deploy = Start-Process -FilePath "wrangler" -ArgumentList "pages deploy dist --project-name $PagesProjectName" -WorkingDirectory $clientDir -NoNewWindow -PassThru -Wait
if ($deploy.ExitCode -ne 0) { Write-Err "wrangler pages deploy failed with code $($deploy.ExitCode)"; exit 4 }
Write-Ok "Deployment triggered. Visit your Pages domain to verify."

Write-Host ""; Write-Ok "SUMMARY"
Write-Host " API base URL  : $apiUrl" -ForegroundColor White
Write-Host " Front-end URL : https://$PagesProjectName.pages.dev (or the preview URL Wrangler outputs)" -ForegroundColor White

