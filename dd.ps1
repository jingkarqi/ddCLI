# dd.ps1 - ddCLI入口脚本

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

# 检查参数并路由到相应的功能
if ($Args.Count -eq 0) {
    # 没有参数，显示帮助信息
    Show-Help
    return
}

# 获取第一个参数作为命令
$command = $Args[0].ToLower()
$remainingArgs = $Args | Select-Object -Skip 1

switch ($command) {
    "config" {
        Import-Module "$PSScriptRoot\src\ddCLI.ps1" -Force
        if ($remainingArgs.Count -gt 0) {
            Invoke-ddConfig -Option $remainingArgs[0]
        } else {
            Invoke-ddConfig
        }
    }
    "help" {
        Show-Help
    }
    "version" {
        Show-Version
    }
    default {
        # 默认情况下，将所有参数作为自然语言命令处理
        Import-Module "$PSScriptRoot\src\ddCLI.ps1" -Force
        Invoke-ddCLI -Command $Args
    }
}

# 显示帮助信息
function Show-Help {
    Write-Host "ddCLI - AI-Powered Command Line Interface" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  dd <natural language command>     Process a natural language command"
    Write-Host "  dd config [show|reset]           Manage configuration"
    Write-Host "  dd help                          Show this help message"
    Write-Host "  dd version                       Show version information"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  dd list all files in current directory"
    Write-Host "  dd create a new folder named test"
    Write-Host "  dd config show"
    Write-Host ""
    Write-Host "For more information, please refer to the documentation in the .doc folder." -ForegroundColor Cyan
}

# 显示版本信息
function Show-Version {
    Write-Host "ddCLI Version 0.1.0" -ForegroundColor Green
    Write-Host "AI-Powered Command Line Interface" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Copyright (c) 2025 ddCLI Project" -ForegroundColor Yellow
}