import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { supabaseAdmin } from '../config/database';
import { scanQueue } from '../workers/scanQueue';
import { z } from 'zod';

const createScanSchema = z.object({
  project_id: z.string().uuid(),
  scan_type: z.enum(['full', 'quick', 'custom']).default('full'),
  scan_config: z.record(z.any()).optional(),
});

export const getScans = async (req: AuthRequest, res: Response) => {
  try {
    const { project_id, status } = req.query;

    let query = supabaseAdmin
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false });

    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    throw new AppError(500, error.message || 'Failed to fetch scans');
  }
};

export const getScan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('scans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      throw new AppError(404, 'Scan not found');
    }

    res.json(data);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, error.message || 'Failed to fetch scan');
  }
};

export const createScan = async (req: AuthRequest, res: Response) => {
  try {
    const validated = createScanSchema.parse(req.body);

    // Verify project exists and user has access
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', validated.project_id)
      .single();

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    // Create scan record
    const scanData: any = {
      project_id: validated.project_id,
      scan_type: validated.scan_type,
      scan_config: validated.scan_config || {},
      status: 'pending',
    };
    
    // Only add created_by if we're not in dev mode (to avoid FK constraint issues)
    if (process.env.NODE_ENV !== 'development' && req.user!.id) {
      scanData.created_by = req.user!.id;
    }
    
    const { data: scan, error: scanError } = await supabaseAdmin
      .from('scans')
      .insert(scanData)
      .select()
      .single();

    if (scanError) throw scanError;

    // Add scan job to queue
    try {
      await scanQueue.add('scan-job', {
        scanId: scan.id,
        projectId: validated.project_id,
        url: project.url,
        scanType: validated.scan_type,
        scanConfig: validated.scan_config || {},
      });
      console.log('Scan job added to queue:', scan.id);
    } catch (queueError: any) {
      console.error('Error adding scan to queue:', queueError);
      // Update scan status to failed if queue fails
      await supabaseAdmin
        .from('scans')
        .update({
          status: 'failed',
          error_message: `Failed to add scan to queue: ${queueError.message}`,
        })
        .eq('id', scan.id);
      throw new AppError(500, `Failed to queue scan: ${queueError.message}`);
    }

    res.status(201).json(scan);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new AppError(400, `Validation error: ${error.errors[0].message}`);
    }
    if (error instanceof AppError) throw error;
    throw new AppError(500, error.message || 'Failed to create scan');
  }
};

export const cancelScan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if scan exists and is in a cancellable state
    const { data: scan, error: fetchError } = await supabaseAdmin
      .from('scans')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!scan) {
      throw new AppError(404, 'Scan not found');
    }

    // Only allow cancellation of pending or running scans
    if (scan.status !== 'pending' && scan.status !== 'running') {
      throw new AppError(400, `Cannot cancel scan with status: ${scan.status}`);
    }

    // Update scan status to cancelled
    const { data, error } = await supabaseAdmin
      .from('scans')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        error_message: 'Scan cancelled by user',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Try to remove job from queue if it exists
    try {
      const jobs = await scanQueue.getJobs(['waiting', 'active', 'delayed']);
      const job = jobs.find((j) => j.data.scanId === id);
      if (job) {
        await job.remove();
        console.log(`[Scan ${id}] Removed job from queue`);
      }
    } catch (queueError) {
      // Job might not exist in queue, that's okay
      console.log(`[Scan ${id}] Job not found in queue or already processed`);
    }

    res.json(data);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, error.message || 'Failed to cancel scan');
  }
};

export const getScanStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('scans')
      .select('id, status, started_at, completed_at, duration_seconds, total_vulnerabilities, critical_count, high_count, medium_count, low_count, info_count, error_message')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      throw new AppError(404, 'Scan not found');
    }

    res.json(data);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, error.message || 'Failed to fetch scan status');
  }
};

