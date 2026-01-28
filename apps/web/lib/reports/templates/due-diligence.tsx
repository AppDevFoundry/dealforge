/**
 * Due Diligence Report PDF Template
 *
 * Uses @react-pdf/renderer to generate professional PDF reports
 * for property leads with all gathered intelligence.
 */

import type {
  AiAnalysis,
  CcnCoverage,
  Demographics,
  FmrData,
  Lead,
  LeadIntelligence,
  NearbyPark,
  TdhcaMatch,
} from '@dealforge/types';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: '#666',
    width: 140,
  },
  value: {
    fontSize: 10,
    color: '#1a1a2e',
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  gridItem: {
    width: '50%',
    marginBottom: 8,
  },
  badge: {
    fontSize: 9,
    padding: '3 8',
    borderRadius: 4,
    color: '#ffffff',
    alignSelf: 'flex-start',
  },
  badgeGreen: {
    backgroundColor: '#22c55e',
  },
  badgeRed: {
    backgroundColor: '#ef4444',
  },
  badgeYellow: {
    backgroundColor: '#eab308',
  },
  badgeGray: {
    backgroundColor: '#6b7280',
  },
  bullet: {
    fontSize: 10,
    color: '#1a1a2e',
    marginLeft: 10,
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 10,
  },
  recommendation: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
  },
});

interface DueDiligenceReportProps {
  lead: Lead;
  intelligence?: LeadIntelligence | null;
  generatedAt: string;
  version: number;
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

function GridItem({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.gridItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

function UtilitySection({ intelligence }: { intelligence?: LeadIntelligence | null }) {
  if (!intelligence) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Utility Coverage</Text>
      <View style={styles.grid}>
        <GridItem
          label="Water"
          value={
            intelligence.hasWaterCoverage
              ? `Yes - ${(intelligence.waterCcn as CcnCoverage)?.utilityName || 'Available'}`
              : 'No coverage detected'
          }
        />
        <GridItem
          label="Sewer"
          value={
            intelligence.hasSewerCoverage
              ? `Yes - ${(intelligence.sewerCcn as CcnCoverage)?.utilityName || 'Available'}`
              : 'No coverage detected'
          }
        />
      </View>
      {!intelligence.hasWaterCoverage || !intelligence.hasSewerCoverage ? (
        <Text style={[styles.bullet, { color: '#ca8a04' }]}>
          Note: Properties without CCN coverage may require well/septic systems
        </Text>
      ) : null}
    </View>
  );
}

function FloodSection({ intelligence }: { intelligence?: LeadIntelligence | null }) {
  if (!intelligence?.floodZone) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Flood Zone</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Zone</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.value}>{intelligence.floodZone}</Text>
          {intelligence.isHighRiskFlood && (
            <View style={[styles.badge, styles.badgeRed, { marginLeft: 8 }]}>
              <Text>HIGH RISK</Text>
            </View>
          )}
        </View>
      </View>
      {intelligence.floodZoneDescription && (
        <InfoRow label="Description" value={intelligence.floodZoneDescription} />
      )}
    </View>
  );
}

function MarketSection({ intelligence }: { intelligence?: LeadIntelligence | null }) {
  if (!intelligence?.fmrData && !intelligence?.demographics) return null;

  const fmr = intelligence.fmrData as FmrData | null;
  const demo = intelligence.demographics as Demographics | null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Market Data</Text>
      <View style={styles.grid}>
        {fmr?.twoBr && (
          <>
            <GridItem label="2BR Fair Market Rent" value={`$${fmr.twoBr}/month`} />
            <GridItem
              label="Suggested Lot Rent"
              value={`$${Math.round(fmr.twoBr * 0.3)}-$${Math.round(fmr.twoBr * 0.4)}/month`}
            />
          </>
        )}
        {demo?.population && (
          <GridItem label="Population" value={demo.population.toLocaleString()} />
        )}
        {demo?.medianHouseholdIncome && (
          <GridItem
            label="Median Income"
            value={`$${demo.medianHouseholdIncome.toLocaleString()}`}
          />
        )}
        {demo?.medianHomeValue && (
          <GridItem label="Median Home Value" value={`$${demo.medianHomeValue.toLocaleString()}`} />
        )}
        {demo?.unemploymentRate && (
          <GridItem label="Unemployment Rate" value={`${demo.unemploymentRate.toFixed(1)}%`} />
        )}
      </View>
    </View>
  );
}

function NearbyParksSection({ intelligence }: { intelligence?: LeadIntelligence | null }) {
  const parks = intelligence?.nearbyParks as NearbyPark[] | null;
  if (!parks || parks.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Nearby MH Communities (within 10 miles)</Text>
      {parks.slice(0, 5).map((park, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.value}>
            {park.name} ({park.city}) - {park.distanceMiles} mi
            {park.lotCount ? `, ${park.lotCount} lots` : ''}
            {park.distressScore && park.distressScore >= 50 ? ' - Distressed' : ''}
          </Text>
        </View>
      ))}
      {parks.length > 5 && (
        <Text style={[styles.bullet, { fontStyle: 'italic' }]}>
          + {parks.length - 5} more parks
        </Text>
      )}
    </View>
  );
}

function TdhcaSection({ intelligence }: { intelligence?: LeadIntelligence | null }) {
  const match = intelligence?.tdhcaMatch as TdhcaMatch | null;
  if (!match) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>TDHCA Record Match</Text>
      <View style={styles.grid}>
        <GridItem label="Label/HUD" value={match.labelOrHud} />
        {match.manufacturer && <GridItem label="Manufacturer" value={match.manufacturer} />}
        {match.yearMfg && <GridItem label="Year Manufactured" value={match.yearMfg} />}
      </View>
      {match.hasLien && (
        <View style={[styles.badge, styles.badgeRed]}>
          <Text>TAX LIEN ON RECORD</Text>
        </View>
      )}
    </View>
  );
}

function AiAnalysisSection({ analysis }: { analysis?: AiAnalysis | null }) {
  if (!analysis) return null;

  const badgeStyle =
    analysis.recommendation === 'pursue'
      ? styles.badgeGreen
      : analysis.recommendation === 'pass'
        ? styles.badgeRed
        : styles.badgeYellow;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>AI Analysis</Text>

      <View style={styles.recommendation}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.recommendationTitle}>Recommendation: </Text>
          <View style={[styles.badge, badgeStyle]}>
            <Text>{analysis.recommendation.toUpperCase().replace(/_/g, ' ')}</Text>
          </View>
        </View>
        <Text style={styles.recommendationText}>{analysis.summary}</Text>
      </View>

      {analysis.insights && analysis.insights.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>Key Insights</Text>
          {analysis.insights.map((insight, i) => (
            <Text key={i} style={styles.bullet}>
              • {insight}
            </Text>
          ))}
        </View>
      )}

      {analysis.risks && analysis.risks.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: '#dc2626' }}>
            Risks
          </Text>
          {analysis.risks.map((risk, i) => (
            <Text key={i} style={[styles.bullet, { color: '#dc2626' }]}>
              • {risk}
            </Text>
          ))}
        </View>
      )}

      {analysis.opportunities && analysis.opportunities.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: '#16a34a' }}>
            Opportunities
          </Text>
          {analysis.opportunities.map((opp, i) => (
            <Text key={i} style={[styles.bullet, { color: '#16a34a' }]}>
              • {opp}
            </Text>
          ))}
        </View>
      )}

      {(analysis.estimatedARV || analysis.suggestedOffer) && (
        <View style={styles.grid}>
          {analysis.estimatedARV && (
            <GridItem label="Estimated ARV" value={`$${analysis.estimatedARV.toLocaleString()}`} />
          )}
          {analysis.suggestedOffer && (
            <GridItem
              label="Suggested Offer"
              value={`$${analysis.suggestedOffer.toLocaleString()}`}
            />
          )}
        </View>
      )}
    </View>
  );
}

export function DueDiligenceReport({
  lead,
  intelligence,
  generatedAt,
  version,
}: DueDiligenceReportProps) {
  const aiAnalysis = intelligence?.aiAnalysis as AiAnalysis | null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Due Diligence Report</Text>
          <Text style={styles.subtitle}>{lead.address}</Text>
          <Text style={styles.subtitle}>
            {[lead.city, lead.county, lead.state].filter(Boolean).join(', ')}
            {lead.zipCode ? ` ${lead.zipCode}` : ''}
          </Text>
          <Text style={[styles.subtitle, { marginTop: 8 }]}>
            Generated:{' '}
            {new Date(generatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {' | '}Version {version}
          </Text>
        </View>

        {/* Property Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.grid}>
            {lead.propertyType && (
              <GridItem label="Type" value={lead.propertyType.replace(/_/g, ' ')} />
            )}
            {lead.propertyCondition && (
              <GridItem label="Condition" value={lead.propertyCondition.replace(/_/g, ' ')} />
            )}
            {lead.yearBuilt && <GridItem label="Year Built" value={lead.yearBuilt} />}
            {lead.homeSize && <GridItem label="Home Size" value={`${lead.homeSize} sq ft`} />}
            {lead.lotSize && <GridItem label="Lot Size" value={`${lead.lotSize} acres`} />}
            {lead.bedrooms && <GridItem label="Bedrooms" value={lead.bedrooms} />}
            {lead.bathrooms && <GridItem label="Bathrooms" value={lead.bathrooms} />}
            {lead.lotCount && <GridItem label="Lot Count" value={lead.lotCount} />}
          </View>
        </View>

        {/* Financials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Information</Text>
          <View style={styles.grid}>
            {lead.askingPrice && (
              <GridItem label="Asking Price" value={`$${lead.askingPrice.toLocaleString()}`} />
            )}
            {lead.estimatedValue && (
              <GridItem
                label="Estimated Value"
                value={`$${lead.estimatedValue.toLocaleString()}`}
              />
            )}
            {lead.monthlyIncome && (
              <GridItem label="Monthly Income" value={`$${lead.monthlyIncome.toLocaleString()}`} />
            )}
            {lead.lotRent && <GridItem label="Lot Rent" value={`$${lead.lotRent}/month`} />}
            {lead.annualTaxes && (
              <GridItem label="Annual Taxes" value={`$${lead.annualTaxes.toLocaleString()}`} />
            )}
            {lead.annualInsurance && (
              <GridItem
                label="Annual Insurance"
                value={`$${lead.annualInsurance.toLocaleString()}`}
              />
            )}
          </View>
        </View>

        {/* Intelligence Sections */}
        <UtilitySection intelligence={intelligence} />
        <FloodSection intelligence={intelligence} />
        <MarketSection intelligence={intelligence} />
        <NearbyParksSection intelligence={intelligence} />
        <TdhcaSection intelligence={intelligence} />
        <AiAnalysisSection analysis={aiAnalysis} />

        {/* Seller Info */}
        {(lead.sellerName || lead.sellerPhone || lead.sellerEmail) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.grid}>
              {lead.sellerName && <GridItem label="Name" value={lead.sellerName} />}
              {lead.sellerPhone && <GridItem label="Phone" value={lead.sellerPhone} />}
              {lead.sellerEmail && <GridItem label="Email" value={lead.sellerEmail} />}
              {lead.leadSource && (
                <GridItem label="Lead Source" value={lead.leadSource.replace(/_/g, ' ')} />
              )}
            </View>
            {lead.sellerMotivation && (
              <>
                <Text style={[styles.label, { marginTop: 8 }]}>Motivation</Text>
                <Text style={styles.value}>{lead.sellerMotivation}</Text>
              </>
            )}
          </View>
        )}

        {/* Notes */}
        {lead.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{lead.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by DealForge | This report is for informational purposes only and does not
          constitute professional advice.
        </Text>
      </Page>
    </Document>
  );
}
