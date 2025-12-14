-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table (multi-tenant support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User organizations (many-to-many relationship)
CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Projects table (web applications to scan)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, paused, archived
    scan_config JSONB DEFAULT '{}', -- Custom scan configuration
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scans table (scan execution records)
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, cancelled
    scan_type VARCHAR(50) NOT NULL DEFAULT 'full', -- full, quick, custom
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    total_vulnerabilities INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    info_count INTEGER DEFAULT 0,
    scan_config JSONB DEFAULT '{}',
    error_message TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vulnerabilities table (detected vulnerabilities)
CREATE TABLE vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL, -- critical, high, medium, low, info
    category VARCHAR(100) NOT NULL, -- OWASP category, e.g., A01, A03, etc.
    cwe_id VARCHAR(20), -- Common Weakness Enumeration ID
    cvss_score DECIMAL(3,1), -- CVSS score 0.0-10.0
    affected_url VARCHAR(2048),
    affected_parameter VARCHAR(255),
    http_method VARCHAR(10), -- GET, POST, etc.
    request_payload TEXT,
    response_payload TEXT,
    proof_of_concept TEXT,
    recommendation TEXT,
    ai_analysis TEXT, -- AI-powered analysis
    status VARCHAR(50) DEFAULT 'open', -- open, confirmed, false_positive, fixed, risk_accepted
    tags TEXT[], -- Array of tags
    metadata JSONB DEFAULT '{}', -- Additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan results table (detailed scan results)
CREATE TABLE scan_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    result_type VARCHAR(50) NOT NULL, -- vulnerability, info, warning
    data JSONB NOT NULL, -- Flexible JSON structure for different result types
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table (generated reports)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- pdf, json, html
    file_path VARCHAR(500), -- Path to stored report file
    file_size BIGINT, -- File size in bytes
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Subscriptions table (user subscription plans)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL, -- free, pro, enterprise
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, expired
    monthly_scan_limit INTEGER DEFAULT 10,
    current_month_scans INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_scans_project ON scans(project_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_vulnerabilities_scan ON vulnerabilities(scan_id);
CREATE INDEX idx_vulnerabilities_project ON vulnerabilities(project_id);
CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX idx_vulnerabilities_category ON vulnerabilities(category);
CREATE INDEX idx_scan_results_scan ON scan_results(scan_id);
CREATE INDEX idx_reports_scan ON reports(scan_id);
CREATE INDEX idx_user_organizations_user ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org ON user_organizations(organization_id);

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see organizations they belong to
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies: Users can view their user_organizations
CREATE POLICY "Users can view their user_organizations"
    ON user_organizations FOR SELECT
    USING (user_id = auth.uid());

-- RLS Policies: Users can view projects in their organizations
CREATE POLICY "Users can view projects in their organizations"
    ON projects FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies: Users can view scans for their projects
CREATE POLICY "Users can view scans for their projects"
    ON scans FOR SELECT
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            INNER JOIN user_organizations uo ON p.organization_id = uo.organization_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- RLS Policies: Users can view vulnerabilities for their projects
CREATE POLICY "Users can view vulnerabilities for their projects"
    ON vulnerabilities FOR SELECT
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            INNER JOIN user_organizations uo ON p.organization_id = uo.organization_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- RLS Policies: Users can view scan results for their scans
CREATE POLICY "Users can view scan results for their scans"
    ON scan_results FOR SELECT
    USING (
        scan_id IN (
            SELECT s.id FROM scans s
            INNER JOIN projects p ON s.project_id = p.id
            INNER JOIN user_organizations uo ON p.organization_id = uo.organization_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- RLS Policies: Users can view reports for their scans
CREATE POLICY "Users can view reports for their scans"
    ON reports FOR SELECT
    USING (
        scan_id IN (
            SELECT s.id FROM scans s
            INNER JOIN projects p ON s.project_id = p.id
            INNER JOIN user_organizations uo ON p.organization_id = uo.organization_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- RLS Policies: Users can view subscriptions for their organizations
CREATE POLICY "Users can view subscriptions for their organizations"
    ON subscriptions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scans_updated_at BEFORE UPDATE ON scans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vulnerabilities_updated_at BEFORE UPDATE ON vulnerabilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();






