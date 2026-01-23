import { FloodZonePopup } from '@/components/mh-parks/map/infrastructure-popup';
import type { FloodZone } from '@dealforge/types';
import { describe, expect, it } from 'vitest';
import { render, screen } from '../../utils/render';

function createFloodZone(overrides: Partial<FloodZone> = {}): FloodZone {
  return {
    id: 'fz_test_1',
    zoneCode: 'AE',
    zoneDescription: 'Special Flood Hazard Area with base flood elevation',
    county: 'Bexar',
    riskLevel: 'high',
    ...overrides,
  };
}

describe('FloodZonePopup', () => {
  it('renders zone code', () => {
    render(<FloodZonePopup floodZone={createFloodZone({ zoneCode: 'AE FLOODWAY' })} />);
    expect(screen.getByText('AE FLOODWAY')).toBeInTheDocument();
  });

  it('renders "High Risk" badge for high risk zones', () => {
    render(<FloodZonePopup floodZone={createFloodZone({ riskLevel: 'high' })} />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('renders "Moderate Risk" badge for moderate risk zones', () => {
    render(
      <FloodZonePopup
        floodZone={createFloodZone({ zoneCode: 'X SHADED', riskLevel: 'moderate' })}
      />
    );
    expect(screen.getByText('Moderate Risk')).toBeInTheDocument();
  });

  it('renders "Low Risk" badge for low risk zones', () => {
    render(<FloodZonePopup floodZone={createFloodZone({ zoneCode: 'X', riskLevel: 'low' })} />);
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });

  it('renders "Undetermined" badge for undetermined risk', () => {
    render(
      <FloodZonePopup floodZone={createFloodZone({ zoneCode: 'D', riskLevel: 'undetermined' })} />
    );
    expect(screen.getByText('Undetermined')).toBeInTheDocument();
  });

  it('shows zone description', () => {
    render(
      <FloodZonePopup
        floodZone={createFloodZone({
          zoneDescription: 'Special Flood Hazard Area with base flood elevation',
        })}
      />
    );
    expect(
      screen.getByText('Special Flood Hazard Area with base flood elevation')
    ).toBeInTheDocument();
  });

  it('shows county name', () => {
    render(<FloodZonePopup floodZone={createFloodZone({ county: 'Travis' })} />);
    expect(screen.getByText('Travis County')).toBeInTheDocument();
  });

  it('does not show county when null', () => {
    render(<FloodZonePopup floodZone={createFloodZone({ county: null })} />);
    expect(screen.queryByText(/County/)).not.toBeInTheDocument();
  });

  it('shows SFHA notice only for high risk zones', () => {
    const { rerender } = render(
      <FloodZonePopup floodZone={createFloodZone({ riskLevel: 'high' })} />
    );
    expect(screen.getByText('Special Flood Hazard Area (SFHA)')).toBeInTheDocument();

    rerender(<FloodZonePopup floodZone={createFloodZone({ riskLevel: 'moderate' })} />);
    expect(screen.queryByText('Special Flood Hazard Area (SFHA)')).not.toBeInTheDocument();

    rerender(<FloodZonePopup floodZone={createFloodZone({ riskLevel: 'low' })} />);
    expect(screen.queryByText('Special Flood Hazard Area (SFHA)')).not.toBeInTheDocument();
  });

  it('does not show description when null', () => {
    render(<FloodZonePopup floodZone={createFloodZone({ zoneDescription: null })} />);
    expect(screen.queryByText('Description:')).not.toBeInTheDocument();
  });
});
