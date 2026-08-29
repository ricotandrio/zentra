CREATE TABLE stocks (
    stock_code VARCHAR(20) PRIMARY KEY,
    stock_name VARCHAR(255) NOT NULL
);

CREATE TABLE stock_daily_summaries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    stock_code VARCHAR(20) NOT NULL,
    trading_date DATE NOT NULL,

    id_stock_summary BIGINT,

    remarks TEXT,

    previous NUMERIC(20, 4),
    open_price NUMERIC(20, 4),
    first_trade NUMERIC(20, 4),
    high NUMERIC(20, 4),
    low NUMERIC(20, 4),
    close NUMERIC(20, 4),
    change NUMERIC(20, 4),

    volume BIGINT,
    value NUMERIC(30, 4),
    frequency BIGINT,

    index_individual NUMERIC(20, 4),

    offer NUMERIC(20, 4),
    offer_volume BIGINT,

    bid NUMERIC(20, 4),
    bid_volume BIGINT,

    listed_shares BIGINT,
    tradeable_shares BIGINT,

    weight_for_index NUMERIC(30, 4),

    foreign_sell BIGINT,
    foreign_buy BIGINT,

    delisting_date DATE,

    non_regular_volume BIGINT,
    non_regular_value NUMERIC(30, 4),
    non_regular_frequency BIGINT,

    persen NUMERIC(20, 6),
    percentage NUMERIC(20, 6),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_stock_daily_summary_stock
        FOREIGN KEY (stock_code)
        REFERENCES stocks(stock_code),

    CONSTRAINT uq_stock_daily_summary
        UNIQUE (stock_code, trading_date)
);

CREATE INDEX idx_stock_daily_summaries_date
    ON stock_daily_summaries(trading_date);

CREATE INDEX idx_stock_daily_summaries_stock_code
    ON stock_daily_summaries(stock_code);
