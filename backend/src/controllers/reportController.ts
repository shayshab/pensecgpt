import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { supabaseAdmin } from '../config/database';
import { generateReport as generateReportService } from '../services/reports/reportGenerator';

export const getScanReports = async (req: AuthRequest, res: Response) => {
  try {
    const { scanId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('scan_id', scanId)
      .order('generated_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    throw new AppError(500, error.message || 'Failed to fetch reports');
  }
};

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { scanId } = req.params;
    const { report_type = 'pdf' } = req.body;

    // Verify scan exists
    const { data: scan } = await supabaseAdmin
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (!scan) {
      throw new AppError(404, 'Scan not found');
    }

    if (scan.status !== 'completed') {
      throw new AppError(400, 'Scan must be completed before generating report');
    }

    // Generate report
    const report = await generateReportService(scanId, report_type as string);

    // Save report record
    const { data: reportRecord, error } = await supabaseAdmin
      .from('reports')
      .insert({
        scan_id: scanId,
        project_id: scan.project_id,
        report_type,
        file_path: report.filePath,
        file_size: report.fileSize,
        created_by: req.user!.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(reportRecord);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, error.message || 'Failed to generate report');
  }
};

