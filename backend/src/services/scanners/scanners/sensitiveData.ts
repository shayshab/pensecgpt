import { Vulnerability } from '../scanEngine';

const sensitivePatterns = [
  { pattern: /password\s*[:=]\s*["']?([^"'\s]+)/gi, type: 'password' },
  { pattern: /api[_-]?key\s*[:=]\s*["']?([^"'\s]+)/gi, type: 'api_key' },
  { pattern: /secret\s*[:=]\s*["']?([^"'\s]+)/gi, type: 'secret' },
  { pattern: /token\s*[:=]\s*["']?([^"'\s]+)/gi, type: 'token' },
  { pattern: /(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})/g, type: 'credit_card' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email' },
];

export async function sensitiveDataScanner(
  url: string,
  responseData: string
): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  const foundSensitiveData: Record<string, string[]> = {};

  const dataString = typeof responseData === 'string' 
    ? responseData 
    : JSON.stringify(responseData);

  for (const { pattern, type } of sensitivePatterns) {
    const matches = dataString.match(pattern);
    if (matches && matches.length > 0) {
      foundSensitiveData[type] = matches.slice(0, 5); // Limit to 5 examples
    }
  }

  if (Object.keys(foundSensitiveData).length > 0) {
    const types = Object.keys(foundSensitiveData);
    const severity = types.includes('password') || types.includes('api_key') 
      ? 'high' 
      : 'medium';

    vulnerabilities.push({
      title: 'Sensitive Data Exposure',
      description: `The application response contains potentially sensitive data: ${types.join(', ')}. This information should not be exposed in client-side code or responses.`,
      severity: severity as any,
      category: 'A02:2021 – Cryptographic Failures',
      cwe_id: 'CWE-312',
      cvss_score: severity === 'high' ? 7.5 : 5.3,
      affected_url: url,
      recommendation: 'Remove sensitive data from client-side code and API responses. Use server-side rendering for sensitive information. Implement proper data masking and encryption. Follow the principle of least privilege.',
      tags: ['sensitive-data', 'data-exposure', 'owasp-top-10'],
      metadata: { exposed_types: types },
    });
  }

  return vulnerabilities;
}






