// Package main is the entry point for the data sync service.
//
// This service fetches market data from government APIs and syncs it
// to the DealForge database for use in property analysis.
package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/dealforge/data-sync/internal/config"
	"github.com/dealforge/data-sync/internal/db"
	"github.com/dealforge/data-sync/internal/sync"
)

func main() {
	// Parse command line flags
	stateCode := flag.String("state", "TX", "State code for HUD FMR data (default: TX)")
	sources := flag.String("sources", "all", "Comma-separated list of sources to sync (hud,census,bls,all)")
	censusYear := flag.Int("census-year", 0, "Census ACS survey year (default: previous year)")
	blsStartYear := flag.Int("bls-start-year", 0, "BLS data start year (default: 3 years ago)")
	blsEndYear := flag.Int("bls-end-year", 0, "BLS data end year (default: current year)")
	dryRun := flag.Bool("dry-run", false, "Don't write to database, just log what would happen")
	flag.Parse()

	// Set up structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load configuration", "error", err)
		os.Exit(1)
	}
	cfg.DryRun = *dryRun

	// Parse sources
	sourceList := parseSourceList(*sources)
	if err := cfg.Validate(sourceList); err != nil {
		slog.Error("configuration validation failed", "error", err)
		os.Exit(1)
	}

	// Log startup
	slog.Info("starting data sync service",
		"sources", sourceList,
		"state", *stateCode,
		"dry_run", cfg.DryRun,
	)

	// Set up context with cancellation
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle shutdown signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		slog.Info("received shutdown signal", "signal", sig)
		cancel()
	}()

	// Initialize database client
	dbClient, err := db.NewClient(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer dbClient.Close()

	// Create orchestrator
	orch := sync.NewOrchestrator(
		dbClient,
		cfg.HUDAPIKey,
		cfg.CensusAPIKey,
		cfg.BLSAPIKey,
		cfg.MaxConcurrent,
		cfg.DryRun,
	)

	// Run sync based on requested sources
	var results []*sync.SyncResult

	for _, source := range sourceList {
		select {
		case <-ctx.Done():
			slog.Info("sync cancelled")
			os.Exit(0)
		default:
		}

		var result *sync.SyncResult
		var err error

		switch source {
		case "hud":
			result, err = orch.SyncHUD(ctx, *stateCode)
		case "census":
			result, err = orch.SyncCensus(ctx, *censusYear)
		case "bls":
			result, err = orch.SyncBLS(ctx, *blsStartYear, *blsEndYear)
		case "all":
			results, err = orch.SyncAll(ctx, *stateCode, *censusYear, *blsStartYear, *blsEndYear)
			if err != nil {
				slog.Error("sync failed", "error", err)
				os.Exit(1)
			}
			// Skip adding to results since SyncAll returns all results
			continue
		}

		if err != nil {
			slog.Error("sync failed", "source", source, "error", err)
			continue
		}

		results = append(results, result)
	}

	// Print summary
	fmt.Println("\n=== Sync Summary ===")
	for _, r := range results {
		fmt.Printf("\n%s:\n", r.Source)
		fmt.Printf("  Successful: %d\n", r.Successful)
		fmt.Printf("  Failed: %d\n", r.Failed)
		fmt.Printf("  Duration: %s\n", r.Duration)
		if len(r.Errors) > 0 && len(r.Errors) <= 10 {
			fmt.Printf("  Errors:\n")
			for _, e := range r.Errors {
				fmt.Printf("    - %s\n", e)
			}
		} else if len(r.Errors) > 10 {
			fmt.Printf("  First 10 errors (of %d):\n", len(r.Errors))
			for _, e := range r.Errors[:10] {
				fmt.Printf("    - %s\n", e)
			}
		}
	}

	slog.Info("data sync service completed")
}

// parseSourceList parses the sources flag into a list of source names.
func parseSourceList(sources string) []string {
	if sources == "" || sources == "all" {
		return []string{"all"}
	}

	parts := strings.Split(sources, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		s := strings.TrimSpace(strings.ToLower(p))
		if s == "hud" || s == "census" || s == "bls" {
			result = append(result, s)
		}
	}

	if len(result) == 0 {
		return []string{"all"}
	}
	return result
}
