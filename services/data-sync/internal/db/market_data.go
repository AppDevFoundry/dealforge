package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

// HUDFairMarketRent represents a HUD FMR record.
type HUDFairMarketRent struct {
	EntityCode      *string // e.g., "METRO10180M10180", "COUNTY48001"
	ZipCode         string  // Empty for entity-level, populated for Small Area FMRs
	CountyName      *string
	MetroName       *string
	StateName       *string
	StateCode       *string
	FiscalYear      int
	Efficiency      *int
	OneBedroom      *int
	TwoBedroom      *int
	ThreeBedroom    *int
	FourBedroom     *int
	SmallAreaStatus *string
}

// CensusDemographic represents a Census ACS demographic record.
type CensusDemographic struct {
	GeoID                  string
	GeoType                string
	GeoName                string
	StateCode              *string
	CountyCode             *string
	SurveyYear             int
	TotalPopulation        *int
	PopulationGrowthRate   *float64
	MedianAge              *float64
	MedianHouseholdIncome  *int
	PerCapitaIncome        *int
	PovertyRate            *float64
	TotalHousingUnits      *int
	OccupiedHousingUnits   *int
	VacancyRate            *float64
	OwnerOccupiedRate      *float64
	RenterOccupiedRate     *float64
	MedianHomeValue        *int
	MedianGrossRent        *int
	MobileHomesCount       *int
	MobileHomesPercent     *float64
	HighSchoolGradRate     *float64
	BachelorsDegreeRate    *float64
}

// BLSEmployment represents a BLS employment record.
type BLSEmployment struct {
	AreaCode         string
	AreaName         string
	AreaType         *string
	StateCode        *string
	CountyCode       *string
	Year             int
	Month            int
	PeriodType       string
	LaborForce       *int
	Employed         *int
	Unemployed       *int
	UnemploymentRate *float64
	IsPreliminary    string
}

// UpsertHUDFMR inserts or updates a HUD Fair Market Rent record.
// Uses entity_code + fiscal_year for entity-level records (metro/county).
func (c *Client) UpsertHUDFMR(ctx context.Context, r *HUDFairMarketRent) error {
	query := `
		INSERT INTO hud_fair_market_rents (
			id, entity_code, zip_code, county_name, metro_name, state_name, state_code,
			fiscal_year, efficiency, one_bedroom, two_bedroom, three_bedroom, four_bedroom,
			small_area_status, source_updated_at, created_at, updated_at
		) VALUES (
			'hfr_' || gen_random_uuid()::text,
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
		)
		ON CONFLICT (entity_code, fiscal_year)
		DO UPDATE SET
			zip_code = EXCLUDED.zip_code,
			county_name = EXCLUDED.county_name,
			metro_name = EXCLUDED.metro_name,
			state_name = EXCLUDED.state_name,
			state_code = EXCLUDED.state_code,
			efficiency = EXCLUDED.efficiency,
			one_bedroom = EXCLUDED.one_bedroom,
			two_bedroom = EXCLUDED.two_bedroom,
			three_bedroom = EXCLUDED.three_bedroom,
			four_bedroom = EXCLUDED.four_bedroom,
			small_area_status = EXCLUDED.small_area_status,
			source_updated_at = EXCLUDED.source_updated_at,
			updated_at = NOW()
	`

	_, err := c.pool.Exec(ctx, query,
		r.EntityCode, r.ZipCode, r.CountyName, r.MetroName, r.StateName, r.StateCode,
		r.FiscalYear, r.Efficiency, r.OneBedroom, r.TwoBedroom, r.ThreeBedroom, r.FourBedroom,
		r.SmallAreaStatus, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to upsert HUD FMR: %w", err)
	}
	return nil
}

// UpsertCensusDemographic inserts or updates a Census demographic record.
func (c *Client) UpsertCensusDemographic(ctx context.Context, r *CensusDemographic) error {
	query := `
		INSERT INTO census_demographics (
			id, geo_id, geo_type, geo_name, state_code, county_code, survey_year,
			total_population, population_growth_rate, median_age,
			median_household_income, per_capita_income, poverty_rate,
			total_housing_units, occupied_housing_units, vacancy_rate,
			owner_occupied_rate, renter_occupied_rate, median_home_value, median_gross_rent,
			mobile_homes_count, mobile_homes_percent,
			high_school_grad_rate, bachelors_degree_rate,
			source_updated_at, created_at, updated_at
		) VALUES (
			'cen_' || gen_random_uuid()::text,
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW()
		)
		ON CONFLICT (geo_id, survey_year)
		DO UPDATE SET
			geo_type = EXCLUDED.geo_type,
			geo_name = EXCLUDED.geo_name,
			state_code = EXCLUDED.state_code,
			county_code = EXCLUDED.county_code,
			total_population = EXCLUDED.total_population,
			population_growth_rate = EXCLUDED.population_growth_rate,
			median_age = EXCLUDED.median_age,
			median_household_income = EXCLUDED.median_household_income,
			per_capita_income = EXCLUDED.per_capita_income,
			poverty_rate = EXCLUDED.poverty_rate,
			total_housing_units = EXCLUDED.total_housing_units,
			occupied_housing_units = EXCLUDED.occupied_housing_units,
			vacancy_rate = EXCLUDED.vacancy_rate,
			owner_occupied_rate = EXCLUDED.owner_occupied_rate,
			renter_occupied_rate = EXCLUDED.renter_occupied_rate,
			median_home_value = EXCLUDED.median_home_value,
			median_gross_rent = EXCLUDED.median_gross_rent,
			mobile_homes_count = EXCLUDED.mobile_homes_count,
			mobile_homes_percent = EXCLUDED.mobile_homes_percent,
			high_school_grad_rate = EXCLUDED.high_school_grad_rate,
			bachelors_degree_rate = EXCLUDED.bachelors_degree_rate,
			source_updated_at = EXCLUDED.source_updated_at,
			updated_at = NOW()
	`

	_, err := c.pool.Exec(ctx, query,
		r.GeoID, r.GeoType, r.GeoName, r.StateCode, r.CountyCode, r.SurveyYear,
		r.TotalPopulation, r.PopulationGrowthRate, r.MedianAge,
		r.MedianHouseholdIncome, r.PerCapitaIncome, r.PovertyRate,
		r.TotalHousingUnits, r.OccupiedHousingUnits, r.VacancyRate,
		r.OwnerOccupiedRate, r.RenterOccupiedRate, r.MedianHomeValue, r.MedianGrossRent,
		r.MobileHomesCount, r.MobileHomesPercent,
		r.HighSchoolGradRate, r.BachelorsDegreeRate,
		time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to upsert census demographic: %w", err)
	}
	return nil
}

// UpsertBLSEmployment inserts or updates a BLS employment record.
func (c *Client) UpsertBLSEmployment(ctx context.Context, r *BLSEmployment) error {
	query := `
		INSERT INTO bls_employment (
			id, area_code, area_name, area_type, state_code, county_code,
			year, month, period_type, labor_force, employed, unemployed, unemployment_rate,
			is_preliminary, source_updated_at, created_at, updated_at
		) VALUES (
			'bls_' || gen_random_uuid()::text,
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
		)
		ON CONFLICT (area_code, year, month)
		DO UPDATE SET
			area_name = EXCLUDED.area_name,
			area_type = EXCLUDED.area_type,
			state_code = EXCLUDED.state_code,
			county_code = EXCLUDED.county_code,
			period_type = EXCLUDED.period_type,
			labor_force = EXCLUDED.labor_force,
			employed = EXCLUDED.employed,
			unemployed = EXCLUDED.unemployed,
			unemployment_rate = EXCLUDED.unemployment_rate,
			is_preliminary = EXCLUDED.is_preliminary,
			source_updated_at = EXCLUDED.source_updated_at,
			updated_at = NOW()
	`

	_, err := c.pool.Exec(ctx, query,
		r.AreaCode, r.AreaName, r.AreaType, r.StateCode, r.CountyCode,
		r.Year, r.Month, r.PeriodType, r.LaborForce, r.Employed, r.Unemployed, r.UnemploymentRate,
		r.IsPreliminary, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to upsert BLS employment: %w", err)
	}
	return nil
}

// BatchUpsertHUDFMR inserts or updates multiple HUD FMR records using a single batch.
func (c *Client) BatchUpsertHUDFMR(ctx context.Context, records []*HUDFairMarketRent) error {
	if len(records) == 0 {
		return nil
	}

	batch := &pgx.Batch{}

	for _, r := range records {
		query := `
			INSERT INTO hud_fair_market_rents (
				id, entity_code, zip_code, county_name, metro_name, state_name, state_code,
				fiscal_year, efficiency, one_bedroom, two_bedroom, three_bedroom, four_bedroom,
				small_area_status, source_updated_at, created_at, updated_at
			) VALUES (
				'hfr_' || gen_random_uuid()::text,
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
			)
			ON CONFLICT (entity_code, fiscal_year)
			DO UPDATE SET
				zip_code = EXCLUDED.zip_code,
				county_name = EXCLUDED.county_name,
				metro_name = EXCLUDED.metro_name,
				state_name = EXCLUDED.state_name,
				state_code = EXCLUDED.state_code,
				efficiency = EXCLUDED.efficiency,
				one_bedroom = EXCLUDED.one_bedroom,
				two_bedroom = EXCLUDED.two_bedroom,
				three_bedroom = EXCLUDED.three_bedroom,
				four_bedroom = EXCLUDED.four_bedroom,
				small_area_status = EXCLUDED.small_area_status,
				source_updated_at = EXCLUDED.source_updated_at,
				updated_at = NOW()
		`

		batch.Queue(query,
			r.EntityCode, r.ZipCode, r.CountyName, r.MetroName, r.StateName, r.StateCode,
			r.FiscalYear, r.Efficiency, r.OneBedroom, r.TwoBedroom, r.ThreeBedroom, r.FourBedroom,
			r.SmallAreaStatus, time.Now(),
		)
	}

	batchResults := c.pool.SendBatch(ctx, batch)
	defer batchResults.Close()

	for i := 0; i < len(records); i++ {
		_, err := batchResults.Exec()
		if err != nil {
			return fmt.Errorf("failed to upsert HUD FMR record %d: %w", i, err)
		}
	}

	return nil
}

// BatchUpsertCensusDemographic inserts or updates multiple Census demographic records using a single batch.
func (c *Client) BatchUpsertCensusDemographic(ctx context.Context, records []*CensusDemographic) error {
	if len(records) == 0 {
		return nil
	}

	batch := &pgx.Batch{}

	for _, r := range records {
		query := `
			INSERT INTO census_demographics (
				id, geo_id, geo_type, geo_name, state_code, county_code, survey_year,
				total_population, population_growth_rate, median_age,
				median_household_income, per_capita_income, poverty_rate,
				total_housing_units, occupied_housing_units, vacancy_rate,
				owner_occupied_rate, renter_occupied_rate, median_home_value, median_gross_rent,
				mobile_homes_count, mobile_homes_percent,
				high_school_grad_rate, bachelors_degree_rate,
				source_updated_at, created_at, updated_at
			) VALUES (
				'cen_' || gen_random_uuid()::text,
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW()
			)
			ON CONFLICT (geo_id, survey_year)
			DO UPDATE SET
				geo_type = EXCLUDED.geo_type,
				geo_name = EXCLUDED.geo_name,
				state_code = EXCLUDED.state_code,
				county_code = EXCLUDED.county_code,
				total_population = EXCLUDED.total_population,
				population_growth_rate = EXCLUDED.population_growth_rate,
				median_age = EXCLUDED.median_age,
				median_household_income = EXCLUDED.median_household_income,
				per_capita_income = EXCLUDED.per_capita_income,
				poverty_rate = EXCLUDED.poverty_rate,
				total_housing_units = EXCLUDED.total_housing_units,
				occupied_housing_units = EXCLUDED.occupied_housing_units,
				vacancy_rate = EXCLUDED.vacancy_rate,
				owner_occupied_rate = EXCLUDED.owner_occupied_rate,
				renter_occupied_rate = EXCLUDED.renter_occupied_rate,
				median_home_value = EXCLUDED.median_home_value,
				median_gross_rent = EXCLUDED.median_gross_rent,
				mobile_homes_count = EXCLUDED.mobile_homes_count,
				mobile_homes_percent = EXCLUDED.mobile_homes_percent,
				high_school_grad_rate = EXCLUDED.high_school_grad_rate,
				bachelors_degree_rate = EXCLUDED.bachelors_degree_rate,
				source_updated_at = EXCLUDED.source_updated_at,
				updated_at = NOW()
		`

		batch.Queue(query,
			r.GeoID, r.GeoType, r.GeoName, r.StateCode, r.CountyCode, r.SurveyYear,
			r.TotalPopulation, r.PopulationGrowthRate, r.MedianAge,
			r.MedianHouseholdIncome, r.PerCapitaIncome, r.PovertyRate,
			r.TotalHousingUnits, r.OccupiedHousingUnits, r.VacancyRate,
			r.OwnerOccupiedRate, r.RenterOccupiedRate, r.MedianHomeValue, r.MedianGrossRent,
			r.MobileHomesCount, r.MobileHomesPercent,
			r.HighSchoolGradRate, r.BachelorsDegreeRate,
			time.Now(),
		)
	}

	batchResults := c.pool.SendBatch(ctx, batch)
	defer batchResults.Close()

	for i := 0; i < len(records); i++ {
		_, err := batchResults.Exec()
		if err != nil {
			return fmt.Errorf("failed to upsert Census record %d: %w", i, err)
		}
	}

	return nil
}

// BatchUpsertBLSEmployment inserts or updates multiple BLS employment records using a single query.
// This is significantly faster than individual upserts (50-100x improvement).
func (c *Client) BatchUpsertBLSEmployment(ctx context.Context, records []*BLSEmployment) error {
	if len(records) == 0 {
		return nil
	}

	// Use pgx Batch for efficient bulk operations
	batch := &pgx.Batch{}

	for _, r := range records {
		query := `
			INSERT INTO bls_employment (
				id, area_code, area_name, area_type, state_code, county_code,
				year, month, period_type, labor_force, employed, unemployed, unemployment_rate,
				is_preliminary, source_updated_at, created_at, updated_at
			) VALUES (
				'bls_' || gen_random_uuid()::text,
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
			)
			ON CONFLICT (area_code, year, month)
			DO UPDATE SET
				area_name = EXCLUDED.area_name,
				area_type = EXCLUDED.area_type,
				state_code = EXCLUDED.state_code,
				county_code = EXCLUDED.county_code,
				period_type = EXCLUDED.period_type,
				labor_force = EXCLUDED.labor_force,
				employed = EXCLUDED.employed,
				unemployed = EXCLUDED.unemployed,
				unemployment_rate = EXCLUDED.unemployment_rate,
				is_preliminary = EXCLUDED.is_preliminary,
				source_updated_at = EXCLUDED.source_updated_at,
				updated_at = NOW()
		`

		batch.Queue(query,
			r.AreaCode, r.AreaName, r.AreaType, r.StateCode, r.CountyCode,
			r.Year, r.Month, r.PeriodType, r.LaborForce, r.Employed, r.Unemployed, r.UnemploymentRate,
			r.IsPreliminary, time.Now(),
		)
	}

	// Execute all queries in a single round-trip
	batchResults := c.pool.SendBatch(ctx, batch)
	defer batchResults.Close()

	// Check results for all queries
	for i := 0; i < len(records); i++ {
		_, err := batchResults.Exec()
		if err != nil {
			return fmt.Errorf("failed to upsert BLS record %d: %w", i, err)
		}
	}

	return nil
}
