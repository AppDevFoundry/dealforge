// Package db provides PostgreSQL database operations for the data sync service.
package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Client wraps the PostgreSQL connection pool.
type Client struct {
	pool *pgxpool.Pool
}

// NewClient creates a new database client with a connection pool.
func NewClient(ctx context.Context, databaseURL string) (*Client, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	// Configure connection pool
	config.MaxConns = 10
	config.MinConns = 2

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Client{pool: pool}, nil
}

// Close closes the database connection pool.
func (c *Client) Close() {
	if c.pool != nil {
		c.pool.Close()
	}
}

// Pool returns the underlying connection pool for direct access.
func (c *Client) Pool() *pgxpool.Pool {
	return c.pool
}
