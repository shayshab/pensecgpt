import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { supabaseAdmin } from '../config/database';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  description: z.string().optional(),
  organization_id: z.string().uuid().optional(), // Optional - backend will create default in dev mode
  scan_config: z.record(z.any()).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  scan_config: z.record(z.any()).optional(),
});

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const { organization_id } = req.query;

    // In development mode, always return all projects
    if (process.env.NODE_ENV === 'development' && !organization_id) {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects in dev mode:', error);
        throw error;
      }

      return res.json(data || []);
    }

    // Production mode or with organization filter
    let query = supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    } else {
      // Get user's organizations first
      const { data: userOrgs } = await supabaseAdmin
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', req.user!.id);

      if (!userOrgs || userOrgs.length === 0) {
        return res.json([]);
      }

      const orgIds = userOrgs.map((uo) => uo.organization_id);
      query = query.in('organization_id', orgIds);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error('Error in getProjects:', error);
    throw new AppError(500, error.message || 'Failed to fetch projects');
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      throw new AppError(404, 'Project not found');
    }

    res.json(data);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, error.message || 'Failed to fetch project');
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Creating project with data:', req.body);
    const validated = createProjectSchema.parse(req.body);
    console.log('Validated data:', validated);

    let organizationId = validated.organization_id;

    // In development mode, create or get default organization if not provided
    if (process.env.NODE_ENV === 'development' && !organizationId) {
      // In dev mode, just find or create a default organization
      // We don't need to link it to user_organizations since we bypass RLS
      const { data: existingOrgs } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('name', 'Default Organization')
        .limit(1);

      if (existingOrgs && existingOrgs.length > 0) {
        organizationId = existingOrgs[0].id;
      } else {
        // Create a default organization
        const slug = `default-org-${Date.now()}`;
        const { data: newOrg, error: orgError } = await supabaseAdmin
          .from('organizations')
          .insert({
            name: 'Default Organization',
            slug: slug,
          })
          .select()
          .single();

        if (orgError || !newOrg) {
          console.error('Failed to create organization:', orgError);
          throw new AppError(500, `Failed to create default organization: ${orgError?.message || 'Unknown error'}`);
        }

        organizationId = newOrg.id;
      }
    }

    // Verify user has access to organization (if organizationId exists)
    // Skip this check in development mode
    if (organizationId && process.env.NODE_ENV !== 'development') {
      const { data: userOrg } = await supabaseAdmin
        .from('user_organizations')
        .select('*')
        .eq('user_id', req.user!.id)
        .eq('organization_id', organizationId)
        .single();

      if (!userOrg) {
        throw new AppError(403, 'Access denied to this organization');
      }
    }

    console.log('Inserting project with organizationId:', organizationId);
    
    // Prepare project data
    const projectData: any = {
      name: validated.name,
      url: validated.url,
      organization_id: organizationId,
      scan_config: validated.scan_config || {},
    };
    
    // Add optional fields only if they exist
    if (validated.description) {
      projectData.description = validated.description;
    }
    
    // Only add created_by if we're not in dev mode (to avoid FK constraint issues)
    // In dev mode, the user doesn't exist in auth.users, so we skip this field
    if (process.env.NODE_ENV !== 'development' && req.user!.id) {
      projectData.created_by = req.user!.id;
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating project:', error);
      throw error;
    }

    console.log('Project created successfully:', data?.id);
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error in createProject:', error);
    if (error instanceof z.ZodError) {
      throw new AppError(400, `Validation error: ${error.errors[0].message}`);
    }
    if (error instanceof AppError) throw error;
    throw new AppError(500, error.message || 'Failed to create project');
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = updateProjectSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(validated)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      throw new AppError(404, 'Project not found');
    }

    res.json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new AppError(400, `Validation error: ${error.errors[0].message}`);
    }
    if (error instanceof AppError) throw error;
    throw new AppError(500, error.message || 'Failed to update project');
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error: any) {
    throw new AppError(500, error.message || 'Failed to delete project');
  }
};

