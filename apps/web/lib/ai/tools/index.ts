/**
 * AI Tools Registry
 *
 * Exports all Deal Scout tools for use with the Vercel AI SDK.
 */

import { analyzeDeal } from './analyze-deal';
import { analyzePropertyLead } from './analyze-property-lead';
import { compareParksByCounty } from './compare-parks-by-county';
import { getDataRefreshStatus } from './get-data-refresh-status';
import { getMarketContext } from './get-market-context';
import { getMarketOverview } from './get-market-overview';
import { getParkDetails } from './get-park-details';
import { getParkLienHistory } from './get-park-lien-history';
import { lookupParcelData } from './lookup-parcel-data';
import { refreshTdhcaData } from './refresh-tdhca-data';
import { searchDistressedParks } from './search-distressed-parks';

/**
 * All Deal Scout tools bundled for use with streamText
 */
export const dealScoutTools = {
  searchDistressedParks,
  getParkDetails,
  getParkLienHistory,
  analyzeDeal,
  analyzePropertyLead,
  compareParksByCounty,
  getMarketOverview,
  getMarketContext,
  lookupParcelData,
  refreshTdhcaData,
  getDataRefreshStatus,
};

// Re-export individual tools for granular use
export {
  searchDistressedParks,
  getParkDetails,
  getParkLienHistory,
  analyzeDeal,
  analyzePropertyLead,
  compareParksByCounty,
  getMarketOverview,
  getMarketContext,
  lookupParcelData,
  refreshTdhcaData,
  getDataRefreshStatus,
};
