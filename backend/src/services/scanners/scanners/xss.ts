import axios from 'axios';
import { Vulnerability } from '../scanEngine';

const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  '"><script>alert("XSS")</script>',
  "javascript:alert('XSS')",
  '<iframe src="javascript:alert(\'XSS\')">',
];

export async function xssScanner(
  url: string,
  forms: any[],
  inputs: any[]
): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  // Test XSS in URL parameters
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    if (params.toString()) {
      // Test each URL parameter
      for (const [key, value] of params.entries()) {
        for (const payload of xssPayloads.slice(0, 2)) { // Test first 2 payloads on URL params
          try {
            const testUrl = new URL(url);
            testUrl.searchParams.set(key, payload);
            
            const response = await axios.get(testUrl.toString(), {
              timeout: 5000,
              validateStatus: () => true,
            });

            const responseText = response.data?.toString() || '';
            if (responseText.includes(payload) || responseText.includes('alert("XSS")')) {
              vulnerabilities.push({
                title: 'Cross-Site Scripting (XSS) in URL Parameter',
                description: `XSS vulnerability detected in URL parameter '${key}' at ${url}. User input is reflected in the response without proper encoding.`,
                severity: 'high',
                category: 'A03:2021 – Injection',
                cwe_id: 'CWE-79',
                cvss_score: 7.2,
                affected_url: testUrl.toString(),
                affected_parameter: key,
                http_method: 'GET',
                request_payload: `Parameter ${key}=${payload}`,
                response_payload: responseText.substring(0, 1000),
                proof_of_concept: `Access: ${testUrl.toString()}`,
                recommendation: 'Implement proper output encoding. Use Content Security Policy (CSP). Validate and sanitize all user inputs, including URL parameters. Use framework-specific XSS protection mechanisms.',
                tags: ['xss', 'injection', 'owasp-top-10', 'url-parameter'],
              });
              break;
            }
          } catch (error) {
            // Continue
          }
        }
      }
    }
  } catch (error) {
    // URL parsing failed, continue with form testing
  }

  for (const form of forms) {
    const formAction = form.attribs?.action || url;
    const formMethod = (form.attribs?.method || 'GET').toUpperCase();
    const formInputs = form.children?.filter((c: any) => 
      c.name === 'input' || c.name === 'textarea'
    ) || [];

    for (const payload of xssPayloads) {
      try {
        const formData: Record<string, string> = {};
        
        formInputs.forEach((input: any) => {
          const name = input.attribs?.name;
          const type = input.attribs?.type || 'text';
          if (name && type !== 'submit' && type !== 'button') {
            formData[name] = payload;
          }
        });

        const config: any = {
          timeout: 5000,
          validateStatus: () => true,
        };

        let response;
        if (formMethod === 'POST') {
          response = await axios.post(formAction, formData, config);
        } else {
          response = await axios.get(formAction, { params: formData, ...config });
        }

        // Check if payload is reflected in response
        const responseText = response.data?.toString() || '';
        if (responseText.includes(payload) || responseText.includes('alert("XSS")')) {
          vulnerabilities.push({
            title: 'Cross-Site Scripting (XSS) Vulnerability Detected',
            description: `XSS vulnerability detected in form at ${formAction}. User input is reflected in the response without proper encoding.`,
            severity: 'high',
            category: 'A03:2021 – Injection',
            cwe_id: 'CWE-79',
            cvss_score: 7.2,
            affected_url: formAction,
            affected_parameter: Object.keys(formData).join(', '),
            http_method: formMethod,
            request_payload: JSON.stringify(formData),
            response_payload: responseText.substring(0, 1000),
            proof_of_concept: `Submit the following payload: ${payload}`,
            recommendation: 'Implement proper output encoding. Use Content Security Policy (CSP). Validate and sanitize all user inputs. Use framework-specific XSS protection mechanisms.',
            tags: ['xss', 'injection', 'owasp-top-10'],
          });
          break;
        }
      } catch (error) {
        // Continue to next payload
      }
    }
  }

  return vulnerabilities;
}

