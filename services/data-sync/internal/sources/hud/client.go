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

// GetFMRByZip fetches Fair Market Rent data for a ZIP code.
func (c *Client) GetFMRByZip(ctx context.Context, zipCode string) (*db.HUDFairMarketRent, error) {
	url := fmt.Sprintf("%s/data/%s", baseURL, zipCode)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch FMR: %w", err)
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

	var fmrResp FMRResponse
	if err := json.Unmarshal(body, &fmrResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return c.toDBRecord(&fmrResp), nil
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
