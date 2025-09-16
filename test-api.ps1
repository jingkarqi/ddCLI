# test-api.ps1 - API交互功能测试脚本

# 导入模块
Import-Module "$PSScriptRoot\src\modules\APIClient.psm1" -Force
Import-Module "$PSScriptRoot\src\modules\ConfigManager.psm1" -Force

Write-Host "Starting API interaction tests..." -ForegroundColor Green

# 测试配置管理
Write-Host "`n1. Testing configuration management..." -ForegroundColor Yellow
$configManager = [ConfigManager]::new()
$apiConfig = $configManager.GetAPIConfig()
Write-Host "Current API provider: $($apiConfig.Provider)" -ForegroundColor Cyan
Write-Host "Current model: $($apiConfig.Model)" -ForegroundColor Cyan

# 测试API客户端创建
Write-Host "`n2. Testing API client creation..." -ForegroundColor Yellow
try {
    $apiClient = [APIClient]::new($apiConfig)
    Write-Host "API client created successfully" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to create API client: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试API请求（使用示例提示）
Write-Host "`n3. Testing API request..." -ForegroundColor Yellow
if ([string]::IsNullOrWhiteSpace($apiConfig.APIKey)) {
    Write-Host "Skipping API request test - no API key configured" -ForegroundColor Yellow
    Write-Host "To test API requests, please configure your API key using 'dd config'" -ForegroundColor Cyan
} else {
    $prompt = "Convert the following natural language command to a PowerShell command: 'list all files in current directory'. Return only the PowerShell command without any explanation."

    try {
        $response = $apiClient.SendRequest($prompt)
        if ($response.Success) {
            Write-Host "API request successful" -ForegroundColor Cyan
            $command = $apiClient.ParseResponse($response)
            Write-Host "Generated command: $command" -ForegroundColor Cyan
        } else {
            Write-Host "API request failed: $($response.Error) (Error Code: $($response.ErrorCode))" -ForegroundColor Red
        }
    } catch {
        Write-Host "Error during API request test: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nAPI interaction tests completed." -ForegroundColor Green