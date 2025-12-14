import axios from 'axios';
import { Vulnerability } from '../scanEngine';

export async function loggingScanner(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  try {
    // Try to trigger various errors to see if sensitive information is logged/exposed
    const testCases = [
      { path: '/nonexistent-endpoint-12345', method: 'GET' },
      { path: '/api/invalid', method: 'GET' },
      { path: '/../etc/passwd', method: 'GET' },
      { path: '/?id=invalid', method: 'GET' },
    ];

    for (const testCase of testCases) {
      try {
        const testUrl = new URL(testCase.path, url).toString();
        const response = await axios.get(testUrl, {
          timeout: 5000,
          validateStatus: () => true,
        });

        const responseText = response.data?.toString() || '';
        
        // Check for information disclosure in error messages
        const sensitiveInfoPatterns = [
          /database/i,
          /sql/i,
          /stack trace/i,
          /file path/i,
          /internal/i,
          /server error/i,
          /exception/i,
          /at \w+\.\w+/i, // Stack trace pattern
          /line \d+/i,
          /file:\/\/\//i,
          /c:\\.*\\/i, // Windows paths
        ];

        const hasSensitiveInfo = sensitiveInfoPatterns.some((pattern) =>
          pattern.test(responseText)
        );

        if (hasSensitiveInfo && (response.status >= 400 || responseText.length > 100)) {
          vulnerabilities.push({
            title: 'Information Disclosure in Error Messages',
            description: `Error responses from ${testUrl} contain sensitive information that could aid attackers. The application exposes internal details like stack traces, file paths, or database information.`,
            severity: 'medium',
            category: 'A09:2021 – Security Logging and Monitoring Failures',
            cwe_id: 'CWE-209',
            cvss_score: 5.3,
            affected_url: testUrl,
            response_payload: responseText.substring(0, 1000),
            recommendation: 'Implement proper error handling. Do not expose sensitive information in error messages. Log detailed errors server-side but return generic messages to clients. Implement proper security logging and monitoring. Use custom error pages.',
            tags: ['information-disclosure', 'logging', 'owasp-top-10'],
          });
          break; // Found one, no need to test more
        }
      } catch (error) {
        // Continue
      }
    }

    // Check for exposed debug/development endpoints
    const debugEndpoints = [
      '/debug',
      '/test',
      '/dev',
      '/development',
      '/.env',
      '/config',
      '/phpinfo.php',
      '/info.php',
    ];

    for (const endpoint of debugEndpoints) {
      try {
        const testUrl = new URL(endpoint, url).toString();
        const response = await axios.get(testUrl, {
          timeout: 5000,
          validateStatus: () => true,
        });

        if (response.status === 200) {
          const responseText = response.data?.toString().toLowerCase() || '';
          if (responseText.includes('php') || 
              responseText.includes('version') || 
              responseText.includes('configuration') ||
              responseText.includes('environment')) {
            vulnerabilities.push({
              title: 'Exposed Debug/Development Endpoint',
              description: `A debug or development endpoint is accessible at ${testUrl}. This may expose sensitive configuration or system information.`,
              severity: 'medium',
              category: 'A05:2021 – Security Misconfiguration',
              cwe_id: 'CWE-200',
              cvss_score: 5.3,
              affected_url: testUrl,
              recommendation: 'Disable or remove debug endpoints in production. Use environment-based configuration to hide development tools. Implement proper access controls.',
              tags: ['information-disclosure', 'misconfiguration', 'owasp-top-10'],
            });
            break;
          }
        }
      } catch (error) {
        // Continue
      }
    }
  } catch (error) {
    // Continue
  }

  return vulnerabilities;
}

