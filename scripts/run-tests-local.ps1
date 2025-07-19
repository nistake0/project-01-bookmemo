# ローカルテスト実行スクリプト
# PowerShell用

Write-Host "=== BookMemo App Local Test Execution ===" -ForegroundColor Green

# 1. 依存関係の確認
Write-Host "`n1. Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Running npm install..." -ForegroundColor Red
    npm install
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# 2. Firebase設定の確認
Write-Host "`n2. Checking Firebase configuration..." -ForegroundColor Yellow
if (-not (Test-Path "serviceAccountKey.json")) {
    Write-Host "⚠️  serviceAccountKey.json not found" -ForegroundColor Red
    Write-Host "Please place Firebase service account key in project root" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✓ Firebase configuration file confirmed" -ForegroundColor Green
}

# 3. テスト用ユーザーの設定
Write-Host "`n3. Setting up test user..." -ForegroundColor Yellow
npm run test:setup

# 4. テスト実行オプションの表示
Write-Host "`n4. Test execution options:" -ForegroundColor Cyan
Write-Host "   npm run test:unit    - Unit tests only" -ForegroundColor White
Write-Host "   npm run test:e2e     - E2E tests only" -ForegroundColor White
Write-Host "   npm run test:all     - All tests" -ForegroundColor White
Write-Host "   npm run test:e2e:open - E2E tests (GUI mode)" -ForegroundColor White

Write-Host "`n=== Ready ===" -ForegroundColor Green
Write-Host "Please run the above commands to execute tests." -ForegroundColor Cyan 