package census

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/dealforge/data-sync/internal/db"
)

const (
	baseURL = "https://api.census.gov/data"
)

// Client provides access to the Census Bureau ACS API.
type Client struct {
	apiKey     string
	httpClient *http.Client
}

// NewClient creates a new Census API client.
func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 60 * time.Second, // Census API can be slow
		},
	}
}

// NewClientWithHTTPClient creates a new Census API client with a custom HTTP client.
// This is primarily for testing purposes.
func NewClientWithHTTPClient(apiKey string, httpClient *http.Client) *Client {
	return &Client{
		apiKey:     apiKey,
		httpClient: httpClient,
	}
}

// GetCountyDemographics fetches ACS 5-year estimates for a Texas county.
func (c *Client) GetCountyDemographics(ctx context.Context, countyFIPS string, year int) (*db.CensusDemographic, error) {
	// Build list of variables to query
	vars := make([]string, 0, len(ACSVariables))
	for varCode := range ACSVariables {
		vars = append(vars, varCode)
	}

	// Build URL
	apiURL := fmt.Sprintf("%s/%d/acs/acs5", baseURL, year)

	params := url.Values{}
	params.Set("get", "NAME,"+strings.Join(vars, ","))
	params.Set("for", fmt.Sprintf("county:%s", countyFIPS))
	params.Set("in", "state:48") // Texas FIPS code
	if c.apiKey != "" {
		params.Set("key", c.apiKey)
	}

	fullURL := apiURL + "?" + params.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch census data: %w", err)
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

	var acsResp ACSResponse
	if err := json.Unmarshal(body, &acsResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(acsResp) < 2 {
		return nil, fmt.Errorf("no data returned for county %s", countyFIPS)
	}

	return c.parseResponse(acsResp, countyFIPS, year)
}

// parseResponse converts the Census API response to a database record.
func (c *Client) parseResponse(resp ACSResponse, countyFIPS string, year int) (*db.CensusDemographic, error) {
	headers := resp[0]
	data := resp[1]

	// Create a map for easier lookup
	values := make(map[string]string)
	for i, header := range headers {
		if i < len(data) {
			values[header] = data[i]
		}
	}

	record := &db.CensusDemographic{
		GeoID:      fmt.Sprintf("48%s", countyFIPS), // Texas FIPS + County FIPS
		GeoType:    "county",
		GeoName:    values["NAME"],
		StateCode:  ptrString("48"),
		CountyCode: ptrString(countyFIPS),
		SurveyYear: year,
	}

	// Population metrics
	record.TotalPopulation = parseInt(values["B01001_001E"])
	record.MedianAge = parseFloat(values["B01002_001E"])

	// Income metrics
	record.MedianHouseholdIncome = parseInt(values["B19013_001E"])
	record.PerCapitaIncome = parseInt(values["B19301_001E"])

	// Poverty rate (poverty count / total population)
	if totalPop := parseInt(values["B01001_001E"]); totalPop != nil && *totalPop > 0 {
		if povertyCount := parseInt(values["B17001_002E"]); povertyCount != nil {
			rate := float64(*povertyCount) / float64(*totalPop) * 100
			record.PovertyRate = &rate
		}
	}

	// Housing metrics
	record.TotalHousingUnits = parseInt(values["B25001_001E"])
	record.OccupiedHousingUnits = parseInt(values["B25002_002E"])

	// Vacancy rate
	if totalUnits := parseInt(values["B25001_001E"]); totalUnits != nil && *totalUnits > 0 {
		if vacantUnits := parseInt(values["B25002_003E"]); vacantUnits != nil {
			rate := float64(*vacantUnits) / float64(*totalUnits) * 100
			record.VacancyRate = &rate
		}
	}

	// Owner/Renter occupied rates
	if occupied := parseInt(values["B25002_002E"]); occupied != nil && *occupied > 0 {
		if ownerOcc := parseInt(values["B25003_002E"]); ownerOcc != nil {
			rate := float64(*ownerOcc) / float64(*occupied) * 100
			record.OwnerOccupiedRate = &rate
		}
		if renterOcc := parseInt(values["B25003_003E"]); renterOcc != nil {
			rate := float64(*renterOcc) / float64(*occupied) * 100
			record.RenterOccupiedRate = &rate
		}
	}

	record.MedianHomeValue = parseInt(values["B25077_001E"])
	record.MedianGrossRent = parseInt(values["B25064_001E"])

	// Mobile homes
	record.MobileHomesCount = parseInt(values["B25024_010E"])
	if totalUnits := parseInt(values["B25001_001E"]); totalUnits != nil && *totalUnits > 0 {
		if mobileHomes := parseInt(values["B25024_010E"]); mobileHomes != nil {
			rate := float64(*mobileHomes) / float64(*totalUnits) * 100
			record.MobileHomesPercent = &rate
		}
	}

	// Education rates
	if educTotal := parseInt(values["B15003_001E"]); educTotal != nil && *educTotal > 0 {
		if hsGrads := parseInt(values["B15003_017E"]); hsGrads != nil {
			rate := float64(*hsGrads) / float64(*educTotal) * 100
			record.HighSchoolGradRate = &rate
		}
		if bachelors := parseInt(values["B15003_022E"]); bachelors != nil {
			rate := float64(*bachelors) / float64(*educTotal) * 100
			record.BachelorsDegreeRate = &rate
		}
	}

	return record, nil
}

// Helper functions
func ptrString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func parseInt(s string) *int {
	if s == "" || s == "null" || s == "-666666666" {
		return nil
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return nil
	}
	return &v
}

func parseFloat(s string) *float64 {
	if s == "" || s == "null" || s == "-666666666" {
		return nil
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil
	}
	return &v
}
