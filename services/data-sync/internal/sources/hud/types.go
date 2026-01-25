// Package hud provides a client for the HUD Fair Market Rent API.
package hud

// FMRResponse represents the HUD FMR API response for a ZIP code.
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

// SmallAreaData contains ZIP-code-level FMR data when available.
type SmallAreaData struct {
	ZipCode      string `json:"zip_code"`
	Efficiency   int    `json:"Efficiency"`
	OneBedroom   int    `json:"One-Bedroom"`
	TwoBedroom   int    `json:"Two-Bedroom"`
	ThreeBedroom int    `json:"Three-Bedroom"`
	FourBedroom  int    `json:"Four-Bedroom"`
}
