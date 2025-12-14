import { Vulnerability } from '../scanEngine';

const requiredHeaders = [
  { name: 'X-Content-Type-Options', value: 'nosniff' },
  { name: 'X-Frame-Options', value: 'DENY' },
  { name: 'X-XSS-Protection', value: '1; mode=block' },
  { name: 'Strict-Transport-Security', value: 'max-age=' },
  { name: 'Content-Security-Policy', value: '' },
];

export async function securityHeadersScanner(
  url: string,
  headers: Record<string, string>
): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  const missingHeaders: string[] = [];

  // Check for required security headers
  for (const requiredHeader of requiredHeaders) {
    const headerValue = headers[requiredHeader.name.toLowerCase()] || 
                       headers[requiredHeader.name] ||
                       '';

    if (!headerValue) {
      missingHeaders.push(requiredHeader.name);
    } else if (requiredHeader.value && !headerValue.includes(requiredHeader.value)) {
      vulnerabilities.push({
        title: `Incorrect ${requiredHeader.name} Header Value`,
        description: `The ${requiredHeader.name} header is present but has an incorrect or weak value.`,
        severity: 'low',
        category: 'A05:2021 – Security Misconfiguration',
        cwe_id: 'CWE-693',
        cvss_score: 3.1,
        affected_url: url,
        recommendation: `Set ${requiredHeader.name} header to: ${requiredHeader.value}`,
        tags: ['security-headers', 'misconfiguration'],
      });
    }
  }

  if (missingHeaders.length > 0) {
    vulnerabilities.push({
      title: 'Missing Security Headers',
      description: `The application is missing important security headers: ${missingHeaders.join(', ')}. This may expose the application to various attacks.`,
      severity: 'medium',
      category: 'A05:2021 – Security Misconfiguration',
      cwe_id: 'CWE-693',
      cvss_score: 5.3,
      affected_url: url,
      recommendation: `Implement the following security headers: ${missingHeaders.join(', ')}. Configure your web server or application framework to include these headers in all responses.`,
      tags: ['security-headers', 'misconfiguration', 'owasp-top-10'],
      metadata: { missing_headers: missingHeaders },
    });
  }

  return vulnerabilities;
}






