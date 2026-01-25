package sync

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"golang.org/x/sync/errgroup"
	"golang.org/x/sync/semaphore"

	"github.com/dealforge/data-sync/internal/db"
	"github.com/dealforge/data-sync/internal/sources/bls"
	"github.com/dealforge/data-sync/internal/sources/census"
	"github.com/dealforge/data-sync/internal/sources/hud"
)

// Orchestrator coordinates data syncing from multiple sources.
type Orchestrator struct {
	db           *db.Client
	hudClient    *hud.Client
	censusClient *census.Client
	blsClient    *bls.Client
	maxConcurrent int64
	dryRun       bool
}

// SyncResult contains statistics from a sync operation.
type SyncResult struct {
	Source       string
	Successful   int
	Failed       int
	Skipped      int
	Duration     time.Duration
	Errors       []string
}

// NewOrchestrator creates a new sync orchestrator.
func NewOrchestrator(dbClient *db.Client, hudAPIKey, censusAPIKey, blsAPIKey string, maxConcurrent int, dryRun bool) *Orchestrator {
	return &Orchestrator{
		db:            dbClient,
		hudClient:     hud.NewClient(hudAPIKey),
		censusClient:  census.NewClient(censusAPIKey),
		blsClient:     bls.NewClient(blsAPIKey),
		maxConcurrent: int64(maxConcurrent),
		dryRun:        dryRun,
	}
}

// SyncHUD syncs HUD Fair Market Rent data for the given state.
// It fetches state-level data (all metro areas and non-metro counties) and upserts each record.
func (o *Orchestrator) SyncHUD(ctx context.Context, stateCode string) (*SyncResult, error) {
	start := time.Now()
	result := &SyncResult{Source: "HUD FMR"}

	if stateCode == "" {
		stateCode = "TX" // Default to Texas
	}

	slog.Info("starting HUD FMR sync", "state", stateCode)

	// Fetch state-level data (includes all metro areas and non-metro counties)
	records, err := o.hudClient.GetFMRRecordsForState(ctx, stateCode)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch state FMR data: %w", err)
	}

	slog.Info("fetched HUD FMR records", "count", len(records))

	if o.dryRun {
		result.Successful = len(records)
		result.Duration = time.Since(start)
		slog.Info("dry run - skipping database upserts", "record_count", len(records))
		return result, nil
	}

	// Upsert records concurrently
	sem := semaphore.NewWeighted(o.maxConcurrent)
	g, ctx := errgroup.WithContext(ctx)

	successCh := make(chan int, len(records))
	failCh := make(chan string, len(records))

	for _, record := range records {
		record := record // capture loop var
		g.Go(func() error {
			if err := sem.Acquire(ctx, 1); err != nil {
				return err
			}
			defer sem.Release(1)

			if err := o.db.UpsertHUDFMR(ctx, record); err != nil {
				name := ""
				if record.MetroName != nil {
					name = *record.MetroName
				} else if record.CountyName != nil {
					name = *record.CountyName
				}
				slog.Warn("failed to upsert HUD FMR", "entity", name, "error", err)
				failCh <- fmt.Sprintf("%s: %v", name, err)
				return nil
			}

			successCh <- 1
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	close(successCh)
	close(failCh)

	for range successCh {
		result.Successful++
	}
	for errMsg := range failCh {
		result.Failed++
		result.Errors = append(result.Errors, errMsg)
	}

	result.Duration = time.Since(start)
	slog.Info("completed HUD FMR sync",
		"successful", result.Successful,
		"failed", result.Failed,
		"duration", result.Duration,
	)

	return result, nil
}

// SyncCensus syncs Census ACS data for all Texas counties.
func (o *Orchestrator) SyncCensus(ctx context.Context, year int) (*SyncResult, error) {
	start := time.Now()
	result := &SyncResult{Source: "Census ACS"}

	if year == 0 {
		year = time.Now().Year() - 1 // Use previous year's data
	}

	counties := TexasCounties
	slog.Info("starting Census ACS sync", "county_count", len(counties), "year", year)

	sem := semaphore.NewWeighted(o.maxConcurrent)
	g, ctx := errgroup.WithContext(ctx)

	successCh := make(chan int, len(counties))
	failCh := make(chan string, len(counties))

	for _, county := range counties {
		county := county // capture loop var
		g.Go(func() error {
			if err := sem.Acquire(ctx, 1); err != nil {
				return err
			}
			defer sem.Release(1)

			record, err := o.censusClient.GetCountyDemographics(ctx, county.FIPS, year)
			if err != nil {
				slog.Warn("failed to fetch Census data", "county", county.Name, "error", err)
				failCh <- fmt.Sprintf("%s County: %v", county.Name, err)
				return nil
			}

			if !o.dryRun {
				if err := o.db.UpsertCensusDemographic(ctx, record); err != nil {
					slog.Warn("failed to upsert Census data", "county", county.Name, "error", err)
					failCh <- fmt.Sprintf("%s County DB: %v", county.Name, err)
					return nil
				}
			}

			successCh <- 1
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	close(successCh)
	close(failCh)

	for range successCh {
		result.Successful++
	}
	for errMsg := range failCh {
		result.Failed++
		result.Errors = append(result.Errors, errMsg)
	}

	result.Duration = time.Since(start)
	slog.Info("completed Census ACS sync",
		"successful", result.Successful,
		"failed", result.Failed,
		"duration", result.Duration,
	)

	return result, nil
}

// SyncBLS syncs BLS LAUS data for all Texas counties.
func (o *Orchestrator) SyncBLS(ctx context.Context, startYear, endYear int) (*SyncResult, error) {
	start := time.Now()
	result := &SyncResult{Source: "BLS LAUS"}

	currentYear := time.Now().Year()
	if endYear == 0 {
		endYear = currentYear
	}
	if startYear == 0 {
		startYear = endYear - 2 // Last 3 years by default
	}

	counties := TexasCounties
	slog.Info("starting BLS LAUS sync",
		"county_count", len(counties),
		"start_year", startYear,
		"end_year", endYear,
	)

	sem := semaphore.NewWeighted(o.maxConcurrent)
	g, ctx := errgroup.WithContext(ctx)

	successCh := make(chan int, len(counties)*36) // ~36 months per county
	failCh := make(chan string, len(counties))

	for _, county := range counties {
		county := county // capture loop var
		g.Go(func() error {
			if err := sem.Acquire(ctx, 1); err != nil {
				return err
			}
			defer sem.Release(1)

			records, err := o.blsClient.GetCountyEmployment(ctx, county.FIPS, county.Name, startYear, endYear)
			if err != nil {
				slog.Warn("failed to fetch BLS data", "county", county.Name, "error", err)
				failCh <- fmt.Sprintf("%s County: %v", county.Name, err)
				return nil
			}

			if !o.dryRun {
				if err := o.db.BatchUpsertBLSEmployment(ctx, records); err != nil {
					slog.Warn("failed to upsert BLS data", "county", county.Name, "error", err)
					failCh <- fmt.Sprintf("%s County DB: %v", county.Name, err)
					return nil
				}
			}

			successCh <- len(records)
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	close(successCh)
	close(failCh)

	for count := range successCh {
		result.Successful += count
	}
	for errMsg := range failCh {
		result.Failed++
		result.Errors = append(result.Errors, errMsg)
	}

	result.Duration = time.Since(start)
	slog.Info("completed BLS LAUS sync",
		"successful_records", result.Successful,
		"failed_counties", result.Failed,
		"duration", result.Duration,
	)

	return result, nil
}

// SyncAll runs sync for all data sources.
func (o *Orchestrator) SyncAll(ctx context.Context, stateCode string, censusYear, blsStartYear, blsEndYear int) ([]*SyncResult, error) {
	var results []*SyncResult

	// Run HUD sync
	hudResult, err := o.SyncHUD(ctx, stateCode)
	if err != nil {
		return results, fmt.Errorf("HUD sync failed: %w", err)
	}
	results = append(results, hudResult)

	// Run Census sync
	censusResult, err := o.SyncCensus(ctx, censusYear)
	if err != nil {
		return results, fmt.Errorf("Census sync failed: %w", err)
	}
	results = append(results, censusResult)

	// Run BLS sync
	blsResult, err := o.SyncBLS(ctx, blsStartYear, blsEndYear)
	if err != nil {
		return results, fmt.Errorf("BLS sync failed: %w", err)
	}
	results = append(results, blsResult)

	return results, nil
}
