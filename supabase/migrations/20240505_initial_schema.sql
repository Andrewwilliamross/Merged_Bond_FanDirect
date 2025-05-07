-- Create tables for the FanDirect Connect application

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists public.profiles (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    full_name text,
    username text,
    avatar_url text,
    phone text,
    location text,
    role text default 'user'::text,
    subscribed_to uuid references public.profiles(id)
);

-- Create contacts table
create table if not exists public.contacts (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    email text,
    phone text,
    notes text,
    owner_id uuid not null references public.profiles(id)
);

-- Create campaigns table
create table if not exists public.campaigns (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    audience text not null,
    scheduled_for timestamp with time zone not null,
    status text default 'draft'::text,
    stats jsonb,
    creator_id uuid not null references public.profiles(id)
);

-- Create campaign_responses table
create table if not exists public.campaign_responses (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    content text not null,
    category text,
    campaign_id uuid references public.campaigns(id),
    responder_id uuid references public.profiles(id)
);

-- Create subscription_tiers table
create table if not exists public.subscription_tiers (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    description text,
    price numeric not null,
    creator_id uuid not null references public.profiles(id)
);

-- Create agent_heartbeats table
create table if not exists public.agent_heartbeats (
    vm_id text primary key,
    last_seen timestamp with time zone default timezone('utc'::text, now()) not null,
    agent_version text
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_responses enable row level security;
alter table public.subscription_tiers enable row level security;
alter table public.agent_heartbeats enable row level security;

-- Create RLS policies
create policy "Profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Contacts are viewable by their owner"
    on public.contacts for select
    using (auth.uid() = owner_id);

create policy "Users can create contacts"
    on public.contacts for insert
    with check (auth.uid() = owner_id);

create policy "Users can update their own contacts"
    on public.contacts for update
    using (auth.uid() = owner_id);

create policy "Users can delete their own contacts"
    on public.contacts for delete
    using (auth.uid() = owner_id);

create policy "Campaigns are viewable by their creator"
    on public.campaigns for select
    using (auth.uid() = creator_id);

create policy "Users can create campaigns"
    on public.campaigns for insert
    with check (auth.uid() = creator_id);

create policy "Users can update their own campaigns"
    on public.campaigns for update
    using (auth.uid() = creator_id);

create policy "Users can delete their own campaigns"
    on public.campaigns for delete
    using (auth.uid() = creator_id);

create policy "Campaign responses are viewable by campaign creator"
    on public.campaign_responses for select
    using (exists (
        select 1 from public.campaigns
        where campaigns.id = campaign_responses.campaign_id
        and campaigns.creator_id = auth.uid()
    ));

create policy "Users can create campaign responses"
    on public.campaign_responses for insert
    with check (true);

create policy "Subscription tiers are viewable by everyone"
    on public.subscription_tiers for select
    using (true);

create policy "Users can create subscription tiers"
    on public.subscription_tiers for insert
    with check (auth.uid() = creator_id);

create policy "Users can update their own subscription tiers"
    on public.subscription_tiers for update
    using (auth.uid() = creator_id);

create policy "Users can delete their own subscription tiers"
    on public.subscription_tiers for delete
    using (auth.uid() = creator_id);

create policy "Agent heartbeats are viewable by everyone"
    on public.agent_heartbeats for select
    using (true);

create policy "Agents can update their own heartbeat"
    on public.agent_heartbeats for update
    using (true);

create policy "Agents can insert their heartbeat"
    on public.agent_heartbeats for insert
    with check (true);

-- Create indexes for better performance
create index if not exists profiles_username_idx on public.profiles(username);
create index if not exists contacts_owner_id_idx on public.contacts(owner_id);
create index if not exists campaigns_creator_id_idx on public.campaigns(creator_id);
create index if not exists campaign_responses_campaign_id_idx on public.campaign_responses(campaign_id);
create index if not exists subscription_tiers_creator_id_idx on public.subscription_tiers(creator_id); 