# ddCLI.ps1 - 主程序文件

# 导入模块
Import-Module "$PSScriptRoot\modules\APIClient.psm1" -Force
Import-Module "$PSScriptRoot\modules\ConfigManager.psm1" -Force

# 主函数
function Invoke-ddCLI {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Command
    )

    try {
        # 加载配置
        $configManager = [ConfigManager]::new()
        $apiConfig = $configManager.GetAPIConfig()

        # 检查API密钥
        if ([string]::IsNullOrWhiteSpace($apiConfig.APIKey)) {
            Write-Error "API key is not configured. Please run 'dd config' to set up your API key."
            return
        }

        # 将命令参数组合成完整的自然语言指令
        $naturalLanguageCommand = $Command -join " "

        if ([string]::IsNullOrWhiteSpace($naturalLanguageCommand)) {
            Write-Error "Please provide a natural language command."
            return
        }

        # 创建API客户端
        $apiClient = [APIClient]::new($apiConfig)

        # 构造提示词
        $prompt = "Convert the following natural language command to a PowerShell command: '$naturalLanguageCommand'. Return only the PowerShell command without any explanation."

        # 发送请求到AI API
        Write-Host "Processing your command..." -ForegroundColor Yellow
        $response = $apiClient.SendRequest($prompt)

        # 检查API响应是否成功
        if (-not $response.Success) {
            switch ($response.ErrorCode) {
                "MISSING_API_KEY" {
                    Write-Error "API key is not configured. Please run 'dd config' to set up your API key."
                }
                "AUTHENTICATION_FAILED" {
                    Write-Error "Authentication failed. Please check your API key."
                }
                "RATE_LIMIT_EXCEEDED" {
                    Write-Error "Rate limit exceeded. Please try again later."
                }
                "NETWORK_ERROR" {
                    Write-Error "Network error occurred. Please check your internet connection and try again."
                }
                default {
                    Write-Error "API request failed: $($response.Error)"
                }
            }
            return
        }

        # 解析响应
        try {
            $powershellCommand = $apiClient.ParseResponse($response)
            Write-Host "Generated command: $powershellCommand" -ForegroundColor Green

            # 安全检查 - 检查危险命令
            if (Test-DangerousCommand $powershellCommand) {
                Write-Host "Warning: This command may be dangerous!" -ForegroundColor Red
                $confirmation = Read-Host "Do you want to execute this command? (yes/no)"
                if ($confirmation -ne "yes" -and $confirmation -ne "y") {
                    Write-Host "Command execution cancelled." -ForegroundColor Yellow
                    return
                }
            }

            # 执行命令
            Write-Host "Executing command..." -ForegroundColor Yellow
            Invoke-Expression $powershellCommand
        }
        catch {
            Write-Error "Failed to process the command: $($_.Exception.Message)"
        }
    }
    catch {
        Write-Error "An unexpected error occurred: $($_.Exception.Message)"
    }
}

# 检查危险命令的函数
function Test-DangerousCommand {
    param(
        [string]$Command
    )

    $dangerousPatterns = @(
        "Remove-Item",
        "rm",
        "del",
        "rmdir",
        "Format-Volume",
        "Stop-Computer",
        "Restart-Computer",
        "Set-ExecutionPolicy"
    )

    foreach ($pattern in $dangerousPatterns) {
        if ($Command -match $pattern) {
            return $true
        }
    }

    return $false
}

# 配置命令
function Invoke-ddConfig {
    param(
        [string]$Option
    )

    try {
        $configManager = [ConfigManager]::new()

        switch ($Option) {
            "show" {
                Write-Host "Current configuration:" -ForegroundColor Green
                $configManager.Config | ConvertTo-Json -Depth 10
            }
            "reset" {
                $confirmation = Read-Host "Are you sure you want to reset the configuration? (yes/no)"
                if ($confirmation -eq "yes" -or $confirmation -eq "y") {
                    $configManager.Config = $configManager.GetDefaultConfig()
                    $configManager.SaveConfig()
                    Write-Host "Configuration has been reset to default." -ForegroundColor Green
                } else {
                    Write-Host "Configuration reset cancelled." -ForegroundColor Yellow
                }
            }
            default {
                Write-Host "Usage: dd config [show|reset]" -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Error "Failed to manage configuration: $($_.Exception.Message)"
    }
}

# 导出函数
Export-ModuleMember -Function Invoke-ddCLI, Invoke-ddConfig