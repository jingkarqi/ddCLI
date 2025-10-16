import { SecurityChecker } from '../src/core/SecurityChecker';

describe('SecurityChecker', () => {
  describe('checkCommand', () => {
    it('should block dangerous commands', () => {
      const dangerousCommands = [
        'rm -rf /',
        'sudo rm -rf /',
        ':(){ :|:& };:',
        'format c:',
        'Remove-Item -Recurse -Force C:\\'
      ];

      dangerousCommands.forEach(command => {
        const result = SecurityChecker.checkCommand(command);
        expect(result.riskLevel).toBe('blocked');
        expect(result.safe).toBe(false);
        expect(result.requiresConfirmation).toBe(false);
      });
    });

    it('should mark medium risk commands as requiring confirmation', () => {
      const mediumRiskCommands = [
        'rm file.txt',
        'mv file.txt new.txt',
        'chmod +x script.sh',
        'Remove-Item file.txt'
      ];

      mediumRiskCommands.forEach(command => {
        const result = SecurityChecker.checkCommand(command);
        expect(result.riskLevel).toBe('medium');
        expect(result.safe).toBe(true);
        expect(result.requiresConfirmation).toBe(true);
      });
    });

    it('should mark safe commands as low risk', () => {
      const safeCommands = [
        'ls -la',
        'echo hello',
        'pwd',
        'Get-ChildItem'
      ];

      safeCommands.forEach(command => {
        const result = SecurityChecker.checkCommand(command);
        expect(result.riskLevel).toBe('low');
        expect(result.safe).toBe(true);
        expect(result.requiresConfirmation).toBe(false);
      });
    });

    it('should mark safe commands as low risk', () => {
      const safeCommands = [
        'ls -la',
        'echo hello',
        'pwd',
        'Get-ChildItem'
      ];

      safeCommands.forEach(command => {
        const result = SecurityChecker.checkCommand(command);
        expect(result.riskLevel).toBe('low');
        expect(result.safe).toBe(true);
        expect(result.requiresConfirmation).toBe(false);
      });
    });

    it('should check commands with pipes', () => {
      const commandWithPipe = 'cat file.txt | grep "error"';
      const result = SecurityChecker.checkCommand(commandWithPipe);
      expect(result.riskLevel).toBe('low');
      expect(result.safe).toBe(true);
    });

    it('should detect dangerous commands in pipes', () => {
      const dangerousPipeCommand = 'ls -la | rm -rf /';
      const result = SecurityChecker.checkCommand(dangerousPipeCommand);
      expect(result.riskLevel).toBe('blocked');
    });
  });

  describe('checkPowerShellCommand', () => {
    it('should detect PowerShell execution policy bypass', () => {
      const command = 'Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass';
      const result = SecurityChecker.checkPowerShellCommand(command);

      expect(result.riskLevel).toBe('high');
      expect(result.requiresConfirmation).toBe(true);
      expect(result.warning).toContain('执行策略');
    });

    it('should detect registry operations', () => {
      const command = 'Remove-Item -Path "HKLM:\\SOFTWARE\\TestKey" -Recurse';
      const result = SecurityChecker.checkPowerShellCommand(command);

      expect(result.riskLevel).toBe('medium');
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should fall back to regular check for non-PS specific threats', () => {
      const command = 'Get-ChildItem';
      const result = SecurityChecker.checkPowerShellCommand(command);

      expect(result.riskLevel).toBe('low');
      expect(result.safe).toBe(true);
    });
  });

  describe('checkCommandByShell', () => {
    it('should use PowerShell check for powershell shell type', () => {
      const command = 'Set-ExecutionPolicy Bypass';
      const result = SecurityChecker.checkCommandByShell(command, 'powershell');

      expect(result.riskLevel).toBe('high');
    });

    it('should use regular check for bash shell type', () => {
      const command = 'ls -la';
      const result = SecurityChecker.checkCommandByShell(command, 'bash');

      expect(result.riskLevel).toBe('low');
    });

    it('should default to bash for unknown shell types', () => {
      const command = 'ls -la';
      const result = SecurityChecker.checkCommandByShell(command, 'unknown');

      expect(result.riskLevel).toBe('low');
    });
  });

  describe('getRiskLevelDescription', () => {
    it('should return correct Chinese descriptions', () => {
      expect(SecurityChecker.getRiskLevelDescription('low')).toBe('低风险');
      expect(SecurityChecker.getRiskLevelDescription('medium')).toBe('中等风险');
      expect(SecurityChecker.getRiskLevelDescription('high')).toBe('高风险');
      expect(SecurityChecker.getRiskLevelDescription('blocked')).toBe('已阻止');
    });
  });

  describe('getSecurityReport', () => {
    it('should generate detailed security report', () => {
      const command = 'rm file.txt';
      const shellType = 'bash';
      const report = SecurityChecker.getSecurityReport(command, shellType);

      expect(report).toContain('安全检查结果: 中等风险');
      expect(report).toContain(`命令: ${command}`);
      expect(report).toContain('需要确认: 是');
    });
  });
});