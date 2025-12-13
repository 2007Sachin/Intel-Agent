-- Drop existing table if needed
DROP TABLE IF EXISTS competitor_updates CASCADE;

-- Create competitor_updates table with category column
CREATE TABLE competitor_updates (
    id SERIAL PRIMARY KEY,
    competitor_name TEXT NOT NULL,
    update_summary TEXT NOT NULL,
    sentiment_score FLOAT CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    category TEXT DEFAULT 'General',
    is_significant BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE competitor_updates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view updates
CREATE POLICY "Allow public read access"
ON competitor_updates
FOR SELECT
TO public
USING (true);

-- Add indexes for performance
CREATE INDEX idx_competitor_name ON competitor_updates(competitor_name);
CREATE INDEX idx_created_at ON competitor_updates(created_at DESC);
CREATE INDEX idx_category ON competitor_updates(category);
