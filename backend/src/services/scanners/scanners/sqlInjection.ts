import axios from 'axios';
import { Vulnerability } from '../scanEngine';

const sqlPayloads = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "admin' --",
  "admin' #",
  "' UNION SELECT NULL--",
  "1' AND '1'='1",
  "1' AND '1'='2",
];

export async function sqlInjectionScanner(
  url: string,
  forms: any[],
  inputs: any[]
): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  // Test SQL injection in URL parameters
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    if (params.toString()) {
      // Test each URL parameter
      for (const [key, value] of params.entries()) {
        for (const payload of sqlPayloads.slice(0, 3)) { // Test first 3 payloads on URL params
          try {
            const testUrl = new URL(url);
            testUrl.searchParams.set(key, payload);
            
            const response = await axios.get(testUrl.toString(), {
              timeout: 5000,
              validateStatus: () => true,
            });

            const errorPatterns = [
              /sql syntax/i,
              /mysql/i,
              /postgresql/i,
              /oracle/i,
              /sql server/i,
              /syntax error/i,
              /unclosed quotation mark/i,
              /quoted string not properly terminated/i,
            ];

            const hasError = errorPatterns.some((pattern) =>
              pattern.test(response.data?.toString() || '')
            );

            if (hasError) {
              vulnerabilities.push({
                title: 'SQL Injection Vulnerability in URL Parameter',
                description: `SQL injection vulnerability detected in URL parameter '${key}' at ${url}. The application appears to be vulnerable to SQL injection attacks.`,
                severity: 'critical',
                category: 'A03:2021 – Injection',
                cwe_id: 'CWE-89',
                cvss_score: 9.8,
                affected_url: testUrl.toString(),
                affected_parameter: key,
                http_method: 'GET',
                request_payload: `Parameter ${key}=${payload}`,
                response_payload: response.data?.toString().substring(0, 1000),
                proof_of_concept: `Access: ${testUrl.toString()}`,
                recommendation: 'Use parameterized queries or prepared statements. Validate and sanitize all user inputs, including URL parameters. Implement input validation and output encoding.',
                tags: ['sql-injection', 'injection', 'owasp-top-10', 'url-parameter'],
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

  // Test SQL injection in form inputs
  for (const form of forms) {
    const formAction = form.attribs?.action || url;
    const formMethod = (form.attribs?.method || 'GET').toUpperCase();
    const formInputs = form.children?.filter((c: any) => 
      c.name === 'input' || c.name === 'textarea'
    ) || [];

    for (const payload of sqlPayloads) {
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

        // Check for SQL error patterns
        const errorPatterns = [
          /sql syntax/i,
          /mysql/i,
          /postgresql/i,
          /oracle/i,
          /sql server/i,
          /syntax error/i,
          /unclosed quotation mark/i,
          /quoted string not properly terminated/i,
        ];

        const hasError = errorPatterns.some((pattern) =>
          pattern.test(response.data?.toString() || '')
        );

        if (hasError) {
          vulnerabilities.push({
            title: 'SQL Injection Vulnerability Detected',
            description: `SQL injection vulnerability detected in form at ${formAction}. The application appears to be vulnerable to SQL injection attacks.`,
            severity: 'critical',
            category: 'A03:2021 – Injection',
            cwe_id: 'CWE-89',
            cvss_score: 9.8,
            affected_url: formAction,
            affected_parameter: Object.keys(formData).join(', '),
            http_method: formMethod,
            request_payload: JSON.stringify(formData),
            response_payload: response.data?.toString().substring(0, 1000),
            proof_of_concept: `Submit the following payload in form fields: ${payload}`,
            recommendation: 'Use parameterized queries or prepared statements. Validate and sanitize all user inputs. Implement input validation and output encoding.',
            tags: ['sql-injection', 'injection', 'owasp-top-10'],
          });
          break; // Found vulnerability, no need to test more payloads for this form
        }
      } catch (error) {
        // Continue to next payload
      }
    }
  }

  return vulnerabilities;
}

