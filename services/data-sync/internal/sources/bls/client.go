package bls

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/dealforge/data-sync/internal/db"
)

// ErrDailyLimitReached is returned when the BLS API daily request limit is exceeded.
var ErrDailyLimitReached = errors.New("BLS API daily request limit reached")

const (
	baseURLV1 = "https://api.bls.gov/publicAPI/v1/timeseries/data/"
	baseURLV2 = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
)

// Client provides access to the BLS LAUS API.
type Client struct {
	apiKey     string
	httpClient *http.Client
}

// NewClient creates a new BLS API client.
func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// NewClientWithHTTPClient creates a new BLS API client with a custom HTTP client.
// This is primarily for testing purposes.
func NewClientWithHTTPClient(apiKey string, httpClient *http.Client) *Client {
	return &Client{
		apiKey:     apiKey,
		httpClient: httpClient,
	}
}

// GetCountyEmploymentWithRetry fetches LAUS employment data with automatic retry logic.
// It will retry transient failures (HTTP errors, timeouts) with exponential backoff.
// Rate limit errors (ErrDailyLimitReached) are NOT retried.
func (c *Client) GetCountyEmploymentWithRetry(ctx context.Context, countyFIPS, countyName string, startYear, endYear, maxRetries int) ([]*db.BLSEmployment, error) {
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		records, err := c.GetCountyEmployment(ctx, countyFIPS, countyName, startYear, endYear)

		// Success - return immediately
		if err == nil {
			return records, nil
		}

		// Don't retry rate limit errors - these should fail immediately
		if errors.Is(err, ErrDailyLimitReached) {
			return nil, err
		}

		lastErr = err

		// If we've exhausted retries, return the last error
		if attempt >= maxRetries {
			break
		}

		// Exponential backoff: 1s, 2s, 4s, 8s, etc.
		backoff := time.Second * time.Duration(1<<uint(attempt))

		// Check if context is cancelled before sleeping
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("context cancelled during retry: %w", ctx.Err())
		case <-time.After(backoff):
			// Continue to next retry attempt
		}
	}

	return nil, fmt.Errorf("max retries (%d) exceeded: %w", maxRetries, lastErr)
}

// GetCountyEmployment fetches LAUS employment data for a Texas county.
func (c *Client) GetCountyEmployment(ctx context.Context, countyFIPS, countyName string, startYear, endYear int) ([]*db.BLSEmployment, error) {
	// Build series IDs for all measures
	seriesIDs := []string{
		BuildSeriesID(countyFIPS, LAUSLaborForce),
		BuildSeriesID(countyFIPS, LAUSEmployed),
		BuildSeriesID(countyFIPS, LAUSUnemployed),
		BuildSeriesID(countyFIPS, LAUSUnemploymentRate),
	}

	// Build request body
	requestBody := map[string]interface{}{
		"seriesid":  seriesIDs,
		"startyear": strconv.Itoa(startYear),
		"endyear":   strconv.Itoa(endYear),
	}

	// Use v2 API if we have an API key
	baseURL := baseURLV1
	if c.apiKey != "" {
		baseURL = baseURLV2
		requestBody["registrationkey"] = c.apiKey
	}

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch BLS data: %w", err)
	}
	defer resp.Body.Close()

	// Rate limit: BLS v2 API allows 50 requests per 10 seconds (5/sec)
	time.Sleep(250 * time.Millisecond)

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var blsResp LAUSResponse
	if err := json.Unmarshal(body, &blsResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if blsResp.Status != "REQUEST_SUCCEEDED" {
		// Check for daily rate limit exceeded
		for _, msg := range blsResp.Message {
			if strings.Contains(strings.ToLower(msg), "daily threshold") {
				return nil, ErrDailyLimitReached
			}
		}
		return nil, fmt.Errorf("BLS API error: %v", blsResp.Message)
	}

	return c.parseResponse(&blsResp, countyFIPS, countyName)
}

// parseResponse converts the BLS API response to database records.
func (c *Client) parseResponse(resp *LAUSResponse, countyFIPS, countyName string) ([]*db.BLSEmployment, error) {
	// Group data by year/month
	dataByPeriod := make(map[string]map[string]string)

	for _, series := range resp.Results.Series {
		measureType := getMeasureType(series.SeriesID)
		for _, d := range series.Data {
			// Skip annual averages (M13)
			if d.Period == "M13" {
				continue
			}

			key := d.Year + d.Period
			if dataByPeriod[key] == nil {
				dataByPeriod[key] = make(map[string]string)
				dataByPeriod[key]["year"] = d.Year
				dataByPeriod[key]["period"] = d.Period
			}
			dataByPeriod[key][measureType] = d.Value

			// Check for preliminary data
			for _, fn := range d.Footnotes {
				if fn.Code == "P" {
					dataByPeriod[key]["preliminary"] = "Y"
				}
			}
		}
	}

	// Convert to records
	records := make([]*db.BLSEmployment, 0, len(dataByPeriod))
	for _, data := range dataByPeriod {
		year, _ := strconv.Atoi(data["year"])
		month := parseMonth(data["period"])

		record := &db.BLSEmployment{
			AreaCode:   BuildSeriesID(countyFIPS, LAUSUnemploymentRate)[:15], // Area code portion
			AreaName:   countyName + ", TX",
			AreaType:   ptrString("county"),
			StateCode:  ptrString("48"),
			CountyCode: ptrString(countyFIPS),
			Year:       year,
			Month:      month,
			PeriodType: "monthly",
		}

		if v, ok := data["labor_force"]; ok {
			record.LaborForce = parseInt(v)
		}
		if v, ok := data["employed"]; ok {
			record.Employed = parseInt(v)
		}
		if v, ok := data["unemployed"]; ok {
			record.Unemployed = parseInt(v)
		}
		if v, ok := data["unemployment_rate"]; ok {
			record.UnemploymentRate = parseFloat(v)
		}

		if data["preliminary"] == "Y" {
			record.IsPreliminary = "Y"
		} else {
			record.IsPreliminary = "N"
		}

		records = append(records, record)
	}

	return records, nil
}

// getMeasureType extracts the measure type from a series ID.
func getMeasureType(seriesID string) string {
	if len(seriesID) < 2 {
		return ""
	}
	suffix := seriesID[len(seriesID)-2:]
	switch suffix {
	case "06":
		return "labor_force"
	case "05":
		return "employed"
	case "04":
		return "unemployed"
	case "03":
		return "unemployment_rate"
	default:
		return ""
	}
}

// parseMonth converts BLS period format (M01-M12) to month number.
func parseMonth(period string) int {
	if len(period) != 3 || !strings.HasPrefix(period, "M") {
		return 0
	}
	month, _ := strconv.Atoi(period[1:])
	return month
}

// Helper functions
func ptrString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func parseInt(s string) *int {
	if s == "" {
		return nil
	}
	// Remove commas from numbers
	s = strings.ReplaceAll(s, ",", "")
	v, err := strconv.Atoi(s)
	if err != nil {
		return nil
	}
	return &v
}

func parseFloat(s string) *float64 {
	if s == "" {
		return nil
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil
	}
	return &v
}
