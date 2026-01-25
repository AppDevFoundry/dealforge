// Package bls provides a client for the BLS Local Area Unemployment Statistics API.
package bls

// LAUSResponse represents the BLS LAUS API response.
type LAUSResponse struct {
	Status       string         `json:"status"`
	ResponseTime int            `json:"responseTime"`
	Message      []string       `json:"message,omitempty"`
	Results      LAUSResults    `json:"Results"`
}

// LAUSResults contains the series data from the API.
type LAUSResults struct {
	Series []LAUSSeries `json:"series"`
}

// LAUSSeries represents a single data series.
type LAUSSeries struct {
	SeriesID string     `json:"seriesID"`
	Data     []LAUSData `json:"data"`
}

// LAUSData represents a single data point in the series.
type LAUSData struct {
	Year       string       `json:"year"`
	Period     string       `json:"period"`       // "M01" through "M12" for monthly, "M13" for annual
	PeriodName string       `json:"periodName"`
	Value      string       `json:"value"`
	Footnotes  []LAUSFootnote `json:"footnotes,omitempty"`
}

// LAUSFootnote represents footnote information.
type LAUSFootnote struct {
	Code string `json:"code"`
	Text string `json:"text"`
}

// LAUSSeriesType represents the different LAUS measure types.
type LAUSSeriesType string

const (
	LAUSLaborForce       LAUSSeriesType = "06" // Civilian labor force
	LAUSEmployed         LAUSSeriesType = "05" // Employment
	LAUSUnemployed       LAUSSeriesType = "04" // Unemployment
	LAUSUnemploymentRate LAUSSeriesType = "03" // Unemployment rate
)

// BuildSeriesID constructs a LAUS series ID for a Texas county.
// Format: LAUCN480290000000003 (for unemployment rate in county 029)
// Breakdown: LAU + CN + 48 + 029 + 0000000 + 03
func BuildSeriesID(countyFIPS string, measureType LAUSSeriesType) string {
	return "LAUCN48" + countyFIPS + "0000000" + string(measureType)
}
