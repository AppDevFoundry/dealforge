/**
 * Due Diligence PDF Report Template
 *
 * Renders a server-side PDF report for a property lead.
 */

import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

interface ReportLead {
  addressRaw: string;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  county?: string | null;
  propertyType?: string | null;
  yearBuilt?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  acreage?: number | null;
  condition?: string | null;
  conditionNotes?: string | null;
  askingPrice?: number | null;
  mortgageBalance?: number | null;
  taxesOwed?: number | null;
  estimatedRepairs?: number | null;
  sellerName?: string | null;
  sellerPhone?: string | null;
  sellerMotivation?: string | null;
  notes?: string | null;
}

interface ReportIntelligence {
  hasWaterCcn?: boolean;
  waterProvider?: string | null;
  hasSewerCcn?: boolean;
  sewerProvider?: string | null;
  fmrFiscalYear?: number | null;
  fmrTwoBedroom?: number | null;
  suggestedLotRentLow?: number | null;
  suggestedLotRentHigh?: number | null;
  medianHouseholdIncome?: number | null;
  unemploymentRate?: number | null;
  populationGrowthRate?: number | null;
  nearbyParksCount?: number;
  ownerName?: string | null;
  manufacturer?: string | null;
  modelYear?: number | null;
  hasLiens?: boolean;
  totalLienAmount?: number | null;
  aiInsights?: string[];
  aiRiskFactors?: string[];
  aiOpportunities?: string[];
  aiRecommendation?: string | null;
  aiConfidenceScore?: number | null;
}

export interface DueDiligenceReportProps {
  lead: ReportLead;
  intelligence?: ReportIntelligence;
  generatedAt: string;
}

const fmt = (n: number | null | undefined) => (n ? `$${n.toLocaleString()}` : '—');

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 40,
    color: '#1a1a1a',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  brandTagline: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    textAlign: 'right',
  },
  reportTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  generatedDate: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  // Sections
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 20,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  // Two-column grid
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  col: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#1a1a1a',
  },
  valueHighlight: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  valueWarning: {
    fontSize: 10,
    color: '#dc2626',
  },
  valueSuccess: {
    fontSize: 10,
    color: '#16a34a',
  },
  // Utility badges
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
  },
  badgeGood: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  badgeBad: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  // AI section
  recommendation: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    padding: 12,
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 10,
    color: '#1e40af',
    fontWeight: 'bold',
  },
  listItem: {
    fontSize: 9,
    color: '#374151',
    marginLeft: 12,
    marginBottom: 3,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
  },
});

export function DueDiligenceReport({ lead, intelligence, generatedAt }: DueDiligenceReportProps) {
  return (
    <Document>
      <Page style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>DealForge</Text>
            <Text style={styles.brandTagline}>AI-Native Real Estate Analysis</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>Due Diligence Report</Text>
            <Text style={styles.generatedDate}>Generated: {generatedAt}</Text>
          </View>
        </View>

        {/* Property Address */}
        <View>
          <Text style={[styles.value, { fontSize: 14, fontWeight: 'bold' }]}>
            {lead.addressRaw}
          </Text>
          <Text style={[styles.value, { fontSize: 9, color: '#6b7280', marginTop: 2 }]}>
            {[lead.city, lead.county ? `${lead.county} County` : null, lead.state, lead.zipCode]
              .filter(Boolean)
              .join(' | ')}
          </Text>
        </View>

        {/* Section 1: Property Details */}
        <Text style={styles.sectionTitle}>1. Property Details</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{lead.propertyType?.replace('_', ' ') || '—'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Year Built</Text>
            <Text style={styles.value}>{lead.yearBuilt || '—'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Condition</Text>
            <Text style={styles.value}>{lead.condition?.replace('_', ' ') || '—'}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Acreage</Text>
            <Text style={styles.value}>{lead.acreage ? `${lead.acreage} ac` : '—'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Beds</Text>
            <Text style={styles.value}>{lead.beds || '—'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Baths</Text>
            <Text style={styles.value}>{lead.baths || '—'}</Text>
          </View>
        </View>
        {lead.conditionNotes && (
          <View style={{ marginTop: 4 }}>
            <Text style={styles.label}>Condition Notes</Text>
            <Text style={[styles.value, { fontSize: 9 }]}>{lead.conditionNotes}</Text>
          </View>
        )}

        {/* Section 2: Financial Analysis */}
        <Text style={styles.sectionTitle}>2. Financial Analysis</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Asking Price</Text>
            <Text style={styles.valueHighlight}>{fmt(lead.askingPrice)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Mortgage Balance</Text>
            <Text style={styles.value}>{fmt(lead.mortgageBalance)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Taxes Owed</Text>
            <Text style={lead.taxesOwed ? styles.valueWarning : styles.value}>
              {fmt(lead.taxesOwed)}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Estimated Repairs</Text>
            <Text style={styles.value}>{fmt(lead.estimatedRepairs)}</Text>
          </View>
          {lead.askingPrice && lead.mortgageBalance && (
            <View style={styles.col}>
              <Text style={styles.label}>Equity Position</Text>
              <Text style={styles.valueHighlight}>
                {fmt(lead.askingPrice - lead.mortgageBalance)}
              </Text>
            </View>
          )}
        </View>

        {/* Section 3: Utility Coverage */}
        {intelligence && (
          <>
            <Text style={styles.sectionTitle}>3. Utility Coverage (CCN)</Text>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  intelligence.hasWaterCcn ? styles.badgeGood : styles.badgeBad,
                ]}
              >
                <Text>
                  {intelligence.hasWaterCcn
                    ? `Water: ${intelligence.waterProvider || 'Yes'}`
                    : 'No Water CCN'}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  intelligence.hasSewerCcn ? styles.badgeGood : styles.badgeBad,
                ]}
              >
                <Text>
                  {intelligence.hasSewerCcn
                    ? `Sewer: ${intelligence.sewerProvider || 'Yes'}`
                    : 'No Sewer CCN'}
                </Text>
              </View>
            </View>

            {/* Section 4: Market Context */}
            <Text style={styles.sectionTitle}>4. Market Context</Text>
            <View style={styles.row}>
              {intelligence.fmrTwoBedroom && (
                <View style={styles.col}>
                  <Text style={styles.label}>2BR FMR (FY {intelligence.fmrFiscalYear})</Text>
                  <Text style={styles.valueHighlight}>{fmt(intelligence.fmrTwoBedroom)}</Text>
                </View>
              )}
              {intelligence.suggestedLotRentLow && intelligence.suggestedLotRentHigh && (
                <View style={styles.col}>
                  <Text style={styles.label}>Suggested Lot Rent</Text>
                  <Text style={styles.value}>
                    {fmt(intelligence.suggestedLotRentLow)}–{fmt(intelligence.suggestedLotRentHigh)}
                  </Text>
                </View>
              )}
              {intelligence.medianHouseholdIncome && (
                <View style={styles.col}>
                  <Text style={styles.label}>Median HH Income</Text>
                  <Text style={styles.value}>{fmt(intelligence.medianHouseholdIncome)}</Text>
                </View>
              )}
            </View>
            <View style={styles.row}>
              {intelligence.unemploymentRate !== undefined &&
                intelligence.unemploymentRate !== null && (
                  <View style={styles.col}>
                    <Text style={styles.label}>Unemployment Rate</Text>
                    <Text style={styles.value}>{intelligence.unemploymentRate.toFixed(1)}%</Text>
                  </View>
                )}
              <View style={styles.col}>
                <Text style={styles.label}>Nearby MH Parks</Text>
                <Text style={styles.value}>{intelligence.nearbyParksCount || 0}</Text>
              </View>
            </View>

            {/* Section 5: TDHCA Records */}
            {intelligence.ownerName && (
              <>
                <Text style={styles.sectionTitle}>5. TDHCA Records</Text>
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Record Owner</Text>
                    <Text style={styles.value}>{intelligence.ownerName}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Manufacturer</Text>
                    <Text style={styles.value}>{intelligence.manufacturer || '—'}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Model Year</Text>
                    <Text style={styles.value}>{intelligence.modelYear || '—'}</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Active Liens</Text>
                    <Text style={intelligence.hasLiens ? styles.valueWarning : styles.valueSuccess}>
                      {intelligence.hasLiens
                        ? `${fmt(intelligence.totalLienAmount)} outstanding`
                        : 'None'}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Section 6: AI Analysis */}
            {intelligence.aiRecommendation && (
              <>
                <Text style={styles.sectionTitle}>6. AI Analysis</Text>
                <View style={styles.recommendation}>
                  <Text style={styles.recommendationText}>{intelligence.aiRecommendation}</Text>
                </View>

                {intelligence.aiConfidenceScore !== undefined &&
                  intelligence.aiConfidenceScore !== null && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={[styles.label, { marginBottom: 0 }]}>
                        Confidence Score: {intelligence.aiConfidenceScore}%
                      </Text>
                    </View>
                  )}

                {intelligence.aiInsights && intelligence.aiInsights.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={[styles.label, { marginBottom: 4, color: '#16a34a' }]}>
                      Key Insights
                    </Text>
                    {intelligence.aiInsights.map((insight) => (
                      <Text key={insight} style={styles.listItem}>
                        • {insight}
                      </Text>
                    ))}
                  </View>
                )}

                {intelligence.aiRiskFactors && intelligence.aiRiskFactors.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={[styles.label, { marginBottom: 4, color: '#dc2626' }]}>
                      Risk Factors
                    </Text>
                    {intelligence.aiRiskFactors.map((risk) => (
                      <Text key={risk} style={styles.listItem}>
                        • {risk}
                      </Text>
                    ))}
                  </View>
                )}

                {intelligence.aiOpportunities && intelligence.aiOpportunities.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={[styles.label, { marginBottom: 4, color: '#3b82f6' }]}>
                      Opportunities
                    </Text>
                    {intelligence.aiOpportunities.map((opp) => (
                      <Text key={opp} style={styles.listItem}>
                        • {opp}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Notes */}
        {lead.notes && (
          <>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={[styles.value, { fontSize: 9 }]}>{lead.notes}</Text>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This report is for informational purposes only and does not constitute investment
            advice. Verify all data independently before making investment decisions.
          </Text>
          <Text style={styles.footerText}>DealForge — Confidential</Text>
        </View>
      </Page>
    </Document>
  );
}
