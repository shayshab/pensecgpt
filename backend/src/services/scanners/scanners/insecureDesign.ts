import { Vulnerability } from '../scanEngine';

export async function insecureDesignScanner(
  url: string,
  forms: any[]
): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  // Check for insecure design patterns
  for (const form of forms) {
    const formInputs = form.children?.filter((c: any) => 
      c.name === 'input' || c.name === 'textarea'
    ) || [];

    // Check for password fields without proper attributes
    const passwordInputs = formInputs.filter((input: any) => 
      input.attribs?.type === 'password'
    );

    for (const passwordInput of passwordInputs) {
      // Check if autocomplete is disabled (good practice)
      const autocomplete = passwordInput.attribs?.autocomplete;
      if (autocomplete === 'off' || autocomplete === 'false') {
        // This is actually good, but we note it
      } else if (!autocomplete) {
        vulnerabilities.push({
          title: 'Insecure Password Field Design',
          description: `Password field in form at ${url} may not have proper security attributes configured.`,
          severity: 'low',
          category: 'A04:2021 – Insecure Design',
          cwe_id: 'CWE-254',
          cvss_score: 2.0,
          affected_url: url,
          recommendation: 'Ensure password fields have autocomplete="off" and proper security attributes. Implement password strength requirements and consider using password managers.',
          tags: ['insecure-design', 'owasp-top-10'],
        });
      }
    }
  }

  return vulnerabilities;
}






