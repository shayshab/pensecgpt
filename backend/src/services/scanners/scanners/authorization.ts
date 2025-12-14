import axios from 'axios';
import { Vulnerability } from '../scanEngine';

export async function authorizationScanner(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  try {
    // Test for IDOR (Insecure Direct Object Reference)
    const testIds = ['1', '2', 'admin', 'test', '123', '0'];
    const commonEndpoints = [
      '/api/user/',
      '/api/profile/',
      '/user/',
      '/admin/',
      '/api/users/',
      '/profile/',
      '/account/',
      '/dashboard/',
    ];

    for (const endpoint of commonEndpoints) {
      for (const testId of testIds) {
        try {
          const testUrl = new URL(endpoint + testId, url).toString();
          const response = await axios.get(testUrl, {
            timeout: 5000,
            validateStatus: () => true,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; PenGPT/1.0)',
            },
          });

          // If we get a 200 response, it might be an IDOR vulnerability
          if (response.status === 200 && response.data) {
            const responseText = JSON.stringify(response.data).toLowerCase();
            const responseBody = typeof response.data === 'string' ? response.data.toLowerCase() : responseText;
            
            if (responseBody.includes('email') || 
                responseBody.includes('password') || 
                responseBody.includes('user') ||
                responseBody.includes('username') ||
                responseBody.includes('profile') ||
                responseBody.includes('account')) {
              vulnerabilities.push({
                title: 'Potential Insecure Direct Object Reference (IDOR)',
                description: `The endpoint ${testUrl} may be vulnerable to IDOR attacks. Unauthorized access to resources may be possible by manipulating object identifiers. The endpoint returned user-related data without proper authorization checks.`,
                severity: 'high',
                category: 'A01:2021 – Broken Access Control',
                cwe_id: 'CWE-639',
                cvss_score: 7.5,
                affected_url: testUrl,
                proof_of_concept: `Access ${testUrl} to view potentially unauthorized resources.`,
                recommendation: 'Implement proper authorization checks. Use indirect object references. Verify user permissions before accessing resources. Implement access control lists (ACLs).',
                tags: ['idor', 'access-control', 'owasp-top-10'],
              });
              break; // Found one, no need to test more IDs
            }
          }
        } catch (error) {
          // Continue
        }
      }
    }

    // Test for directory traversal / path traversal
    const traversalPayloads = ['../', '..\\', '....//', '....\\\\'];
    const basePath = new URL(url).pathname;
    
    for (const payload of traversalPayloads) {
      try {
        const testUrl = new URL(basePath + payload + 'etc/passwd', url).toString();
        const response = await axios.get(testUrl, {
          timeout: 5000,
          validateStatus: () => true,
        });

        if (response.status === 200) {
          const responseText = response.data?.toString() || '';
          if (responseText.includes('root:') || responseText.includes('/bin/bash') || responseText.includes('/bin/sh')) {
            vulnerabilities.push({
              title: 'Path Traversal / Directory Traversal Vulnerability',
              description: `Path traversal vulnerability detected. The application may allow access to files outside the web root directory.`,
              severity: 'high',
              category: 'A01:2021 – Broken Access Control',
              cwe_id: 'CWE-22',
              cvss_score: 7.5,
              affected_url: testUrl,
              proof_of_concept: `Access: ${testUrl}`,
              recommendation: 'Validate and sanitize file paths. Use whitelist-based access control. Implement proper path normalization. Restrict file system access.',
              tags: ['path-traversal', 'directory-traversal', 'access-control', 'owasp-top-10'],
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

