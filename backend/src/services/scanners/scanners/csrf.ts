import { Vulnerability } from '../scanEngine';

export async function csrfScanner(
  url: string,
  forms: any[]
): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  for (const form of forms) {
    const formMethod = (form.attribs?.method || 'GET').toUpperCase();
    
    // CSRF is typically a concern for state-changing operations (POST, PUT, DELETE)
    if (formMethod === 'POST' || formMethod === 'PUT' || formMethod === 'DELETE') {
      // Check for CSRF token
      const formChildren = form.children || [];
      const hasCsrfToken = formChildren.some((child: any) => {
        if (child.name === 'input') {
          const name = child.attribs?.name?.toLowerCase() || '';
          return name.includes('csrf') || name.includes('token') || name.includes('_token');
        }
        return false;
      });

      if (!hasCsrfToken) {
        vulnerabilities.push({
          title: 'Missing CSRF Protection',
          description: `Form at ${url} does not appear to have CSRF protection. The form may be vulnerable to Cross-Site Request Forgery attacks.`,
          severity: 'medium',
          category: 'A01:2021 – Broken Access Control',
          cwe_id: 'CWE-352',
          cvss_score: 6.5,
          affected_url: url,
          http_method: formMethod,
          proof_of_concept: 'The form does not contain a CSRF token. An attacker could craft a malicious request to perform actions on behalf of authenticated users.',
          recommendation: 'Implement CSRF tokens for all state-changing operations. Use SameSite cookie attribute. Verify the origin and referer headers. Consider using double-submit cookie pattern.',
          tags: ['csrf', 'access-control', 'owasp-top-10'],
        });
      }
    }
  }

  return vulnerabilities;
}






