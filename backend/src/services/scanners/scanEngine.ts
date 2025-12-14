import axios from 'axios';
import * as cheerio from 'cheerio';
import { sqlInjectionScanner } from './scanners/sqlInjection';
import { xssScanner } from './scanners/xss';
import { csrfScanner } from './scanners/csrf';
import { securityHeadersScanner } from './scanners/securityHeaders';
import { sensitiveDataScanner } from './scanners/sensitiveData';
import { authenticationScanner } from './scanners/authentication';
import { authorizationScanner } from './scanners/authorization';
import { ssrfScanner } from './scanners/ssrf';
import { insecureDesignScanner } from './scanners/insecureDesign';
import { loggingScanner } from './scanners/logging';

export interface Vulnerability {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  cwe_id?: string;
  cvss_score?: number;
  affected_url: string;
  affected_parameter?: string;
  http_method?: string;
  request_payload?: string;
  response_payload?: string;
  proof_of_concept?: string;
  recommendation: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export async function runScan(
  url: string,
  scanType: string,
  scanConfig: Record<string, any>
): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  try {
    // Fetch the target URL
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true, // Accept all status codes
    });

    const $ = cheerio.load(response.data);
    const forms = $('form').toArray();
    const inputs = $('input, textarea, select').toArray();

    // Run scanners based on scan type
    if (scanType === 'full' || scanType === 'custom') {
      // OWASP Top 10 Scanners
      vulnerabilities.push(...(await sqlInjectionScanner(url, forms, inputs)));
      vulnerabilities.push(...(await xssScanner(url, forms, inputs)));
      vulnerabilities.push(...(await csrfScanner(url, forms)));
      vulnerabilities.push(...(await securityHeadersScanner(url, response.headers)));
      vulnerabilities.push(...(await sensitiveDataScanner(url, response.data)));
      vulnerabilities.push(...(await authenticationScanner(url)));
      vulnerabilities.push(...(await authorizationScanner(url)));
      vulnerabilities.push(...(await ssrfScanner(url)));
      vulnerabilities.push(...(await insecureDesignScanner(url, forms)));
      vulnerabilities.push(...(await loggingScanner(url)));
    } else if (scanType === 'quick') {
      // Quick scan - only critical vulnerabilities
      vulnerabilities.push(...(await sqlInjectionScanner(url, forms, inputs)));
      vulnerabilities.push(...(await xssScanner(url, forms, inputs)));
      vulnerabilities.push(...(await securityHeadersScanner(url, response.headers)));
    }
  } catch (error: any) {
    console.error('Scan error:', error);
    // Return vulnerabilities found so far
  }

  return vulnerabilities;
}






