// Package config provides configuration management for the data sync service.
package config

import (
	"fmt"
	"os"
)

// Config holds all configuration values for the data sync service.
type Config struct {
	// Database connection
	DatabaseURL string

	// API Keys
	HUDAPIKey    string
	CensusAPIKey string
	BLSAPIKey    string

	// Sync settings
	MaxConcurrent int  // Max concurrent API requests
	MaxRetries    int  // Max retry attempts for transient failures
	DryRun        bool // If true, don't write to DB
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		HUDAPIKey:     os.Getenv("HUD_API_KEY"),
		CensusAPIKey:  os.Getenv("CENSUS_API_KEY"),
		BLSAPIKey:     os.Getenv("BLS_API_KEY"),
		MaxConcurrent: 1, // Sequential requests to respect BLS rate limits
		MaxRetries:    3, // Retry transient failures up to 3 times
		DryRun:        os.Getenv("DRY_RUN") == "true",
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	return cfg, nil
}

// Validate checks that required API keys are set based on which sources will be synced.
func (c *Config) Validate(sources []string) error {
	for _, source := range sources {
		switch source {
		case "hud":
			if c.HUDAPIKey == "" {
				return fmt.Errorf("HUD_API_KEY is required for HUD data sync")
			}
		case "census":
			// Census API works without a key but has rate limits
			// Key is recommended for production use
		case "bls":
			// BLS API works without a key but has rate limits
			// Key is recommended for production use
		}
	}
	return nil
}
