// Package census provides a client for the Census Bureau ACS API.
package census

// ACSVariables defines the Census ACS variables we query.
// These are from the ACS 5-Year Estimates (acs/acs5).
var ACSVariables = map[string]string{
	// Population
	"B01001_001E": "total_population",        // Total Population
	"B01002_001E": "median_age",              // Median Age
	// Income
	"B19013_001E": "median_household_income", // Median Household Income
	"B19301_001E": "per_capita_income",       // Per Capita Income
	// Poverty
	"B17001_002E": "poverty_count",           // Population below poverty level
	// Housing
	"B25001_001E": "total_housing_units",     // Total Housing Units
	"B25002_002E": "occupied_housing_units",  // Occupied Housing Units
	"B25002_003E": "vacant_housing_units",    // Vacant Housing Units
	"B25003_002E": "owner_occupied",          // Owner-occupied
	"B25003_003E": "renter_occupied",         // Renter-occupied
	"B25077_001E": "median_home_value",       // Median Home Value
	"B25064_001E": "median_gross_rent",       // Median Gross Rent
	// Units in Structure (B25024)
	"B25024_010E": "mobile_homes",            // Mobile homes
	// Educational Attainment (25+) - B15003
	"B15003_017E": "high_school_grads",       // Regular high school diploma
	"B15003_022E": "bachelors_degree",        // Bachelor's degree
	"B15003_001E": "education_total",         // Total population 25+
}

// ACSResponse represents the raw API response from Census.
// The API returns a 2D array where the first row is headers.
type ACSResponse [][]string
