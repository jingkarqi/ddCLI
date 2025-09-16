# ConfigManager.psm1 - 配置管理模块

class ConfigManager {
    [string]$ConfigPath
    [hashtable]$Config

    ConfigManager() {
        $this.ConfigPath = "$env:USERPROFILE\.ddcli\config.json"
        $this.Config = $this.LoadConfig()
    }

    # 加载配置
    [hashtable] LoadConfig() {
        if (Test-Path $this.ConfigPath) {
            try {
                $configContent = Get-Content $this.ConfigPath -Raw
                return $configContent | ConvertFrom-Json -AsHashtable
            }
            catch {
                Write-Warning "Failed to load config file, using default configuration."
                return $this.GetDefaultConfig()
            }
        } else {
            return $this.GetDefaultConfig()
        }
    }

    # 获取默认配置
    [hashtable] GetDefaultConfig() {
        return @{
            Provider = "openai"
            APIKey = ""
            BaseURL = "https://api.openai.com/v1"
            Model = "gpt-3.5-turbo"
            Security = @{
                ConfirmDangerousCommands = $true
                CommandWhitelist = @()
            }
        }
    }

    # 保存配置
    [void] SaveConfig() {
        # 确保配置目录存在
        $configDir = Split-Path $this.ConfigPath -Parent
        if (!(Test-Path $configDir)) {
            New-Item -ItemType Directory -Path $configDir | Out-Null
        }

        # 保存配置文件
        $this.Config | ConvertTo-Json -Depth 10 | Set-Content $this.ConfigPath
    }

    # 获取API配置
    [hashtable] GetAPIConfig() {
        return @{
            Provider = $this.Config.Provider
            APIKey = $this.Config.APIKey
            BaseURL = $this.Config.BaseURL
            Model = $this.Config.Model
        }
    }

    # 设置API密钥
    [void] SetAPIKey([string]$apiKey) {
        $this.Config.APIKey = $apiKey
        $this.SaveConfig()
    }

    # 设置API提供者
    [void] SetProvider([string]$provider) {
        $this.Config.Provider = $provider
        $this.SaveConfig()
    }

    # 设置模型
    [void] SetModel([string]$model) {
        $this.Config.Model = $model
        $this.SaveConfig()
    }
}

# 导出类
Export-ModuleMember -Class ConfigManager