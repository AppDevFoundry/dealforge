/**
 * AI Tools Registry
 *
 * Exports all Deal Scout tools for use with the Vercel AI SDK.
 */

import { analyzeDeal } from './analyze-deal';
import { compareParksByCounty } from './compare-parks-by-county';
import { getMarketOverview } from './get-market-overview';
import { getParkDetails } from './get-park-details';
import { getParkLienHistory } from './get-park-lien-history';
import { searchDistressedParks } from './search-distressed-parks';

/**
 * All Deal Scout tools bundled for use with streamText
 */
export const dealScoutTools = {
  searchDistressedParks,
  getParkDetails,
  getParkLienHistory,
  analyzeDeal,
  compareParksByCounty,
  getMarketOverview,
};

// Re-export individual tools for granular use
export {
  searchDistressedParks,
  getParkDetails,
  getParkLienHistory,
  analyzeDeal,
  compareParksByCounty,
  getMarketOverview,
};
