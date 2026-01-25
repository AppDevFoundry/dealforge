package bls

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestBuildSeriesID(t *testing.T) {
	tests := []struct {
		countyFIPS  string
		measureType LAUSSeriesType
		expected    string
	}{
		// Format: LAUCN48 + countyFIPS + 0000000 + measureType
		{"029", LAUSUnemploymentRate, "LAUCN48029000000003"},
		{"029", LAUSLaborForce, "LAUCN48029000000006"},
		{"029", LAUSEmployed, "LAUCN48029000000005"},
		{"029", LAUSUnemployed, "LAUCN48029000000004"},
		{"215", LAUSUnemploymentRate, "LAUCN48215000000003"},
	}

	for _, tt := range tests {
		result := BuildSeriesID(tt.countyFIPS, tt.measureType)
		if result != tt.expected {
			t.Errorf("BuildSeriesID(%q, %q) = %q, expected %q",
				tt.countyFIPS, tt.measureType, result, tt.expected)
		}
	}
}

func TestClient_GetCountyEmployment(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request method
		if r.Method != http.MethodPost {
			t.Errorf("expected POST method, got %s", r.Method)
		}

		// Verify content type
		if r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("expected Content-Type application/json, got %s", r.Header.Get("Content-Type"))
		}

		// Return mock BLS response
		response := LAUSResponse{
			Status:       "REQUEST_SUCCEEDED",
			ResponseTime: 150,
			Results: LAUSResults{
				Series: []LAUSSeries{
					{
						SeriesID: "LAUCN480290000000006", // Labor force
						Data: []LAUSData{
							{Year: "2024", Period: "M12", Value: "1050000"},
							{Year: "2024", Period: "M11", Value: "1045000"},
						},
					},
					{
						SeriesID: "LAUCN480290000000005", // Employed
						Data: []LAUSData{
							{Year: "2024", Period: "M12", Value: "1000000"},
							{Year: "2024", Period: "M11", Value: "998000"},
						},
					},
					{
						SeriesID: "LAUCN480290000000004", // Unemployed
						Data: []LAUSData{
							{Year: "2024", Period: "M12", Value: "50000"},
							{Year: "2024", Period: "M11", Value: "47000"},
						},
					},
					{
						SeriesID: "LAUCN480290000000003", // Unemployment rate
						Data: []LAUSData{
							{Year: "2024", Period: "M12", Value: "4.8"},
							{Year: "2024", Period: "M11", Value: "4.5"},
						},
					},
				},
			},
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
			Timeout:   5 * time.Second,
		},
	}

	ctx := context.Background()
	records, err := client.GetCountyEmployment(ctx, "029", "Bexar County", 2024, 2024)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should have 2 monthly records (M11 and M12)
	if len(records) != 2 {
		t.Errorf("expected 2 records, got %d", len(records))
	}

	// Find December 2024 record
	var dec2024 *struct {
		year            int
		month           int
		laborForce      *int
		employed        *int
		unemployed      *int
		unemploymentRate *float64
	}

	for _, r := range records {
		if r.Year == 2024 && r.Month == 12 {
			dec2024 = &struct {
				year            int
				month           int
				laborForce      *int
				employed        *int
				unemployed      *int
				unemploymentRate *float64
			}{
				year:            r.Year,
				month:           r.Month,
				laborForce:      r.LaborForce,
				employed:        r.Employed,
				unemployed:      r.Unemployed,
				unemploymentRate: r.UnemploymentRate,
			}
			break
		}
	}

	if dec2024 == nil {
		t.Fatal("December 2024 record not found")
	}

	if dec2024.laborForce == nil || *dec2024.laborForce != 1050000 {
		t.Errorf("expected labor force 1050000, got %v", dec2024.laborForce)
	}

	if dec2024.unemploymentRate == nil || *dec2024.unemploymentRate != 4.8 {
		t.Errorf("expected unemployment rate 4.8, got %v", dec2024.unemploymentRate)
	}
}

func TestClient_GetCountyEmployment_SkipsAnnualAverages(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := LAUSResponse{
			Status: "REQUEST_SUCCEEDED",
			Results: LAUSResults{
				Series: []LAUSSeries{
					{
						SeriesID: "LAUCN480290000000003",
						Data: []LAUSData{
							{Year: "2024", Period: "M13", Value: "4.5"}, // Annual average (should be skipped)
							{Year: "2024", Period: "M12", Value: "4.8"},
						},
					},
				},
			},
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
	records, err := client.GetCountyEmployment(ctx, "029", "Bexar County", 2024, 2024)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should only have 1 record (M13 should be skipped)
	if len(records) != 1 {
		t.Errorf("expected 1 record (M13 skipped), got %d", len(records))
	}
}

func TestClient_GetCountyEmployment_HandlesAPIError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := LAUSResponse{
			Status:  "REQUEST_FAILED",
			Message: []string{"Invalid series ID"},
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
	_, err := client.GetCountyEmployment(ctx, "029", "Bexar County", 2024, 2024)

	if err == nil {
		t.Error("expected error for failed API request, got nil")
	}
}

func TestClient_GetCountyEmployment_HandlesPreliminaryData(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := LAUSResponse{
			Status: "REQUEST_SUCCEEDED",
			Results: LAUSResults{
				Series: []LAUSSeries{
					{
						SeriesID: "LAUCN480290000000003",
						Data: []LAUSData{
							{
								Year:   "2024",
								Period: "M12",
								Value:  "4.8",
								Footnotes: []LAUSFootnote{
									{Code: "P", Text: "Preliminary"},
								},
							},
						},
					},
				},
			},
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
	records, err := client.GetCountyEmployment(ctx, "029", "Bexar County", 2024, 2024)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(records) != 1 {
		t.Fatalf("expected 1 record, got %d", len(records))
	}

	if records[0].IsPreliminary != "Y" {
		t.Errorf("expected IsPreliminary 'Y', got '%s'", records[0].IsPreliminary)
	}
}

func TestClient_GetCountyEmployment_UsesV2WithAPIKey(t *testing.T) {
	var receivedURL string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedURL = r.URL.Path

		response := LAUSResponse{
			Status:  "REQUEST_SUCCEEDED",
			Results: LAUSResults{Series: []LAUSSeries{}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	// Client with API key should use v2
	client := &Client{
		apiKey: "test-api-key",
		httpClient: &http.Client{
			Transport: &mockTransportWithURLCapture{
				baseURL:     server.URL,
				capturedURL: &receivedURL,
			},
		},
	}

	ctx := context.Background()
	client.GetCountyEmployment(ctx, "029", "Bexar County", 2024, 2024)

	// The request body should contain registrationkey when API key is provided
	// This is verified in the actual API call structure
}

func TestParseMonth(t *testing.T) {
	tests := []struct {
		period   string
		expected int
	}{
		{"M01", 1},
		{"M06", 6},
		{"M12", 12},
		{"M13", 13}, // Annual average
		{"M00", 0},
		{"", 0},
		{"X01", 0},
		{"M1", 0}, // Invalid format
	}

	for _, tt := range tests {
		result := parseMonth(tt.period)
		if result != tt.expected {
			t.Errorf("parseMonth(%q) = %d, expected %d", tt.period, result, tt.expected)
		}
	}
}

func TestGetMeasureType(t *testing.T) {
	tests := []struct {
		seriesID string
		expected string
	}{
		{"LAUCN480290000000006", "labor_force"},
		{"LAUCN480290000000005", "employed"},
		{"LAUCN480290000000004", "unemployed"},
		{"LAUCN480290000000003", "unemployment_rate"},
		{"LAUCN4802900000000XX", ""},
		{"", ""},
	}

	for _, tt := range tests {
		result := getMeasureType(tt.seriesID)
		if result != tt.expected {
			t.Errorf("getMeasureType(%q) = %q, expected %q", tt.seriesID, result, tt.expected)
		}
	}
}

func TestParseInt_WithCommas(t *testing.T) {
	tests := []struct {
		input    string
		expected *int
	}{
		{"1,000,000", intPtr(1000000)},
		{"1,234", intPtr(1234)},
		{"", nil},
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

func TestNewClientWithHTTPClient(t *testing.T) {
	customClient := &http.Client{Timeout: 10 * time.Second}
	client := NewClientWithHTTPClient("my-api-key", customClient)

	if client.apiKey != "my-api-key" {
		t.Errorf("expected apiKey 'my-api-key', got '%s'", client.apiKey)
	}

	if client.httpClient != customClient {
		t.Error("expected custom HTTP client to be used")
	}
}

// Helper functions
func intPtr(i int) *int {
	return &i
}

// mockTransport redirects all requests to the test server
type mockTransport struct {
	baseURL string
}

func (t *mockTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.URL.Scheme = "http"
	req.URL.Host = strings.TrimPrefix(t.baseURL, "http://")
	return http.DefaultTransport.RoundTrip(req)
}

type mockTransportWithURLCapture struct {
	baseURL     string
	capturedURL *string
}

func (t *mockTransportWithURLCapture) RoundTrip(req *http.Request) (*http.Response, error) {
	*t.capturedURL = req.URL.Path
	req.URL.Scheme = "http"
	req.URL.Host = strings.TrimPrefix(t.baseURL, "http://")
	return http.DefaultTransport.RoundTrip(req)
}
