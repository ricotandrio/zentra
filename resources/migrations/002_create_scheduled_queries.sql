CREATE TABLE scheduled_queries (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    schedule TEXT,
    sql_query TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
