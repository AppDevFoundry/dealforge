package census

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestClient_GetCountyDemographics(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request method
		if r.Method != http.MethodGet {
			t.Errorf("expected GET method, got %s", r.Method)
		}

		// Verify URL contains expected parameters
		query := r.URL.Query()
		if query.Get("for") != "county:029" {
			t.Errorf("expected county:029, got %s", query.Get("for"))
		}
		if query.Get("in") != "state:48" {
			t.Errorf("expected state:48, got %s", query.Get("in"))
		}

		// Verify API key is included
		if query.Get("key") != "test-api-key" {
			t.Errorf("expected API key test-api-key, got %s", query.Get("key"))
		}

		// Return mock Census response (2D array format)
		response := ACSResponse{
			// Headers row
			{"NAME", "B01001_001E", "B01002_001E", "B19013_001E", "B19301_001E",
				"B17001_002E", "B25001_001E", "B25002_002E", "B25002_003E",
				"B25003_002E", "B25003_003E", "B25077_001E", "B25064_001E",
				"B25024_010E", "B15003_017E", "B15003_022E", "B15003_001E",
				"state", "county"},
			// Data row
			{"Bexar County, Texas", "2009324", "34.5", "62456", "32145",
				"250000", "800000", "720000", "80000",
				"400000", "320000", "225000", "1100",
				"50000", "180000", "250000", "1400000",
				"48", "029"},
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	client := &Client{
		apiKey: "test-api-key",
		httpClient: &http.Client{
			Transport: &mockTransport{baseURL: server.URL},
		},
	}

	ctx := context.Background()
	record, err := client.GetCountyDemographics(ctx, "029", 2023)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if record == nil {
		t.Fatal("expected record, got nil")
	}

	// Verify parsed fields
	if record.GeoName != "Bexar County, Texas" {
		t.Errorf("expected GeoName 'Bexar County, Texas', got '%s'", record.GeoName)
	}

	if record.GeoID != "48029" {
		t.Errorf("expected GeoID '48029', got '%s'", record.GeoID)
	}

	if record.SurveyYear != 2023 {
		t.Errorf("expected SurveyYear 2023, got %d", record.SurveyYear)
	}

	if record.TotalPopulation == nil || *record.TotalPopulation != 2009324 {
		t.Errorf("expected TotalPopulation 2009324, got %v", record.TotalPopulation)
	}

	if record.MedianHouseholdIncome == nil || *record.MedianHouseholdIncome != 62456 {
		t.Errorf("expected MedianHouseholdIncome 62456, got %v", record.MedianHouseholdIncome)
	}

	if record.MobileHomesCount == nil || *record.MobileHomesCount != 50000 {
		t.Errorf("expected MobileHomesCount 50000, got %v", record.MobileHomesCount)
	}
}

func TestClient_GetCountyDemographics_NoAPIKey(t *testing.T) {
	var receivedKey string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedKey = r.URL.Query().Get("key")

		response := ACSResponse{
			{"NAME", "state", "county"},
			{"Bexar County, Texas", "48", "029"},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	// Client without API key
	client := &Client{
		apiKey: "",
		httpClient: &http.Client{
			Transport: &mockTransport{baseURL: server.URL},
		},
	}

	ctx := context.Background()
	client.GetCountyDemographics(ctx, "029", 2023)

	// Key should be empty when no API key provided
	if receivedKey != "" {
		t.Errorf("expected empty key parameter, got '%s'", receivedKey)
	}
}

func TestClient_GetCountyDemographics_APIError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Invalid county code"))
	}))
	defer server.Close()

	client := &Client{
		apiKey: "test-api-key",
		httpClient: &http.Client{
			Transport: &mockTransport{baseURL: server.URL},
		},
	}

	ctx := context.Background()
	_, err := client.GetCountyDemographics(ctx, "999", 2023)

	if err == nil {
		t.Error("expected error for 400 response, got nil")
	}
}

func TestClient_GetCountyDemographics_NoData(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Return only headers, no data row
		response := ACSResponse{
			{"NAME", "state", "county"},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	client := &Client{
		apiKey: "test-api-key",
		httpClient: &http.Client{
			Transport: &mockTransport{baseURL: server.URL},
		},
	}

	ctx := context.Background()
	_, err := client.GetCountyDemographics(ctx, "029", 2023)

	if err == nil {
		t.Error("expected error for empty data, got nil")
	}
}

func TestParseResponse_CalculatesRates(t *testing.T) {
	client := NewClient("test")

	resp := ACSResponse{
		{"NAME", "B01001_001E", "B17001_002E", "B25001_001E", "B25002_002E", "B25002_003E",
			"B25003_002E", "B25003_003E", "B25024_010E"},
		{"Test County", "1000000", "150000", "400000", "360000", "40000",
			"200000", "160000", "20000"},
	}

	record, err := client.parseResponse(resp, "001", 2023)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Poverty rate: 150000 / 1000000 * 100 = 15%
	if record.PovertyRate == nil || (*record.PovertyRate < 14.9 || *record.PovertyRate > 15.1) {
		t.Errorf("expected PovertyRate ~15%%, got %v", record.PovertyRate)
	}

	// Vacancy rate: 40000 / 400000 * 100 = 10%
	if record.VacancyRate == nil || (*record.VacancyRate < 9.9 || *record.VacancyRate > 10.1) {
		t.Errorf("expected VacancyRate ~10%%, got %v", record.VacancyRate)
	}

	// Owner occupied rate: 200000 / 360000 * 100 ≈ 55.6%
	if record.OwnerOccupiedRate == nil || (*record.OwnerOccupiedRate < 55 || *record.OwnerOccupiedRate > 56) {
		t.Errorf("expected OwnerOccupiedRate ~55.6%%, got %v", record.OwnerOccupiedRate)
	}

	// Mobile homes percent: 20000 / 400000 * 100 = 5%
	if record.MobileHomesPercent == nil || (*record.MobileHomesPercent < 4.9 || *record.MobileHomesPercent > 5.1) {
		t.Errorf("expected MobileHomesPercent ~5%%, got %v", record.MobileHomesPercent)
	}
}

func TestParseInt_EdgeCases(t *testing.T) {
	tests := []struct {
		input    string
		expected *int
	}{
		{"", nil},
		{"null", nil},
		{"-666666666", nil}, // Census missing data indicator
		{"12345", intPtr(12345)},
		{"0", intPtr(0)},
		{"invalid", nil},
	}

	for _, tt := range tests {
		result := parseInt(tt.input)
		if tt.expected == nil {
			if result != nil {
				t.Errorf("parseInt(%q) = %v, expected nil", tt.input, *result)
			}
		} else {
			if result == nil || *result != *tt.expected {
				t.Errorf("parseInt(%q) = %v, expected %v", tt.input, result, *tt.expected)
			}
		}
	}
}

func TestParseFloat_EdgeCases(t *testing.T) {
	tests := []struct {
		input    string
		expected *float64
	}{
		{"", nil},
		{"null", nil},
		{"-666666666", nil},
		{"34.5", float64Ptr(34.5)},
		{"0.0", float64Ptr(0.0)},
		{"invalid", nil},
	}

	for _, tt := range tests {
		result := parseFloat(tt.input)
		if tt.expected == nil {
			if result != nil {
				t.Errorf("parseFloat(%q) = %v, expected nil", tt.input, *result)
			}
		} else {
			if result == nil || *result != *tt.expected {
				t.Errorf("parseFloat(%q) = %v, expected %v", tt.input, result, *tt.expected)
			}
		}
	}
}

func TestACSVariables_ContainsExpectedVariables(t *testing.T) {
	expectedVars := []string{
		"B01001_001E", // Total population
		"B19013_001E", // Median household income
		"B25024_010E", // Mobile homes
		"B25001_001E", // Total housing units
	}

	for _, v := range expectedVars {
		if _, ok := ACSVariables[v]; !ok {
			t.Errorf("expected ACSVariables to contain %s", v)
		}
	}
}

// Helper functions
func intPtr(i int) *int {
	return &i
}

func float64Ptr(f float64) *float64 {
	return &f
}

// mockTransport redirects all requests to the test server
type mockTransport struct {
	baseURL string
}

func (t *mockTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	// Replace base URL with test server URL, preserving path and query
	req.URL.Scheme = "http"
	req.URL.Host = strings.TrimPrefix(t.baseURL, "http://")
	return http.DefaultTransport.RoundTrip(req)
}
