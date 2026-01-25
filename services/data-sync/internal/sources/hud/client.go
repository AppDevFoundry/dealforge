package hud

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/dealforge/data-sync/internal/db"
)

const (
	baseURL = "https://www.huduser.gov/hudapi/public/fmr"
)

// Client provides access to the HUD FMR API.
type Client struct {
	apiKey     string
	httpClient *http.Client
}

// NewClient creates a new HUD API client.
func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewClientWithHTTPClient creates a new HUD API client with a custom HTTP client.
// This is primarily for testing purposes.
func NewClientWithHTTPClient(apiKey string, httpClient *http.Client) *Client {
	return &Client{
		apiKey:     apiKey,
		httpClient: httpClient,
	}
}

// GetStateData fetches all FMR data for a state (metro areas and non-metro counties).
func (c *Client) GetStateData(ctx context.Context, stateCode string) (*StateDataResponse, error) {
	url := fmt.Sprintf("%s/statedata/%s", baseURL, stateCode)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch state FMR: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var stateResp StateDataResponse
	if err := json.Unmarshal(body, &stateResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &stateResp, nil
}

// GetEntityData fetches FMR data for a specific entity (metro area or county).
// entityCode format: METRO{code}M{code} for metro areas, COUNTY{fips} for counties
func (c *Client) GetEntityData(ctx context.Context, entityCode string) (*EntityDataResponse, error) {
	url := fmt.Sprintf("%s/data/%s", baseURL, entityCode)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch entity FMR: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var entityResp EntityDataResponse
	if err := json.Unmarshal(body, &entityResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &entityResp, nil
}

// GetFMRRecordsForState fetches all FMR data for a state and converts to DB records.
// This includes metro area and county-level data. For areas with Small Area FMRs,
// it also fetches ZIP-level data.
func (c *Client) GetFMRRecordsForState(ctx context.Context, stateCode string) ([]*db.HUDFairMarketRent, error) {
	stateData, err := c.GetStateData(ctx, stateCode)
	if err != nil {
		return nil, fmt.Errorf("failed to get state data: %w", err)
	}

	var records []*db.HUDFairMarketRent
	fiscalYear, _ := strconv.Atoi(stateData.Data.Year)

	// Process metro areas
	for _, metro := range stateData.Data.MetroAreas {
		record := &db.HUDFairMarketRent{
			ZipCode:      "",                             // Metro-level, no specific ZIP
			EntityCode:   ptrString(metro.Code),          // e.g., METRO10180M10180
			FiscalYear:   fiscalYear,
			MetroName:    ptrString(metro.MetroName),
			StateName:    ptrString(stateData.Data.StateName),
			StateCode:    ptrString(stateCode),
			Efficiency:   ptrInt(metro.Efficiency),
			OneBedroom:   ptrInt(metro.OneBedroom),
			TwoBedroom:   ptrInt(metro.TwoBedroom),
			ThreeBedroom: ptrInt(metro.ThreeBedroom),
			FourBedroom:  ptrInt(metro.FourBedroom),
		}
		records = append(records, record)
	}

	// Process non-metro counties
	for _, county := range stateData.Data.Counties {
		record := &db.HUDFairMarketRent{
			ZipCode:      "",                            // County-level, no specific ZIP
			EntityCode:   ptrString(county.Code),        // e.g., COUNTY48001
			FiscalYear:   fiscalYear,
			CountyName:   ptrString(county.CountyName),
			StateName:    ptrString(stateData.Data.StateName),
			StateCode:    ptrString(stateCode),
			Efficiency:   ptrInt(county.Efficiency),
			OneBedroom:   ptrInt(county.OneBedroom),
			TwoBedroom:   ptrInt(county.TwoBedroom),
			ThreeBedroom: ptrInt(county.ThreeBedroom),
			FourBedroom:  ptrInt(county.FourBedroom),
		}
		records = append(records, record)
	}

	return records, nil
}

// GetZIPLevelFMR fetches ZIP-level FMR data for an entity with Small Area FMRs.
func (c *Client) GetZIPLevelFMR(ctx context.Context, entityCode string) ([]*db.HUDFairMarketRent, error) {
	entityData, err := c.GetEntityData(ctx, entityCode)
	if err != nil {
		return nil, fmt.Errorf("failed to get entity data: %w", err)
	}

	// Check if this entity has Small Area FMRs
	if entityData.Data.SmallAreaStatus != "1" || len(entityData.Data.SmallAreas) == 0 {
		return nil, nil // No ZIP-level data available
	}

	fiscalYear, _ := strconv.Atoi(entityData.Data.Year)
	var records []*db.HUDFairMarketRent

	for _, sa := range entityData.Data.SmallAreas {
		record := &db.HUDFairMarketRent{
			ZipCode:         sa.ZipCode,
			EntityCode:      ptrString(entityCode),
			FiscalYear:      fiscalYear,
			MetroName:       ptrString(entityData.Data.MetroName),
			CountyName:      ptrString(entityData.Data.CountyName),
			StateName:       ptrString(entityData.Data.StateName),
			StateCode:       ptrString(entityData.Data.StateCode),
			Efficiency:      ptrInt(sa.Efficiency),
			OneBedroom:      ptrInt(sa.OneBedroom),
			TwoBedroom:      ptrInt(sa.TwoBedroom),
			ThreeBedroom:    ptrInt(sa.ThreeBedroom),
			FourBedroom:     ptrInt(sa.FourBedroom),
			SmallAreaStatus: ptrString("1"),
		}
		records = append(records, record)
	}

	return records, nil
}

// toDBRecord converts an API response to a database record.
func (c *Client) toDBRecord(resp *FMRResponse) *db.HUDFairMarketRent {
	data := resp.Data.BasicData

	fiscalYear, _ := strconv.Atoi(data.Year)

	record := &db.HUDFairMarketRent{
		ZipCode:         data.ZipCode,
		FiscalYear:      fiscalYear,
		SmallAreaStatus: ptrString(data.SmallAreaStatus),
	}

	// Set county/metro info
	if data.CountyName != "" {
		record.CountyName = ptrString(data.CountyName)
	} else if data.CountiesName != "" {
		record.CountyName = ptrString(data.CountiesName)
	}

	if data.MetroName != "" {
		record.MetroName = ptrString(data.MetroName)
	}
	if data.StateName != "" {
		record.StateName = ptrString(data.StateName)
	}
	if data.StateCode != "" {
		record.StateCode = ptrString(data.StateCode)
	}

	// Use small area data if available (ZIP-specific), otherwise use metro-level
	if resp.Data.SmallAreaData.ZipCode != "" && data.SmallAreaStatus == "1" {
		sa := resp.Data.SmallAreaData
		record.Efficiency = ptrInt(sa.Efficiency)
		record.OneBedroom = ptrInt(sa.OneBedroom)
		record.TwoBedroom = ptrInt(sa.TwoBedroom)
		record.ThreeBedroom = ptrInt(sa.ThreeBedroom)
		record.FourBedroom = ptrInt(sa.FourBedroom)
	} else {
		record.Efficiency = ptrInt(data.Efficiency)
		record.OneBedroom = ptrInt(data.OneBedroom)
		record.TwoBedroom = ptrInt(data.TwoBedroom)
		record.ThreeBedroom = ptrInt(data.ThreeBedroom)
		record.FourBedroom = ptrInt(data.FourBedroom)
	}

	return record
}

// Helper functions for creating pointers
func ptrString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func ptrInt(i int) *int {
	if i == 0 {
		return nil
	}
	return &i
}
