# APIClient.psm1 - API交互模块

class APIClient {
    [hashtable]$Config
    [string]$APIKey
    [string]$BaseURL
    [string]$Model

    APIClient([hashtable]$config) {
        $this.Config = $config
        $this.APIKey = $config.APIKey
        $this.BaseURL = $config.BaseURL
        $this.Model = $config.Model
    }

    # 发送请求到AI API
    [PSCustomObject] SendRequest([string]$prompt) {
        # 检查API密钥
        if ([string]::IsNullOrWhiteSpace($this.APIKey)) {
            return [PSCustomObject]@{
                Success = $false
                Error = "API key is not configured"
                ErrorCode = "MISSING_API_KEY"
            }
        }

        # 这里将实现具体的API调用逻辑
        # 根据不同的API提供者实现不同的请求逻辑
        switch ($this.Config.Provider) {
            "openai" { return $this.SendOpenAIRequest($prompt) }
            "deepseek" { return $this.SendDeepSeekRequest($prompt) }
            default {
                return [PSCustomObject]@{
                    Success = $false
                    Error = "Unsupported API provider: $($this.Config.Provider)"
                    ErrorCode = "UNSUPPORTED_PROVIDER"
                }
            }
        }
    }

    # OpenAI API 请求
    [PSCustomObject] SendOpenAIRequest([string]$prompt) {
        $headers = @{
            "Authorization" = "Bearer $($this.APIKey)"
            "Content-Type" = "application/json"
        }

        $body = @{
            model = $this.Model
            messages = @(
                @{
                    role = "user"
                    content = $prompt
                }
            )
        } | ConvertTo-Json

        try {
            $response = Invoke-RestMethod -Uri "$($this.BaseURL)/chat/completions" -Method Post -Headers $headers -Body $body
            return [PSCustomObject]@{
                Success = $true
                Content = $response.choices[0].message.content
                RawResponse = $response
            }
        }
        catch [System.Net.WebException] {
            $errorDetails = $_.Exception.Response | Get-ErrorDetails
            return [PSCustomObject]@{
                Success = $false
                Error = "Network error: $($_.Exception.Message)"
                ErrorCode = "NETWORK_ERROR"
                RawResponse = $errorDetails
            }
        }
        catch [System.Management.Automation.RuntimeException] {
            if ($_.Exception.Message -like "*401*") {
                return [PSCustomObject]@{
                    Success = $false
                    Error = "Authentication failed. Please check your API key."
                    ErrorCode = "AUTHENTICATION_FAILED"
                }
            } elseif ($_.Exception.Message -like "*429*") {
                return [PSCustomObject]@{
                    Success = $false
                    Error = "Rate limit exceeded. Please try again later."
                    ErrorCode = "RATE_LIMIT_EXCEEDED"
                }
            } else {
                return [PSCustomObject]@{
                    Success = $false
                    Error = "API request failed: $($_.Exception.Message)"
                    ErrorCode = "API_ERROR"
                }
            }
        }
        catch {
            return [PSCustomObject]@{
                Success = $false
                Error = "Unexpected error: $($_.Exception.Message)"
                ErrorCode = "UNEXPECTED_ERROR"
            }
        }
    }

    # DeepSeek API 请求
    [PSCustomObject] SendDeepSeekRequest([string]$prompt) {
        $headers = @{
            "Authorization" = "Bearer $($this.APIKey)"
            "Content-Type" = "application/json"
        }

        $body = @{
            model = $this.Model
            messages = @(
                @{
                    role = "user"
                    content = $prompt
                }
            )
        } | ConvertTo-Json

        try {
            $response = Invoke-RestMethod -Uri "$($this.BaseURL)/chat/completions" -Method Post -Headers $headers -Body $body
            return [PSCustomObject]@{
                Success = $true
                Content = $response.choices[0].message.content
                RawResponse = $response
            }
        }
        catch [System.Net.WebException] {
            $errorDetails = $_.Exception.Response | Get-ErrorDetails
            return [PSCustomObject]@{
                Success = $false
                Error = "Network error: $($_.Exception.Message)"
                ErrorCode = "NETWORK_ERROR"
                RawResponse = $errorDetails
            }
        }
        catch [System.Management.Automation.RuntimeException] {
            if ($_.Exception.Message -like "*401*") {
                return [PSCustomObject]@{
                    Success = $false
                    Error = "Authentication failed. Please check your API key."
                    ErrorCode = "AUTHENTICATION_FAILED"
                }
            } elseif ($_.Exception.Message -like "*429*") {
                return [PSCustomObject]@{
                    Success = $false
                    Error = "Rate limit exceeded. Please try again later."
                    ErrorCode = "RATE_LIMIT_EXCEEDED"
                }
            } else {
                return [PSCustomObject]@{
                    Success = $false
                    Error = "API request failed: $($_.Exception.Message)"
                    ErrorCode = "API_ERROR"
                }
            }
        }
        catch {
            return [PSCustomObject]@{
                Success = $false
                Error = "Unexpected error: $($_.Exception.Message)"
                ErrorCode = "UNEXPECTED_ERROR"
            }
        }
    }

    # 解析API响应
    [string] ParseResponse([PSCustomObject]$response) {
        if ($response.Success) {
            return $response.Content
        } else {
            throw "API request failed: $($response.Error) (Error Code: $($response.ErrorCode))"
        }
    }
}

# 获取错误详情的辅助函数
function Get-ErrorDetails($response) {
    try {
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        return $reader.ReadToEnd()
    } catch {
        return "Unable to retrieve error details"
    }
}

# 导出类和函数
Export-ModuleMember -Class APIClient
Export-ModuleMember -Function Get-ErrorDetails