INSERT INTO scheduled_queries (
    name,
    schedule,
    sql_query
)
VALUES (
    'Top Gainers',
    '0 18 * * 1-5',
    $$
    SELECT
        d.stock_code,
        s.stock_name,
        d.previous,
        d.close,
        d.change,
        ROUND(
            (d.change / NULLIF(d.previous, 0)) * 100,
            2
        ) AS change_percentage
    FROM stock_daily_summaries d
    JOIN stocks s
        ON s.stock_code = d.stock_code
    WHERE d.trading_date = (
        SELECT MAX(trading_date)
        FROM stock_daily_summaries
    )
      AND d.previous > 0
    ORDER BY change_percentage DESC
    LIMIT 10;
    $$
);