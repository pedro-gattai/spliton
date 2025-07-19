Write-Host "🚀 Starting Spliton Development Environment"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
}

$nodeVersionString = node -v
$nodeMajorVersion = [int]($nodeVersionString -replace '[^0-9\.]', '').Split('.')[0]

if ($nodeMajorVersion -lt 18) {
    Write-Host "❌ Node.js version must be >= 18.0.0. Current version: $nodeVersionString"
    exit 1
}

Write-Host "✅ Node.js version: $nodeVersionString"

$frontendModulesExist = Test-Path "frontend/node_modules"
$backendModulesExist = Test-Path "backend/node_modules"

if (-not $frontendModulesExist -or -not $backendModulesExist) {
    Write-Host "📦 Installing dependencies..."
    npm run install:all
}

Write-Host "🔥 Starting frontend and backend servers..."
npm run dev
