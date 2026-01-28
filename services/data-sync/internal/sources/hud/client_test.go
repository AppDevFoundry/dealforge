package hud

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestClient_GetStateData(t *testing.T) {
	// Create mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request
		if r.Method != http.MethodGet {
			t.Errorf("expected GET method, got %s", r.Method)
		}

		// Verify authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader != "Bearer test-api-key" {
			t.Errorf("expected Authorization header 'Bearer test-api-key', got '%s'", authHeader)
		}

		// Verify URL path contains expected suffix
		if !strings.HasSuffix(r.URL.Path, "/statedata/TX") {
			t.Errorf("expected path to end with /statedata/TX, got %s", r.URL.Path)
		}

		// Return mock response
		response := StateDataResponse{
			Data: StateData{
				Year:      "2025",
				StateName: "Texas",
				MetroAreas: []MetroArea{
					{
						MetroName:    "San Antonio-New Braunfels",
						Code:         "METRO41700M41700",
						Efficiency:   950,
						OneBedroom:   1100,
						TwoBedroom:   1350,
						ThreeBedroom: 1800,
						FourBedroom:  2200,
					},
				},
				Counties: []CountyArea{
					{
						CountyName:   "Bexar County",
						Code:         "COUNTY48029",
						Efficiency:   850,
						OneBedroom:   1000,
						TwoBedroom:   1200,
						ThreeBedroom: 1600,
						FourBedroom:  2000,
					},
				},
			},
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	// Create client with mock server transport
	client := &Client{
		apiKey: "test-api-key",
		httpClient: &http.Client{
			Transport: &mockTransport{baseURL: server.URL},
		},
	}

	// Make request
	ctx := context.Background()
	resp, err := client.GetStateData(ctx, "TX")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp == nil {
		t.Fatal("expected response, got nil")
	}

	// Verify response data
	if resp.Data.Year != "2025" {
		t.Errorf("expected year 2025, got %s", resp.Data.Year)
	}

	if resp.Data.StateName != "Texas" {
		t.Errorf("expected state name Texas, got %s", resp.Data.StateName)
	}

	if len(resp.Data.MetroAreas) != 1 {
		t.Errorf("expected 1 metro area, got %d", len(resp.Data.MetroAreas))
	}

	if len(resp.Data.Counties) != 1 {
		t.Errorf("expected 1 county, got %d", len(resp.Data.Counties))
	}
}

func TestClient_GetEntityData(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader != "Bearer test-api-key" {
			t.Errorf("expected Authorization header 'Bearer test-api-key', got '%s'", authHeader)
		}

		response := EntityDataResponse{
			Data: EntityData{
				Year:            "2025",
				EntityID:        "COUNTY48029",
				CountyName:      "Bexar County",
				StateName:       "Texas",
				StateCode:       "TX",
				SmallAreaStatus: "0",
				Efficiency:      850,
				OneBedroom:      1000,
				TwoBedroom:      1200,
				ThreeBedroom:    1600,
				FourBedroom:     2000,
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
		},
	}

	ctx := context.Background()
	resp, err := client.GetEntityData(ctx, "COUNTY48029")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp == nil {
		t.Fatal("expected response, got nil")
	}

	if resp.Data.CountyName != "Bexar County" {
		t.Errorf("expected county name 'Bexar County', got '%s'", resp.Data.CountyName)
	}

	if resp.Data.TwoBedroom != 1200 {
		t.Errorf("expected two bedroom FMR 1200, got %d", resp.Data.TwoBedroom)
	}
}

func TestClient_GetFMRRecordsForState(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := StateDataResponse{
			Data: StateData{
				Year:      "2025",
				StateName: "Texas",
				MetroAreas: []MetroArea{
					{
						MetroName:    "San Antonio-New Braunfels",
						Code:         "METRO41700M41700",
						Efficiency:   950,
						OneBedroom:   1100,
						TwoBedroom:   1350,
						ThreeBedroom: 1800,
						FourBedroom:  2200,
					},
					{
						MetroName:    "Austin-Round Rock",
						Code:         "METRO12420M12420",
						Efficiency:   1100,
						OneBedroom:   1300,
						TwoBedroom:   1600,
						ThreeBedroom: 2100,
						FourBedroom:  2600,
					},
				},
				Counties: []CountyArea{
					{
						CountyName:   "Hidalgo County",
						Code:         "COUNTY48215",
						Efficiency:   750,
						OneBedroom:   900,
						TwoBedroom:   1100,
						ThreeBedroom: 1450,
						FourBedroom:  1800,
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
		},
	}

	ctx := context.Background()
	records, err := client.GetFMRRecordsForState(ctx, "TX")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should have 3 records: 2 metro + 1 county
	if len(records) != 3 {
		t.Errorf("expected 3 records, got %d", len(records))
	}

	// Verify metro record
	found := false
	for _, r := range records {
		if r.MetroName != nil && *r.MetroName == "San Antonio-New Braunfels" {
			found = true
			if r.FiscalYear != 2025 {
				t.Errorf("expected fiscal year 2025, got %d", r.FiscalYear)
			}
			if r.TwoBedroom == nil || *r.TwoBedroom != 1350 {
				t.Errorf("expected two bedroom 1350, got %v", r.TwoBedroom)
			}
		}
	}
	if !found {
		t.Error("San Antonio metro record not found")
	}
}

func TestClient_GetStateData_APIError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Internal Server Error"))
	}))
	defer server.Close()

	client := &Client{
		apiKey: "test-api-key",
		httpClient: &http.Client{
			Transport: &mockTransport{baseURL: server.URL},
		},
	}

	ctx := context.Background()
	_, err := client.GetStateData(ctx, "TX")

	if err == nil {
		t.Error("expected error for 500 response, got nil")
	}
}

func TestClient_GetStateData_MissingAuthHeader(t *testing.T) {
	authHeaderReceived := ""
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeaderReceived = r.Header.Get("Authorization")

		response := StateDataResponse{
			Data: StateData{Year: "2025", StateName: "Texas"},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	// Client with empty API key
	client := &Client{
		apiKey: "",
		httpClient: &http.Client{
			Transport: &mockTransport{baseURL: server.URL},
		},
	}

	ctx := context.Background()
	client.GetStateData(ctx, "TX")

	// Even with empty key, Bearer prefix should be present
	if !strings.HasPrefix(authHeaderReceived, "Bearer") {
		t.Errorf("expected Authorization header to start with 'Bearer', got '%s'", authHeaderReceived)
	}
}

// mockTransport redirects all requests to the test server
type mockTransport struct {
	baseURL string
}

func (t *mockTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	// Replace the base URL with test server URL
	req.URL.Scheme = "http"
	req.URL.Host = t.baseURL[len("http://"):]
	return http.DefaultTransport.RoundTrip(req)
}
