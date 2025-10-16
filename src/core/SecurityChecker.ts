import { SecurityCheckResult } from '../types';

export class SecurityChecker {
  private static readonly BLOCKED_COMMANDS = [
    'rm -rf /',
    'rm -rf /*',
    'rm -rf /\\*',
    'sudo rm -rf /',
    ':(){ :|:& };:',
    'fork bomb',
    'format c:',
    'mkfs',
    'dd if=/dev/zero of=/dev/sda',
    'chmod -R 777 /',
    'sudo chmod -R 777 /',
    'rm -rf /etc',
    'rm -rf /bin',
    'rm -rf /usr',
    'rm -rf /var',
    'rm -rf /boot',
    'shutdown -h now',
    'reboot',
    'halt',
    'poweroff',
    'init 0',
    'init 6',
    'Remove-Item -Recurse -Force C:\\',
    'Format-Volume -DriveLetter C',
    'Stop-Computer -Force',
    'Restart-Computer -Force'
  ];

  private static readonly HIGH_RISK_KEYWORDS = [
    'rm -rf',
    'sudo',
    'chmod 777',
    'chmod -R',
    'dd if=',
    'mkfs',
    'format',
    'Remove-Item -Recurse',
    'Remove-Item -Force',
    'Format-Volume',
    'Stop-Computer',
    'Restart-Computer',
    'Set-ExecutionPolicy',
    'Invoke-Expression',
    'Start-Process -Verb RunAs'
  ];

  private static readonly MEDIUM_RISK_KEYWORDS = [
    'rm',
    'mv',
    'chmod',
    'chown',
    'sudo chmod',
    'sudo chown',
    'Remove-Item',
    'Move-Item',
    'Set-Acl',
    'New-Service',
    'Remove-Service',
    'Stop-Service',
    'Start-Service'
  ];

  /**
   * 检查命令的安全性
   */
  static checkCommand(command: string): SecurityCheckResult {
    const trimmedCommand = command.trim().toLowerCase();

    // 检查是否为完全禁止的命令
    for (const blocked of this.BLOCKED_COMMANDS) {
      if (trimmedCommand.includes(blocked.toLowerCase())) {
        return {
          safe: false,
          riskLevel: 'blocked',
          warning: `命令包含被禁止的操作: ${blocked}`,
          requiresConfirmation: false // 被禁止的命令不允许确认
        };
      }
    }

    // 检查高风险命令
    for (const highRisk of this.HIGH_RISK_KEYWORDS) {
      if (trimmedCommand.includes(highRisk.toLowerCase())) {
        return {
          safe: true, // 高风险但允许执行（需要确认）
          riskLevel: 'high',
          warning: `此命令具有高风险，可能会对系统造成不可逆的损害: ${highRisk}`,
          requiresConfirmation: true
        };
      }
    }

    // 检查中等风险命令
    for (const mediumRisk of this.MEDIUM_RISK_KEYWORDS) {
      if (trimmedCommand.includes(mediumRisk.toLowerCase())) {
        return {
          safe: true,
          riskLevel: 'medium',
          warning: `此命令具有中等风险，请仔细检查: ${mediumRisk}`,
          requiresConfirmation: true
        };
      }
    }

    // 检查管道操作符中的危险命令
    if (trimmedCommand.includes('|') || trimmedCommand.includes('&&')) {
      const parts = trimmedCommand.split(/[|&&]/);
      for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart) {
          const partCheck = this.checkCommand(trimmedPart);
          if (partCheck.riskLevel === 'blocked' ||
              (partCheck.riskLevel === 'high' && partCheck.requiresConfirmation)) {
            return partCheck;
          }
        }
      }
    }

    return {
      safe: true,
      riskLevel: 'low',
      requiresConfirmation: false
    };
  }

  /**
   * 检查PowerShell特定的危险命令
   */
  static checkPowerShellCommand(command: string): SecurityCheckResult {
    const result = this.checkCommand(command);

    // PowerShell特定的检查
    const lowerCommand = command.toLowerCase();

    // 检查PowerShell执行策略绕过
    if (lowerCommand.includes('executionpolicy') &&
        (lowerCommand.includes('bypass') || lowerCommand.includes('unrestricted'))) {
      return {
        safe: true,
        riskLevel: 'high',
        warning: '尝试绕过PowerShell执行策略，可能存在安全风险',
        requiresConfirmation: true
      };
    }

    // 检查注册表操作
    if (lowerCommand.includes('reg') &&
        (lowerCommand.includes('delete') || lowerCommand.includes('add'))) {
      return {
        safe: true,
        riskLevel: 'high',
        warning: '注册表操作具有高风险，可能影响系统稳定性',
        requiresConfirmation: true
      };
    }

    return result;
  }

  /**
   * 根据Shell类型选择合适的检查方法
   */
  static checkCommandByShell(command: string, shellType: string = 'bash'): SecurityCheckResult {
    if (shellType === 'powershell') {
      return this.checkPowerShellCommand(command);
    }
    return this.checkCommand(command);
  }

  /**
   * 获取风险级别的中文描述
   */
  static getRiskLevelDescription(riskLevel: SecurityCheckResult['riskLevel']): string {
    switch (riskLevel) {
      case 'low':
        return '低风险';
      case 'medium':
        return '中等风险';
      case 'high':
        return '高风险';
      case 'blocked':
        return '已阻止';
      default:
        return '未知';
    }
  }

  /**
   * 获取安全检查的详细报告
   */
  static getSecurityReport(command: string, shellType: string = 'bash'): string {
    const result = this.checkCommandByShell(command, shellType);
    const riskDesc = this.getRiskLevelDescription(result.riskLevel);

    let report = `安全检查结果: ${riskDesc}\n`;
    report += `命令: ${command}\n`;

    if (result.warning) {
      report += `警告: ${result.warning}\n`;
    }

    report += `需要确认: ${result.requiresConfirmation ? '是' : '否'}\n`;

    return report;
  }
}