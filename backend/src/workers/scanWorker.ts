import { Worker, Job } from 'bullmq';
import redis from '../config/redis';
import { supabaseAdmin } from '../config/database';
import { analyzeVulnerabilities } from '../services/ai/aiAnalyzer';

interface ScanJobData {
  scanId: string;
  projectId: string;
  url: string;
  scanType: string;
  scanConfig: Record<string, any>;
}

// Helper function to save vulnerabilities in real-time
async function saveVulnerabilitiesRealTime(
  scanId: string,
  projectId: string,
  vulnerabilities: any[],
  scannerName: string
) {
  if (vulnerabilities.length === 0) return;

  try {
    const vulnerabilitiesToInsert = vulnerabilities.map((vuln) => ({
      scan_id: scanId,
      project_id: projectId,
      ...vuln,
    }));

    const { error } = await supabaseAdmin
      .from('vulnerabilities')
      .insert(vulnerabilitiesToInsert);

    if (error) {
      console.error(`Error saving ${scannerName} vulnerabilities:`, error);
    } else {
      console.log(`[Scan ${scanId}] Saved ${vulnerabilities.length} vulnerabilities from ${scannerName}`);
    }
  } catch (err) {
    console.error(`Error in saveVulnerabilitiesRealTime for ${scannerName}:`, err);
  }
}

// Helper function to check if scan is cancelled
async function checkScanCancelled(scanId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('scans')
    .select('status')
    .eq('id', scanId)
    .single();
  return data?.status === 'cancelled';
}

// Helper function to check if scanner should run
function shouldRunScanner(scannerName: string, scanType: string, scanConfig: any): boolean {
  if (scanType === 'quick') {
    // Quick scan only runs critical scanners
    return ['sqlInjection', 'xss', 'securityHeaders'].includes(scannerName);
  }
  if (scanType === 'custom' && scanConfig?.scanners) {
    // Custom scan: only run selected scanners
    return scanConfig.scanners.includes(scannerName);
  }
  // Full scan runs all scanners
  return true;
}

export const scanWorker = new Worker<ScanJobData>(
  'scan-queue',
  async (job: Job<ScanJobData>) => {
    const { scanId, projectId, url, scanType, scanConfig } = job.data;
    const startTime = new Date();

    try {
      // Check if scan was cancelled before starting
      if (await checkScanCancelled(scanId)) {
        console.log(`[Scan ${scanId}] Scan was cancelled before starting`);
        return;
      }

      // Update scan status to running
      await supabaseAdmin
        .from('scans')
        .update({
          status: 'running',
          started_at: startTime.toISOString(),
          error_message: 'Initializing scan...',
        })
        .eq('id', scanId);

      await job.updateProgress(10);
      console.log(`[Scan ${scanId}] Starting ${scanType} scan for ${url}`);

      // Update progress: Fetching target URL
      await supabaseAdmin
        .from('scans')
        .update({ error_message: 'Fetching target URL and analyzing structure...' })
        .eq('id', scanId);
      await job.updateProgress(20);

      // Fetch the target URL once
      const axios = require('axios');
      const cheerio = require('cheerio');
      let response, $, forms, inputs;
      try {
        response = await axios.get(url, {
          timeout: 15000,
          validateStatus: () => true,
        });
        $ = cheerio.load(response.data);
        forms = $('form').toArray();
        inputs = $('input, textarea, select').toArray();
      } catch (err: any) {
        throw new Error(`Failed to fetch target URL: ${err.message}`);
      }

      const allVulnerabilities: any[] = [];

      // Run scanners individually and save results as we go
      if (scanType === 'full' || scanType === 'custom') {
        // Check if cancelled
        if (await checkScanCancelled(scanId)) {
          console.log(`[Scan ${scanId}] Scan cancelled during execution`);
          return;
        }

        // SQL Injection
        if (shouldRunScanner('sqlInjection', scanType, scanConfig)) {
          await supabaseAdmin.from('scans').update({ error_message: '🔍 Scanning for SQL Injection vulnerabilities...' }).eq('id', scanId);
          try {
            const { sqlInjectionScanner } = await import('../services/scanners/scanners/sqlInjection');
            const sqlVulns = await sqlInjectionScanner(url, forms, inputs);
            allVulnerabilities.push(...sqlVulns);
            if (sqlVulns.length > 0) {
              await saveVulnerabilitiesRealTime(scanId, projectId, sqlVulns, 'SQL Injection');
              await supabaseAdmin.from('scans').update({ 
                error_message: `✅ SQL Injection: Found ${sqlVulns.length} vulnerability/vulnerabilities. Continuing...` 
              }).eq('id', scanId);
            } else {
              await supabaseAdmin.from('scans').update({ 
                error_message: `✓ SQL Injection: No vulnerabilities found. Continuing scan...` 
              }).eq('id', scanId);
            }
          } catch (err: any) {
            console.error(`[Scan ${scanId}] SQL Injection scanner error:`, err);
            await supabaseAdmin.from('scans').update({ 
              error_message: `⚠ SQL Injection scanner completed with errors. Continuing...` 
            }).eq('id', scanId);
          }
          await job.updateProgress(10);
        }

        // XSS
        if (shouldRunScanner('xss', scanType, scanConfig)) {
          if (await checkScanCancelled(scanId)) {
            console.log(`[Scan ${scanId}] Scan cancelled during execution`);
            return;
          }
          await supabaseAdmin.from('scans').update({ error_message: '🔍 Scanning for Cross-Site Scripting (XSS) vulnerabilities...' }).eq('id', scanId);
          try {
            const { xssScanner } = await import('../services/scanners/scanners/xss');
            const xssVulns = await xssScanner(url, forms, inputs);
            allVulnerabilities.push(...xssVulns);
            if (xssVulns.length > 0) {
              await saveVulnerabilitiesRealTime(scanId, projectId, xssVulns, 'XSS');
              await supabaseAdmin.from('scans').update({ 
                error_message: `✅ XSS: Found ${xssVulns.length} vulnerability/vulnerabilities. Continuing...` 
              }).eq('id', scanId);
            } else {
              await supabaseAdmin.from('scans').update({ 
                error_message: `✓ XSS: No vulnerabilities found. Continuing scan...` 
              }).eq('id', scanId);
            }
          } catch (err: any) {
            console.error(`[Scan ${scanId}] XSS scanner error:`, err);
            await supabaseAdmin.from('scans').update({ 
              error_message: `⚠ XSS scanner completed with errors. Continuing...` 
            }).eq('id', scanId);
          }
          await job.updateProgress(20);
        }

        // CSRF
        if (shouldRunScanner('csrf', scanType, scanConfig)) {
          if (await checkScanCancelled(scanId)) return;
          await supabaseAdmin.from('scans').update({ error_message: '🔍 Checking for CSRF protection...' }).eq('id', scanId);
          try {
            const { csrfScanner } = await import('../services/scanners/scanners/csrf');
            const csrfVulns = await csrfScanner(url, forms);
            allVulnerabilities.push(...csrfVulns);
            if (csrfVulns.length > 0) {
              await saveVulnerabilitiesRealTime(scanId, projectId, csrfVulns, 'CSRF');
              await supabaseAdmin.from('scans').update({ 
                error_message: `✅ CSRF: Found ${csrfVulns.length} vulnerability/vulnerabilities. Continuing...` 
              }).eq('id', scanId);
            } else {
              await supabaseAdmin.from('scans').update({ 
                error_message: `✓ CSRF: No vulnerabilities found. Continuing scan...` 
              }).eq('id', scanId);
            }
          } catch (err: any) {
            console.error(`[Scan ${scanId}] CSRF scanner error:`, err);
            await supabaseAdmin.from('scans').update({ 
              error_message: `⚠ CSRF scanner completed with errors. Continuing...` 
            }).eq('id', scanId);
          }
          await job.updateProgress(30);
        }

        // Security Headers
        if (shouldRunScanner('securityHeaders', scanType, scanConfig)) {
          if (await checkScanCancelled(scanId)) return;
          await supabaseAdmin.from('scans').update({ error_message: '🔍 Checking security headers configuration...' }).eq('id', scanId);
          try {
            const { securityHeadersScanner } = await import('../services/scanners/scanners/securityHeaders');
            const headerVulns = await securityHeadersScanner(url, response.headers);
            allVulnerabilities.push(...headerVulns);
            if (headerVulns.length > 0) {
              await saveVulnerabilitiesRealTime(scanId, projectId, headerVulns, 'Security Headers');
              await supabaseAdmin.from('scans').update({ 
                error_message: `✅ Security Headers: Found ${headerVulns.length} issue(s). Continuing...` 
              }).eq('id', scanId);
            } else {
              await supabaseAdmin.from('scans').update({ 
                error_message: `✓ Security Headers: No issues found. Continuing scan...` 
              }).eq('id', scanId);
            }
          } catch (err: any) {
            console.error(`[Scan ${scanId}] Security Headers scanner error:`, err);
            await supabaseAdmin.from('scans').update({ 
              error_message: `⚠ Security Headers scanner completed with errors. Continuing...` 
            }).eq('id', scanId);
          }
          await job.updateProgress(40);
        }

        // Sensitive Data
        if (shouldRunScanner('sensitiveData', scanType, scanConfig)) {
          if (await checkScanCancelled(scanId)) return;
          await supabaseAdmin.from('scans').update({ error_message: '🔍 Scanning for sensitive data exposure...' }).eq('id', scanId);
          try {
            const { sensitiveDataScanner } = await import('../services/scanners/scanners/sensitiveData');
            const sensitiveVulns = await sensitiveDataScanner(url, response.data);
            allVulnerabilities.push(...sensitiveVulns);
            if (sensitiveVulns.length > 0) {
              await saveVulnerabilitiesRealTime(scanId, projectId, sensitiveVulns, 'Sensitive Data');
              await supabaseAdmin.from('scans').update({ 
                error_message: `✅ Sensitive Data: Found ${sensitiveVulns.length} issue(s). Continuing...` 
              }).eq('id', scanId);
            } else {
              await supabaseAdmin.from('scans').update({ 
                error_message: `✓ Sensitive Data: No issues found. Continuing scan...` 
              }).eq('id', scanId);
            }
          } catch (err: any) {
            console.error(`[Scan ${scanId}] Sensitive Data scanner error:`, err);
            await supabaseAdmin.from('scans').update({ 
              error_message: `⚠ Sensitive Data scanner completed with errors. Continuing...` 
            }).eq('id', scanId);
          }
          await job.updateProgress(50);
        }

        // Authentication
        if (shouldRunScanner('authentication', scanType, scanConfig)) {
          if (await checkScanCancelled(scanId)) return;
          await supabaseAdmin.from('scans').update({ error_message: '🔍 Analyzing authentication mechanisms...' }).eq('id', scanId);
          try {
            const { authenticationScanner } = await import('../services/scanners/scanners/authentication');
            const authVulns = await authenticationScanner(url);
            allVulnerabilities.push(...authVulns);
            if (authVulns.length > 0) {
              await saveVulnerabilitiesRealTime(scanId, projectId, authVulns, 'Authentication');
              await supabaseAdmin.from('scans').update({ 
                error_message: `✅ Authentication: Found ${authVulns.length} issue(s). Continuing...` 
              }).eq('id', scanId);
            } else {
              await supabaseAdmin.from('scans').update({ 
                error_message: `✓ Authentication: No issues found. Continuing scan...` 
              }).eq('id', scanId);
            }
          } catch (err: any) {
            console.error(`[Scan ${scanId}] Authentication scanner error:`, err);
            await supabaseAdmin.from('scans').update({ 
              error_message: `⚠ Authentication scanner completed with errors. Continuing...` 
            }).eq('id', scanId);
          }
          await job.updateProgress(60);
        }

        // Authorization
        if (shouldRunScanner('authorization', scanType, scanConfig)) {
          if (await checkScanCancelled(scanId)) return;
          await supabaseAdmin.from('scans').update({ error_message: '🔍 Checking authorization and access control...' }).eq('id', scanId);
          try {
            const { authorizationScanner } = await import('../services/scanners/scanners/authorization');
            const authzVulns = await authorizationScanner(url);
            allVulnerabilities.push(...authzVulns);
            if (authzVulns.length > 0) {
              await saveVulnerabilitiesRealTime(scanId, projectId, authzVulns, 'Authorization');
              await supabaseAdmin.from('scans').update({ 
                error_message: `✅ Authorization: Found ${authzVulns.length} issue(s). Continuing...` 
              }).eq('id', scanId);
            } else {
              await supabaseAdmin.from('scans').update({ 
                error_message: `✓ Authorization: No issues found. Continuing scan...` 
              }).eq('id', scanId);
            }
          } catch (err: any) {
            console.error(`[Scan ${scanId}] Authorization scanner error:`, err);
            await supabaseAdmin.from('scans').update({ 
              error_message: `⚠ Authorization scanner completed with errors. Continuing...` 
            }).eq('id', scanId);
          }
          await job.updateProgress(70);
        }

        // SSRF
        if (shouldRunScanner('ssrf', scanType, scanConfig)) {
          if (await checkScanCancelled(scanId)) return;
          await supabaseAdmin.from('scans').update({ error_message: '🔍 Scanning for SSRF vulnerabilities...' }).eq('id', scanId);
          try {
            const { ssrfScanner } = await import('../services/scanners/scanners/ssrf');
            const ssrfVulns = await ssrfScanner(url);
            allVulnerabilities.push(...ssrfVulns);
            if (ssrfVulns.length > 0) {
              await saveVulnerabilitiesRealTime(scanId, projectId, ssrfVulns, 'SSRF');
              await supabaseAdmin.from('scans').update({ 
                error_message: `✅ SSRF: Found ${ssrfVulns.length} vulnerability/vulnerabilities. Continuing...` 
              }).eq('id', scanId);
            } else {
              await supabaseAdmin.from('scans').update({ 
                error_message: `✓ SSRF: No vulnerabilities found. Continuing scan...` 
              }).eq('id', scanId);
            }
          } catch (err: any) {
            console.error(`[Scan ${scanId}] SSRF scanner error:`, err);
            await supabaseAdmin.from('scans').update({ 
              error_message: `⚠ SSRF scanner completed with errors. Continuing...` 
            }).eq('id', scanId);
          }
          await job.updateProgress(75);
        }

        // Insecure Design
        if (shouldRunScanner('insecureDesign', scanType, scanConfig)) {
          if (await checkScanCancelled(scanId)) return;
          await supabaseAdmin.from('scans').update({ error_message: '🔍 Analyzing design security patterns...' }).eq('id', scanId);
          try {
            const { insecureDesignScanner } = await import('../services/scanners/scanners/insecureDesign');
            const designVulns = await insecureDesignScanner(url, forms);
            allVulnerabilities.push(...designVulns);
            if (designVulns.length > 0) {
              await saveVulnerabilitiesRealTime(scanId, projectId, designVulns, 'Insecure Design');
              await supabaseAdmin.from('scans').update({ 
                error_message: `✅ Insecure Design: Found ${designVulns.length} issue(s). Continuing...` 
              }).eq('id', scanId);
            } else {
              await supabaseAdmin.from('scans').update({ 
                error_message: `✓ Insecure Design: No issues found. Continuing scan...` 
              }).eq('id', scanId);
            }
          } catch (err: any) {
            console.error(`[Scan ${scanId}] Insecure Design scanner error:`, err);
            await supabaseAdmin.from('scans').update({ 
              error_message: `⚠ Insecure Design scanner completed with errors. Continuing...` 
            }).eq('id', scanId);
          }
          await job.updateProgress(80);
        }

        // Logging
        if (shouldRunScanner('logging', scanType, scanConfig)) {
          if (await checkScanCancelled(scanId)) return;
          await supabaseAdmin.from('scans').update({ error_message: '🔍 Checking security logging and monitoring...' }).eq('id', scanId);
          try {
            const { loggingScanner } = await import('../services/scanners/scanners/logging');
            const loggingVulns = await loggingScanner(url);
            allVulnerabilities.push(...loggingVulns);
            if (loggingVulns.length > 0) {
              await saveVulnerabilitiesRealTime(scanId, projectId, loggingVulns, 'Logging');
              await supabaseAdmin.from('scans').update({ 
                error_message: `✅ Logging: Found ${loggingVulns.length} issue(s). Continuing...` 
              }).eq('id', scanId);
            } else {
              await supabaseAdmin.from('scans').update({ 
                error_message: `✓ Logging: No issues found. All scanners completed!` 
              }).eq('id', scanId);
            }
          } catch (err: any) {
            console.error(`[Scan ${scanId}] Logging scanner error:`, err);
            await supabaseAdmin.from('scans').update({ 
              error_message: `⚠ Logging scanner completed with errors. All scanners completed!` 
            }).eq('id', scanId);
          }
          await job.updateProgress(85);
        }
      } else if (scanType === 'quick') {
        // Quick scan - only critical scanners
        await supabaseAdmin.from('scans').update({ error_message: '🔍 Running quick scan (SQL Injection, XSS, Security Headers)...' }).eq('id', scanId);
        
        const { sqlInjectionScanner } = await import('../services/scanners/scanners/sqlInjection');
        const sqlVulns = await sqlInjectionScanner(url, forms, inputs);
        allVulnerabilities.push(...sqlVulns);
        if (sqlVulns.length > 0) {
          await saveVulnerabilitiesRealTime(scanId, projectId, sqlVulns, 'SQL Injection');
          await supabaseAdmin.from('scans').update({ 
            error_message: `✅ Found ${sqlVulns.length} SQL Injection vulnerability/vulnerabilities. Continuing...` 
          }).eq('id', scanId);
        }
        
        const { xssScanner } = await import('../services/scanners/scanners/xss');
        const xssVulns = await xssScanner(url, forms, inputs);
        allVulnerabilities.push(...xssVulns);
        if (xssVulns.length > 0) {
          await saveVulnerabilitiesRealTime(scanId, projectId, xssVulns, 'XSS');
          await supabaseAdmin.from('scans').update({ 
            error_message: `✅ Found ${xssVulns.length} XSS vulnerability/vulnerabilities. Continuing...` 
          }).eq('id', scanId);
        }
        
        const { securityHeadersScanner } = await import('../services/scanners/scanners/securityHeaders');
        const headerVulns = await securityHeadersScanner(url, response.headers);
        allVulnerabilities.push(...headerVulns);
        if (headerVulns.length > 0) {
          await saveVulnerabilitiesRealTime(scanId, projectId, headerVulns, 'Security Headers');
          await supabaseAdmin.from('scans').update({ 
            error_message: `✅ Found ${headerVulns.length} Security Headers issue(s). Continuing...` 
          }).eq('id', scanId);
        }
        
        await job.updateProgress(80);
      }

      console.log(`[Scan ${scanId}] Found ${allVulnerabilities.length} total vulnerabilities`);
      
      // Get all saved vulnerabilities
      const { data: savedVulns } = await supabaseAdmin
        .from('vulnerabilities')
        .select('*')
        .eq('scan_id', scanId);

      const totalVulns = savedVulns || [];
      
      await supabaseAdmin
        .from('scans')
        .update({ error_message: `Found ${totalVulns.length} vulnerabilities. Analyzing with AI...` })
        .eq('id', scanId);

      // Analyze vulnerabilities with AI (only those without AI analysis)
      const vulnsNeedingAI = totalVulns.filter((v: any) => !v.ai_analysis);
      
      if (vulnsNeedingAI.length > 0) {
        console.log(`[Scan ${scanId}] Analyzing ${vulnsNeedingAI.length} vulnerabilities with AI...`);
        
        for (let i = 0; i < vulnsNeedingAI.length; i++) {
          const vuln = vulnsNeedingAI[i];
          await supabaseAdmin
            .from('scans')
            .update({ 
              error_message: `🤖 AI Analysis: ${vuln.title} (${i + 1}/${vulnsNeedingAI.length})...` 
            })
            .eq('id', scanId);
          
          const progress = 80 + Math.floor((i / vulnsNeedingAI.length) * 15);
          await job.updateProgress(progress);
          
          const aiAnalysis = await analyzeVulnerabilities(vuln);
          
          // Update vulnerability with AI analysis
          await supabaseAdmin
            .from('vulnerabilities')
            .update({ ai_analysis: aiAnalysis })
            .eq('id', vuln.id);
        }
      }
      
      await job.updateProgress(95);
      console.log(`[Scan ${scanId}] AI analysis complete. Finalizing...`);
      
      await supabaseAdmin
        .from('scans')
        .update({ error_message: 'Finalizing scan results...' })
        .eq('id', scanId);

      // Get final count of all vulnerabilities
      const { data: finalVulns } = await supabaseAdmin
        .from('vulnerabilities')
        .select('*')
        .eq('scan_id', scanId);

      const finalCount = finalVulns || [];
      
      // Count vulnerabilities by severity
      const counts = finalCount.reduce(
        (acc: Record<string, number>, vuln: any) => {
          acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const completedAt = new Date();
      const durationSeconds = Math.floor(
        (completedAt.getTime() - startTime.getTime()) / 1000
      );

      // Update scan status to completed
      const summary = `✅ Scan completed! Found ${finalCount.length} vulnerabilities (${counts.critical || 0} critical, ${counts.high || 0} high, ${counts.medium || 0} medium)`;
      await supabaseAdmin
        .from('scans')
        .update({
          status: 'completed',
          completed_at: completedAt.toISOString(),
          duration_seconds: durationSeconds,
          total_vulnerabilities: finalCount.length,
          critical_count: counts.critical || 0,
          high_count: counts.high || 0,
          medium_count: counts.medium || 0,
          low_count: counts.low || 0,
          info_count: counts.info || 0,
          error_message: summary,
        })
        .eq('id', scanId);

      await job.updateProgress(100);
      console.log(`[Scan ${scanId}] Completed successfully in ${durationSeconds}s`);

      return {
        scanId,
        vulnerabilitiesFound: finalCount.length,
      };
    } catch (error: any) {
      // Update scan status to failed
      await supabaseAdmin
        .from('scans')
        .update({
          status: 'failed',
          error_message: `❌ Scan failed: ${error.message}`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', scanId);

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process up to 5 scans concurrently
  }
);

scanWorker.on('completed', (job) => {
  console.log(`Scan job ${job.id} completed successfully`);
});

scanWorker.on('failed', (job, err) => {
  console.error(`Scan job ${job?.id} failed:`, err);
});
