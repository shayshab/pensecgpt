import { openai } from '../../config/openai';
import { Vulnerability } from '../scanners/scanEngine';

export async function analyzeVulnerabilities(vulnerability: Vulnerability): Promise<string> {
  try {
    const prompt = `Analyze the following security vulnerability and provide a detailed analysis:

Title: ${vulnerability.title}
Description: ${vulnerability.description}
Severity: ${vulnerability.severity}
Category: ${vulnerability.category}
CWE ID: ${vulnerability.cwe_id || 'N/A'}
CVSS Score: ${vulnerability.cvss_score || 'N/A'}
Affected URL: ${vulnerability.affected_url}
${vulnerability.affected_parameter ? `Affected Parameter: ${vulnerability.affected_parameter}` : ''}
${vulnerability.proof_of_concept ? `Proof of Concept: ${vulnerability.proof_of_concept}` : ''}

Please provide:
1. A detailed explanation of the vulnerability
2. Potential impact and business risk
3. Attack scenarios
4. Detailed remediation steps
5. Best practices to prevent similar issues

Keep the analysis professional and technical.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a cybersecurity expert specializing in web application security and OWASP Top 10 vulnerabilities. Provide detailed, technical analysis of security vulnerabilities.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || 'AI analysis unavailable';
  } catch (error: any) {
    console.error('AI analysis error:', error);
    return `AI analysis failed: ${error.message}. Please review the vulnerability manually.`;
  }
}

export async function generateVulnerabilitySummary(vulnerabilities: Vulnerability[]): Promise<string> {
  try {
    const summary = vulnerabilities.map((v) => 
      `- ${v.title} (${v.severity}): ${v.description.substring(0, 100)}...`
    ).join('\n');

    const prompt = `Analyze the following list of security vulnerabilities found in a web application scan and provide a comprehensive executive summary:

${summary}

Total vulnerabilities: ${vulnerabilities.length}

Please provide:
1. Overall security posture assessment
2. Critical issues that need immediate attention
3. Risk level (Critical/High/Medium/Low)
4. Priority recommendations
5. Compliance implications (if any)

Keep it concise and actionable for both technical and non-technical stakeholders.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a cybersecurity consultant providing executive summaries of security assessments.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content || 'Summary unavailable';
  } catch (error: any) {
    console.error('AI summary generation error:', error);
    return 'AI summary generation failed. Please review vulnerabilities manually.';
  }
}






