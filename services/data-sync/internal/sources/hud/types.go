// Package hud provides a client for the HUD Fair Market Rent API.
package hud

// StateDataResponse represents the HUD FMR API response for state-level data.
type StateDataResponse struct {
	Data StateData `json:"data"`
}

// StateData contains state-level FMR data with metro areas and counties.
type StateData struct {
	Year       string        `json:"year"`
	StateName  string        `json:"state_name"`
	MetroAreas []MetroArea   `json:"metroareas"`
	Counties   []CountyArea  `json:"counties"`
}

// MetroArea represents a metropolitan statistical area with FMR data.
type MetroArea struct {
	MetroName    string `json:"metro_name"`
	Code         string `json:"code"` // e.g., "METRO10180M10180"
	Efficiency   int    `json:"Efficiency"`
	OneBedroom   int    `json:"One-Bedroom"`
	TwoBedroom   int    `json:"Two-Bedroom"`
	ThreeBedroom int    `json:"Three-Bedroom"`
	FourBedroom  int    `json:"Four-Bedroom"`
}

// CountyArea represents a non-metro county with FMR data.
type CountyArea struct {
	CountyName   string `json:"county_name"`
	Code         string `json:"code"` // e.g., "COUNTY48001"
	Efficiency   int    `json:"Efficiency"`
	OneBedroom   int    `json:"One-Bedroom"`
	TwoBedroom   int    `json:"Two-Bedroom"`
	ThreeBedroom int    `json:"Three-Bedroom"`
	FourBedroom  int    `json:"Four-Bedroom"`
}

// EntityDataResponse represents the HUD FMR API response for entity-level data.
type EntityDataResponse struct {
	Data EntityData `json:"data"`
}

// EntityData contains entity-level FMR data (metro or county).
type EntityData struct {
	Year            string          `json:"year"`
	EntityID        string          `json:"fmr_area"`
	MetroName       string          `json:"metro_name"`
	CountyName      string          `json:"county_name"`
	StateName       string          `json:"state_name"`
	StateCode       string          `json:"state_code"`
	SmallAreaStatus string          `json:"smallarea_status"` // "1" if ZIP-level data available
	Efficiency      int             `json:"Efficiency"`
	OneBedroom      int             `json:"One-Bedroom"`
	TwoBedroom      int             `json:"Two-Bedroom"`
	ThreeBedroom    int             `json:"Three-Bedroom"`
	FourBedroom     int             `json:"Four-Bedroom"`
	SmallAreas      []SmallAreaData `json:"smallareas,omitempty"`
}

// SmallAreaData contains ZIP-code-level FMR data when available.
type SmallAreaData struct {
	ZipCode      string `json:"zip_code"`
	Efficiency   int    `json:"Efficiency"`
	OneBedroom   int    `json:"One-Bedroom"`
	TwoBedroom   int    `json:"Two-Bedroom"`
	ThreeBedroom int    `json:"Three-Bedroom"`
	FourBedroom  int    `json:"Four-Bedroom"`
}

// FMRResponse represents the legacy HUD FMR API response (kept for compatibility).
type FMRResponse struct {
	Status  string  `json:"status"`
	Message string  `json:"message,omitempty"`
	Data    FMRData `json:"data"`
}

// FMRData contains the FMR data returned by the API.
type FMRData struct {
	BasicData     BasicData     `json:"basicdata"`
	SmallAreaData SmallAreaData `json:"smallarea_data,omitempty"`
}

// BasicData contains the primary FMR values.
type BasicData struct {
	ZipCode         string `json:"zip_code"`
	Year            string `json:"year"`
	CountyName      string `json:"county_name"`
	CountiesName    string `json:"counties_name"`
	MetroStatus     string `json:"metro_status"`
	MetroName       string `json:"metro_name"`
	StateName       string `json:"state_name"`
	StateCode       string `json:"state_code"`
	AreaName        string `json:"area_name"`
	Efficiency      int    `json:"Efficiency"`
	OneBedroom      int    `json:"One-Bedroom"`
	TwoBedroom      int    `json:"Two-Bedroom"`
	ThreeBedroom    int    `json:"Three-Bedroom"`
	FourBedroom     int    `json:"Four-Bedroom"`
	SmallAreaStatus string `json:"smallarea_status"`
}
