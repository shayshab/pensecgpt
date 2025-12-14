import axios from 'axios';
import { Vulnerability } from '../scanEngine';

export async function authenticationScanner(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  try {
    // Check for default credentials endpoints
    const commonEndpoints = [
      '/admin',
      '/login',
      '/api/login',
      '/auth/login',
      '/signin',
      '/sign-in',
      '/account/login',
      '/user/login',
    ];

    for (const endpoint of commonEndpoints) {
      try {
        const testUrl = new URL(endpoint, url).toString();
        const response = await axios.get(testUrl, {
          timeout: 5000,
          validateStatus: () => true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PenGPT/1.0)',
          },
        });

        // Check if login page exists and has weak security indicators
        const responseText = response.data?.toString().toLowerCase() || '';
        
        if (responseText.includes('password') && responseText.includes('login')) {
          // Check for common weak authentication patterns
          const issues: string[] = [];
          
          if (responseText.includes('remember me') && !responseText.includes('csrf')) {
            issues.push('Missing CSRF protection on login form');
          }
          
          if (!responseText.includes('captcha') && !responseText.includes('recaptcha')) {
            issues.push('No CAPTCHA protection against brute force');
          }
          
          if (responseText.includes('password') && !responseText.includes('minlength') && !responseText.includes('pattern')) {
            issues.push('No visible password complexity requirements');
          }

          if (issues.length > 0) {
            vulnerabilities.push({
              title: 'Weak Authentication Implementation',
              description: `The login page at ${testUrl} may have weak authentication mechanisms. Issues detected: ${issues.join(', ')}.`,
              severity: 'medium',
              category: 'A07:2021 – Identification and Authentication Failures',
              cwe_id: 'CWE-287',
              cvss_score: 6.5,
              affected_url: testUrl,
              recommendation: 'Implement strong authentication: enforce password complexity, implement account lockout, use multi-factor authentication, implement proper session management, protect against brute force attacks, and add CAPTCHA.',
              tags: ['authentication', 'owasp-top-10'],
            });
          }
        }

        // Test for exposed admin panels
        if (endpoint.includes('admin')) {
          if (response.status === 200 && responseText.length > 0) {
            vulnerabilities.push({
              title: 'Admin Panel Accessible',
              description: `An admin panel is accessible at ${testUrl}. This should be protected with strong authentication and authorization.`,
              severity: 'high',
              category: 'A07:2021 – Identification and Authentication Failures',
              cwe_id: 'CWE-284',
              cvss_score: 7.5,
              affected_url: testUrl,
              recommendation: 'Ensure admin panels are properly protected with strong authentication, authorization, and access controls. Consider IP whitelisting and rate limiting.',
              tags: ['authentication', 'admin-panel', 'owasp-top-10'],
            });
          }
        }
      } catch (error) {
        // Endpoint doesn't exist or is unreachable
      }
    }

    // Test for session management issues
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: () => true,
      });

      const cookies = response.headers['set-cookie'] || [];
      const cookieHeaders = Array.isArray(cookies) ? cookies.join(' ') : cookies.toString();
      
      if (cookieHeaders) {
        const issues: string[] = [];
        
        if (!cookieHeaders.toLowerCase().includes('httponly')) {
          issues.push('Cookies missing HttpOnly flag');
        }
        
        if (!cookieHeaders.toLowerCase().includes('secure') && url.startsWith('https')) {
          issues.push('Cookies missing Secure flag on HTTPS site');
        }
        
        if (!cookieHeaders.toLowerCase().includes('samesite')) {
          issues.push('Cookies missing SameSite attribute');
        }

        if (issues.length > 0) {
          vulnerabilities.push({
            title: 'Weak Session Management',
            description: `Session management issues detected: ${issues.join(', ')}. This may expose sessions to XSS and CSRF attacks.`,
            severity: 'medium',
            category: 'A07:2021 – Identification and Authentication Failures',
            cwe_id: 'CWE-613',
            cvss_score: 6.1,
            affected_url: url,
            recommendation: 'Set HttpOnly, Secure, and SameSite attributes on all session cookies. Use secure session tokens. Implement proper session timeout and invalidation.',
            tags: ['session-management', 'authentication', 'owasp-top-10'],
          });
        }
      }
    } catch (error) {
      // Continue
    }
  } catch (error) {
    // Continue
  }

  return vulnerabilities;
}

