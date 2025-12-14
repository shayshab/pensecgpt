import axios from 'axios';
import { Vulnerability } from '../scanEngine';

export async function ssrfScanner(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  try {
    // Test for SSRF in URL parameters
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    if (params.toString()) {
      const ssrfTestUrls = [
        'http://127.0.0.1',
        'http://localhost',
        'http://169.254.169.254', // AWS metadata
        'http://192.168.1.1',
        'file:///etc/passwd',
      ];

      const ssrfParams = ['url', 'link', 'path', 'file', 'redirect', 'callback', 'target', 'destination'];
      
      for (const param of ssrfParams) {
        if (params.has(param)) {
          // Parameter exists, test for SSRF
          for (const testUrl of ssrfTestUrls.slice(0, 2)) { // Test first 2
            try {
              const testUrlObj = new URL(url);
              testUrlObj.searchParams.set(param, testUrl);
              
              const response = await axios.get(testUrlObj.toString(), {
                timeout: 3000,
                validateStatus: () => true,
                maxRedirects: 0,
              });

              // If we get a response, it might indicate SSRF
              if (response.status < 500) {
                vulnerabilities.push({
                  title: 'Potential Server-Side Request Forgery (SSRF)',
                  description: `The parameter '${param}' at ${url} may be vulnerable to SSRF attacks. The application appears to make server-side requests based on user input.`,
                  severity: 'high',
                  category: 'A10:2021 – Server-Side Request Forgery (SSRF)',
                  cwe_id: 'CWE-918',
                  cvss_score: 8.6,
                  affected_url: testUrlObj.toString(),
                  affected_parameter: param,
                  proof_of_concept: `Test with: ${testUrlObj.toString()}`,
                  recommendation: 'Validate and whitelist allowed URLs. Block internal IP addresses and private networks. Use URL parsing libraries that prevent SSRF. Implement network segmentation.',
                  tags: ['ssrf', 'owasp-top-10'],
                });
                break;
              }
            } catch (error: any) {
              // Network errors might indicate SSRF attempt was made
              if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                vulnerabilities.push({
                  title: 'Potential Server-Side Request Forgery (SSRF)',
                  description: `The parameter '${param}' at ${url} may be vulnerable to SSRF attacks. The application appears to make server-side requests based on user input.`,
                  severity: 'high',
                  category: 'A10:2021 – Server-Side Request Forgery (SSRF)',
                  cwe_id: 'CWE-918',
                  cvss_score: 8.6,
                  affected_url: url,
                  affected_parameter: param,
                  proof_of_concept: `The application attempted to connect to ${testUrl}, indicating SSRF vulnerability.`,
                  recommendation: 'Validate and whitelist allowed URLs. Block internal IP addresses and private networks. Use URL parsing libraries that prevent SSRF. Implement network segmentation.',
                  tags: ['ssrf', 'owasp-top-10'],
                });
                break;
              }
            }
          }
        }
      }
    }

    // Test common SSRF endpoints
    const ssrfEndpoints = [
      '/api/fetch',
      '/api/proxy',
      '/api/request',
      '/webhook',
      '/callback',
    ];

    for (const endpoint of ssrfEndpoints) {
      try {
        const testUrl = new URL(endpoint, url).toString();
        const response = await axios.get(testUrl, {
          timeout: 3000,
          validateStatus: () => true,
        });

        if (response.status === 200 || response.status === 400) {
          // Endpoint exists, might be SSRF vulnerable
          vulnerabilities.push({
            title: 'Potential SSRF Endpoint Detected',
            description: `The endpoint ${testUrl} may be vulnerable to SSRF attacks. This endpoint appears to make server-side requests.`,
            severity: 'medium',
            category: 'A10:2021 – Server-Side Request Forgery (SSRF)',
            cwe_id: 'CWE-918',
            cvss_score: 7.5,
            affected_url: testUrl,
            recommendation: 'Validate and whitelist allowed URLs. Block internal IP addresses. Implement proper input validation for URL parameters.',
            tags: ['ssrf', 'owasp-top-10'],
          });
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

