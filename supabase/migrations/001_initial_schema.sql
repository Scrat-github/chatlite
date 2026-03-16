-- ChatLite Database Schema

-- Enable RLS
alter database postgres set "app.settings.jwt_secret" = 'your-jwt-secret';

-- Workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'canceled', 'past_due')) DEFAULT 'trial',
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    plan TEXT CHECK (plan IN ('free', 'pro')) DEFAULT 'free'
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'agent')) DEFAULT 'agent',
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visitors table
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    external_id TEXT,
    name TEXT,
    email TEXT,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    visitor_name TEXT,
    visitor_email TEXT,
    status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT CHECK (sender_type IN ('visitor', 'agent')) NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
CREATE POLICY "Users can view their own workspace"
    ON workspaces FOR SELECT
    USING (id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can update their workspace"
    ON workspaces FOR UPDATE
    USING (id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their workspace"
    ON profiles FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- RLS Policies for visitors
CREATE POLICY "Users can view visitors in their workspace"
    ON visitors FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert visitors in their workspace"
    ON visitors FOR INSERT
    WITH CHECK (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update visitors in their workspace"
    ON visitors FOR UPDATE
    USING (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations in their workspace"
    ON conversations FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert conversations in their workspace"
    ON conversations FOR INSERT
    WITH CHECK (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update conversations in their workspace"
    ON conversations FOR UPDATE
    USING (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their workspace"
    ON messages FOR SELECT
    USING (conversation_id IN (
        SELECT id FROM conversations WHERE workspace_id IN (
            SELECT workspace_id FROM profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert messages in their workspace"
    ON messages FOR INSERT
    WITH CHECK (conversation_id IN (
        SELECT id FROM conversations WHERE workspace_id IN (
            SELECT workspace_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create workspace
    INSERT INTO workspaces (name, slug, subscription_status, trial_ends_at)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'workspace_name', 'My Workspace'),
        COALESCE(
            regexp_replace(lower(COALESCE(NEW.raw_user_meta_data->>'workspace_name', 'my-workspace')), '[^a-z0-9]+', '-', 'g'),
            'my-workspace'
        ) || '-' || substr(gen_random_uuid()::text, 1, 8),
        'trial',
        NOW() + INTERVAL '14 days'
    )
    RETURNING id INTO NEW.workspace_id;

    -- Create profile
    INSERT INTO profiles (id, email, workspace_id, role)
    VALUES (NEW.id, NEW.email, NEW.workspace_id, 'admin');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Indexes for performance
CREATE INDEX idx_conversations_workspace_id ON conversations(workspace_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_visitor_id ON conversations(visitor_id);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_visitors_workspace_id ON visitors(workspace_id);
CREATE INDEX idx_profiles_workspace_id ON profiles(workspace_id);
