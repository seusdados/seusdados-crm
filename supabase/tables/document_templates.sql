CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content_html TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'html',
    category VARCHAR(100),
    template_variables JSONB DEFAULT '{}',
    auto_detected_fields JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);