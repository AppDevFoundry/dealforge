/**
 * MH Parks seed script
 *
 * Populates the database with demo MH community and titling data
 * across 5 Texas counties for development and testing.
 *
 * Usage: pnpm db:seed:mh
 */

import { config } from 'dotenv';
config({ path: '../../.env.local' });

import { getDb } from '../client';
import { mhCommunities, mhTitlings } from '../schema/mh-parks';
import { createId } from '@paralleldrive/cuid2';

interface CommunityData {
  name: string;
  address: string;
  city: string;
  county: string;
  zip: string;
  latitude: number;
  longitude: number;
  lotCount: number;
  estimatedOccupancy: string;
  propertyType: string;
  ownerName: string;
  source: string;
}

// Bexar County parks (~25)
const bexarParks: CommunityData[] = [
  { name: 'Alamo Ranch MH Community', address: '2100 Alamo Ranch Rd', city: 'San Antonio', county: 'Bexar', zip: '78253', latitude: 29.4905, longitude: -98.7012, lotCount: 120, estimatedOccupancy: '92.00', propertyType: 'family', ownerName: 'Alamo Communities LLC', source: 'tdhca' },
  { name: 'Mission Trails MHP', address: '4500 Mission Rd', city: 'San Antonio', county: 'Bexar', zip: '78214', latitude: 29.3648, longitude: -98.4712, lotCount: 85, estimatedOccupancy: '88.00', propertyType: 'family', ownerName: 'Mission Trails Properties', source: 'tdhca' },
  { name: 'Windcrest Village', address: '8900 Windcrest Dr', city: 'Windcrest', county: 'Bexar', zip: '78239', latitude: 29.5152, longitude: -98.3801, lotCount: 65, estimatedOccupancy: '95.00', propertyType: 'senior', ownerName: 'Senior Living Partners', source: 'tdhca' },
  { name: 'Leon Valley Estates', address: '6200 Bandera Rd', city: 'Leon Valley', county: 'Bexar', zip: '78238', latitude: 29.4956, longitude: -98.6145, lotCount: 110, estimatedOccupancy: '90.00', propertyType: 'family', ownerName: 'Valley Estates Inc', source: 'tdhca' },
  { name: 'Southside Mobile Home Park', address: '3800 S Flores St', city: 'San Antonio', county: 'Bexar', zip: '78204', latitude: 29.3891, longitude: -98.5012, lotCount: 45, estimatedOccupancy: '82.00', propertyType: 'family', ownerName: 'Southside Properties', source: 'cad' },
  { name: 'Converse Gardens MHC', address: '7600 FM 78', city: 'Converse', county: 'Bexar', zip: '78109', latitude: 29.5167, longitude: -98.3167, lotCount: 95, estimatedOccupancy: '91.00', propertyType: 'mixed', ownerName: 'Converse Gardens LLC', source: 'tdhca' },
  { name: 'Medina Valley MHP', address: '12000 Potranco Rd', city: 'San Antonio', county: 'Bexar', zip: '78245', latitude: 29.3845, longitude: -98.7234, lotCount: 72, estimatedOccupancy: '87.00', propertyType: 'family', ownerName: 'Medina Partners', source: 'tdhca' },
  { name: 'Sunrise Senior Community', address: '5500 Walzem Rd', city: 'San Antonio', county: 'Bexar', zip: '78218', latitude: 29.4989, longitude: -98.3912, lotCount: 55, estimatedOccupancy: '96.00', propertyType: 'senior', ownerName: 'Sunrise Living LLC', source: 'tdhca' },
  { name: 'Live Oak Terrace', address: '11200 Toepperwein Rd', city: 'Live Oak', county: 'Bexar', zip: '78233', latitude: 29.5534, longitude: -98.3345, lotCount: 80, estimatedOccupancy: '89.00', propertyType: 'family', ownerName: 'Terrace Communities', source: 'cad' },
  { name: 'Lackland Village MHP', address: '1800 Valley Hi Dr', city: 'San Antonio', county: 'Bexar', zip: '78242', latitude: 29.3567, longitude: -98.6123, lotCount: 130, estimatedOccupancy: '93.00', propertyType: 'family', ownerName: 'Military Housing LLC', source: 'tdhca' },
  { name: 'Helotes Hills MHC', address: '14500 Bandera Rd', city: 'Helotes', county: 'Bexar', zip: '78023', latitude: 29.5789, longitude: -98.6945, lotCount: 40, estimatedOccupancy: '97.00', propertyType: 'family', ownerName: 'Hill Country Homes', source: 'cad' },
  { name: 'Brooks City Base Community', address: '3200 SE Military Dr', city: 'San Antonio', county: 'Bexar', zip: '78223', latitude: 29.3456, longitude: -98.4234, lotCount: 98, estimatedOccupancy: '86.00', propertyType: 'mixed', ownerName: 'Brooks Partners', source: 'tdhca' },
  { name: 'Timber Creek MHP', address: '9400 Marbach Rd', city: 'San Antonio', county: 'Bexar', zip: '78245', latitude: 29.4123, longitude: -98.6789, lotCount: 68, estimatedOccupancy: '90.00', propertyType: 'family', ownerName: 'Creek Properties Inc', source: 'tdhca' },
  { name: 'Universal City Estates', address: '200 Kitty Hawk Rd', city: 'Universal City', county: 'Bexar', zip: '78148', latitude: 29.5489, longitude: -98.2912, lotCount: 52, estimatedOccupancy: '94.00', propertyType: 'family', ownerName: 'Universal Estates LLC', source: 'cad' },
  { name: 'Pecan Valley Senior Park', address: '4100 Pecan Valley Dr', city: 'San Antonio', county: 'Bexar', zip: '78223', latitude: 29.3712, longitude: -98.4456, lotCount: 48, estimatedOccupancy: '92.00', propertyType: 'senior', ownerName: 'Valley Senior Living', source: 'tdhca' },
  { name: 'Ingram Park MHC', address: '6800 Ingram Rd', city: 'San Antonio', county: 'Bexar', zip: '78238', latitude: 29.4678, longitude: -98.5789, lotCount: 75, estimatedOccupancy: '85.00', propertyType: 'family', ownerName: 'Ingram Communities', source: 'tdhca' },
  { name: 'Kirby Oaks MHP', address: '5100 Kirby Dr', city: 'Kirby', county: 'Bexar', zip: '78219', latitude: 29.4612, longitude: -98.3856, lotCount: 42, estimatedOccupancy: '88.00', propertyType: 'family', ownerName: 'Oaks Management', source: 'cad' },
  { name: 'Somerset Ranch Community', address: '16000 Somerset Rd', city: 'Somerset', county: 'Bexar', zip: '78069', latitude: 29.2234, longitude: -98.5567, lotCount: 60, estimatedOccupancy: '83.00', propertyType: 'family', ownerName: 'Ranch Communities LLC', source: 'tdhca' },
  { name: 'Castle Hills Village', address: '1500 NW Military Hwy', city: 'Castle Hills', county: 'Bexar', zip: '78213', latitude: 29.5234, longitude: -98.5178, lotCount: 35, estimatedOccupancy: '98.00', propertyType: 'senior', ownerName: 'Castle Management', source: 'cad' },
  { name: 'Rolling Oaks MHP', address: '13200 Nacogdoches Rd', city: 'San Antonio', county: 'Bexar', zip: '78217', latitude: 29.5623, longitude: -98.4012, lotCount: 88, estimatedOccupancy: '91.00', propertyType: 'family', ownerName: 'Rolling Oaks Properties', source: 'tdhca' },
  { name: 'Von Ormy Trails', address: '9800 Applewhite Rd', city: 'Von Ormy', county: 'Bexar', zip: '78073', latitude: 29.2867, longitude: -98.6234, lotCount: 55, estimatedOccupancy: '79.00', propertyType: 'family', ownerName: 'Von Ormy Land Co', source: 'cad' },
  { name: 'Shavano Park Estates', address: '17000 NW Military Hwy', city: 'Shavano Park', county: 'Bexar', zip: '78231', latitude: 29.5856, longitude: -98.5534, lotCount: 30, estimatedOccupancy: '100.00', propertyType: 'senior', ownerName: 'Shavano Living', source: 'tdhca' },
  { name: 'Elmendorf Junction MHP', address: '11000 Donop Rd', city: 'Elmendorf', county: 'Bexar', zip: '78112', latitude: 29.2545, longitude: -98.3345, lotCount: 70, estimatedOccupancy: '84.00', propertyType: 'family', ownerName: 'Junction Properties', source: 'cad' },
  { name: 'Culebra Creek Community', address: '8500 Culebra Rd', city: 'San Antonio', county: 'Bexar', zip: '78251', latitude: 29.4534, longitude: -98.6456, lotCount: 105, estimatedOccupancy: '90.00', propertyType: 'mixed', ownerName: 'Culebra Creek LLC', source: 'tdhca' },
  { name: 'Schertz Crossing MHC', address: '5400 FM 3009', city: 'Schertz', county: 'Bexar', zip: '78154', latitude: 29.5612, longitude: -98.2678, lotCount: 78, estimatedOccupancy: '93.00', propertyType: 'family', ownerName: 'Crossing Communities', source: 'tdhca' },
];

// Hidalgo County parks (~20)
const hidalgoParks: CommunityData[] = [
  { name: 'Palm Valley Estates', address: '3200 S Jackson Rd', city: 'McAllen', county: 'Hidalgo', zip: '78503', latitude: 26.1834, longitude: -98.2456, lotCount: 150, estimatedOccupancy: '94.00', propertyType: 'family', ownerName: 'Palm Valley Holdings', source: 'tdhca' },
  { name: 'Rio Grande Village', address: '1800 W Business 83', city: 'Mission', county: 'Hidalgo', zip: '78572', latitude: 26.2089, longitude: -98.3345, lotCount: 200, estimatedOccupancy: '91.00', propertyType: 'family', ownerName: 'Rio Communities LLC', source: 'tdhca' },
  { name: 'Sunshine Senior Park', address: '4500 N 23rd St', city: 'McAllen', county: 'Hidalgo', zip: '78504', latitude: 26.2312, longitude: -98.2234, lotCount: 85, estimatedOccupancy: '97.00', propertyType: 'senior', ownerName: 'Sunshine Living Corp', source: 'tdhca' },
  { name: 'Citrus Gardens MHP', address: '2900 W Mile 5 Rd', city: 'Mission', county: 'Hidalgo', zip: '78574', latitude: 26.2567, longitude: -98.3189, lotCount: 120, estimatedOccupancy: '89.00', propertyType: 'family', ownerName: 'Citrus Properties', source: 'cad' },
  { name: 'Pharr Community Park', address: '600 S Cage Blvd', city: 'Pharr', county: 'Hidalgo', zip: '78577', latitude: 26.1945, longitude: -98.1845, lotCount: 95, estimatedOccupancy: '92.00', propertyType: 'family', ownerName: 'Pharr Land LLC', source: 'tdhca' },
  { name: 'Edinburg Meadows', address: '1400 N Sugar Rd', city: 'Edinburg', county: 'Hidalgo', zip: '78539', latitude: 26.3234, longitude: -98.1612, lotCount: 110, estimatedOccupancy: '87.00', propertyType: 'family', ownerName: 'Meadows Properties', source: 'tdhca' },
  { name: 'Weslaco Palms MHC', address: '2200 E Pike Blvd', city: 'Weslaco', county: 'Hidalgo', zip: '78596', latitude: 26.1567, longitude: -97.9834, lotCount: 78, estimatedOccupancy: '90.00', propertyType: 'mixed', ownerName: 'Palms Management Inc', source: 'cad' },
  { name: 'La Joya Ranch', address: '8800 N Bryan Rd', city: 'La Joya', county: 'Hidalgo', zip: '78560', latitude: 26.2456, longitude: -98.4789, lotCount: 65, estimatedOccupancy: '85.00', propertyType: 'family', ownerName: 'La Joya Land Co', source: 'tdhca' },
  { name: 'Mercedes Oaks', address: '500 N Texas Ave', city: 'Mercedes', county: 'Hidalgo', zip: '78570', latitude: 26.1567, longitude: -97.9145, lotCount: 55, estimatedOccupancy: '88.00', propertyType: 'family', ownerName: 'Mercedes Properties', source: 'cad' },
  { name: 'Donna Lakes Community', address: '3100 N Main St', city: 'Donna', county: 'Hidalgo', zip: '78537', latitude: 26.1789, longitude: -98.0523, lotCount: 140, estimatedOccupancy: '93.00', propertyType: 'family', ownerName: 'Lakes Community Inc', source: 'tdhca' },
  { name: 'Elsa Verde MHP', address: '700 W First St', city: 'Elsa', county: 'Hidalgo', zip: '78543', latitude: 26.2934, longitude: -97.9934, lotCount: 48, estimatedOccupancy: '86.00', propertyType: 'family', ownerName: 'Verde Holdings', source: 'cad' },
  { name: 'San Juan Terrace', address: '1600 S Raul Longoria Rd', city: 'San Juan', county: 'Hidalgo', zip: '78589', latitude: 26.1823, longitude: -98.1523, lotCount: 72, estimatedOccupancy: '91.00', propertyType: 'family', ownerName: 'Terrace Properties', source: 'tdhca' },
  { name: 'Winter Haven Senior Village', address: '4200 W Business 83', city: 'McAllen', county: 'Hidalgo', zip: '78501', latitude: 26.2045, longitude: -98.2678, lotCount: 180, estimatedOccupancy: '96.00', propertyType: 'senior', ownerName: 'Winter Haven Corp', source: 'tdhca' },
  { name: 'Alamo Heights MHP', address: '900 N Tower Rd', city: 'Alamo', county: 'Hidalgo', zip: '78516', latitude: 26.1945, longitude: -98.1234, lotCount: 62, estimatedOccupancy: '84.00', propertyType: 'family', ownerName: 'Alamo Heights LLC', source: 'cad' },
  { name: 'Hidalgo Crossing', address: '2500 S Bridge St', city: 'Hidalgo', county: 'Hidalgo', zip: '78557', latitude: 26.1023, longitude: -98.2634, lotCount: 88, estimatedOccupancy: '89.00', propertyType: 'mixed', ownerName: 'Crossing Holdings', source: 'tdhca' },
  { name: 'Peñitas Palms', address: '1100 S Bentsen Palm Dr', city: 'Penitas', county: 'Hidalgo', zip: '78576', latitude: 26.2289, longitude: -98.4423, lotCount: 45, estimatedOccupancy: '80.00', propertyType: 'family', ownerName: 'Penitas Land LLC', source: 'cad' },
  { name: 'Sullivan City Estates', address: '600 W Main St', city: 'Sullivan City', county: 'Hidalgo', zip: '78595', latitude: 26.2745, longitude: -98.5645, lotCount: 38, estimatedOccupancy: '82.00', propertyType: 'family', ownerName: 'Sullivan Properties', source: 'tdhca' },
  { name: 'Monte Alto Community', address: '200 N Monte Alto Rd', city: 'Monte Alto', county: 'Hidalgo', zip: '78538', latitude: 26.3712, longitude: -97.9712, lotCount: 52, estimatedOccupancy: '78.00', propertyType: 'family', ownerName: 'Alto Communities', source: 'cad' },
  { name: 'Progreso Lakes MHC', address: '1400 FM 1015', city: 'Progreso', county: 'Hidalgo', zip: '78579', latitude: 26.0945, longitude: -97.9545, lotCount: 68, estimatedOccupancy: '87.00', propertyType: 'family', ownerName: 'Progreso Management', source: 'tdhca' },
  { name: 'North McAllen Village', address: '7200 N 10th St', city: 'McAllen', county: 'Hidalgo', zip: '78504', latitude: 26.2789, longitude: -98.2345, lotCount: 95, estimatedOccupancy: '93.00', propertyType: 'family', ownerName: 'North Village LLC', source: 'tdhca' },
];

// Cameron County parks (~15)
const cameronParks: CommunityData[] = [
  { name: 'Island Breeze MHP', address: '3400 Padre Blvd', city: 'South Padre Island', county: 'Cameron', zip: '78597', latitude: 26.1234, longitude: -97.1678, lotCount: 60, estimatedOccupancy: '75.00', propertyType: 'mixed', ownerName: 'Island Breeze LLC', source: 'tdhca' },
  { name: 'Brownsville Family Park', address: '2800 Boca Chica Blvd', city: 'Brownsville', county: 'Cameron', zip: '78521', latitude: 25.9456, longitude: -97.4789, lotCount: 130, estimatedOccupancy: '91.00', propertyType: 'family', ownerName: 'Brownsville Communities', source: 'tdhca' },
  { name: 'Harlingen Oaks', address: '1500 S 77 Sunshine Strip', city: 'Harlingen', county: 'Cameron', zip: '78550', latitude: 26.1834, longitude: -97.6923, lotCount: 95, estimatedOccupancy: '88.00', propertyType: 'family', ownerName: 'Oaks Properties Inc', source: 'tdhca' },
  { name: 'Los Fresnos Ranch MHC', address: '800 N Arroyo Blvd', city: 'Los Fresnos', county: 'Cameron', zip: '78566', latitude: 26.0712, longitude: -97.4745, lotCount: 72, estimatedOccupancy: '85.00', propertyType: 'family', ownerName: 'Fresnos Ranch LLC', source: 'cad' },
  { name: 'Port Isabel Senior Village', address: '400 W Maxan St', city: 'Port Isabel', county: 'Cameron', zip: '78578', latitude: 26.0623, longitude: -97.2345, lotCount: 110, estimatedOccupancy: '95.00', propertyType: 'senior', ownerName: 'Coastal Senior Living', source: 'tdhca' },
  { name: 'San Benito Gardens', address: '1200 N Sam Houston Blvd', city: 'San Benito', county: 'Cameron', zip: '78586', latitude: 26.1456, longitude: -97.6312, lotCount: 85, estimatedOccupancy: '89.00', propertyType: 'family', ownerName: 'San Benito Land', source: 'tdhca' },
  { name: 'La Feria Estates', address: '600 W Express 83', city: 'La Feria', county: 'Cameron', zip: '78559', latitude: 26.1612, longitude: -97.8234, lotCount: 48, estimatedOccupancy: '86.00', propertyType: 'family', ownerName: 'Feria Estates Inc', source: 'cad' },
  { name: 'Rancho Viejo MHP', address: '2200 Rancho Viejo Dr', city: 'Rancho Viejo', county: 'Cameron', zip: '78575', latitude: 26.0345, longitude: -97.5512, lotCount: 55, estimatedOccupancy: '92.00', propertyType: 'mixed', ownerName: 'Viejo Properties', source: 'tdhca' },
  { name: 'Palm Village Brownsville', address: '4500 E 14th St', city: 'Brownsville', county: 'Cameron', zip: '78521', latitude: 25.9612, longitude: -97.4234, lotCount: 115, estimatedOccupancy: '90.00', propertyType: 'family', ownerName: 'Palm Village Corp', source: 'tdhca' },
  { name: 'Bayview Senior Community', address: '300 Bayview Dr', city: 'Los Fresnos', county: 'Cameron', zip: '78566', latitude: 26.0534, longitude: -97.3823, lotCount: 68, estimatedOccupancy: '94.00', propertyType: 'senior', ownerName: 'Bayview Senior LLC', source: 'tdhca' },
  { name: 'Rio Hondo Village', address: '700 S Arroyo Blvd', city: 'Rio Hondo', county: 'Cameron', zip: '78583', latitude: 26.2345, longitude: -97.5812, lotCount: 42, estimatedOccupancy: '81.00', propertyType: 'family', ownerName: 'Hondo Village Inc', source: 'cad' },
  { name: 'Combes Community Park', address: '400 W Austin Ave', city: 'Combes', county: 'Cameron', zip: '78535', latitude: 26.2456, longitude: -97.7345, lotCount: 35, estimatedOccupancy: '77.00', propertyType: 'family', ownerName: 'Combes Land LLC', source: 'cad' },
  { name: 'Laguna Vista MHC', address: '900 Laguna Blvd', city: 'Laguna Vista', county: 'Cameron', zip: '78578', latitude: 26.0923, longitude: -97.2912, lotCount: 88, estimatedOccupancy: '93.00', propertyType: 'senior', ownerName: 'Laguna Living', source: 'tdhca' },
  { name: 'Primera Heights', address: '300 N FM 510', city: 'Primera', county: 'Cameron', zip: '78552', latitude: 26.2267, longitude: -97.7523, lotCount: 38, estimatedOccupancy: '84.00', propertyType: 'family', ownerName: 'Primera Holdings', source: 'cad' },
  { name: 'Santa Rosa Trails', address: '500 W US-281', city: 'Santa Rosa', county: 'Cameron', zip: '78593', latitude: 26.2578, longitude: -97.8234, lotCount: 52, estimatedOccupancy: '80.00', propertyType: 'family', ownerName: 'Santa Rosa Land Co', source: 'tdhca' },
];

// Nueces County parks (~12)
const nuecesParks: CommunityData[] = [
  { name: 'Corpus Christi Bay Park', address: '4200 S Padre Island Dr', city: 'Corpus Christi', county: 'Nueces', zip: '78411', latitude: 27.7234, longitude: -97.3567, lotCount: 105, estimatedOccupancy: '90.00', propertyType: 'family', ownerName: 'Bay Park Holdings', source: 'tdhca' },
  { name: 'Portland Shores MHC', address: '1800 Moore Ave', city: 'Portland', county: 'Nueces', zip: '78374', latitude: 27.8912, longitude: -97.3234, lotCount: 78, estimatedOccupancy: '92.00', propertyType: 'family', ownerName: 'Portland Communities', source: 'tdhca' },
  { name: 'Calallen Meadows', address: '5600 Leopard St', city: 'Corpus Christi', county: 'Nueces', zip: '78408', latitude: 27.8345, longitude: -97.4712, lotCount: 88, estimatedOccupancy: '87.00', propertyType: 'family', ownerName: 'Calallen Properties', source: 'cad' },
  { name: 'Robstown Community Park', address: '1200 E Main Ave', city: 'Robstown', county: 'Nueces', zip: '78380', latitude: 27.7923, longitude: -97.6689, lotCount: 65, estimatedOccupancy: '83.00', propertyType: 'family', ownerName: 'Robstown Land LLC', source: 'tdhca' },
  { name: 'Flour Bluff Senior Village', address: '2400 Waldron Rd', city: 'Corpus Christi', county: 'Nueces', zip: '78418', latitude: 27.6567, longitude: -97.2789, lotCount: 92, estimatedOccupancy: '96.00', propertyType: 'senior', ownerName: 'Gulf Senior Living', source: 'tdhca' },
  { name: 'Annaville Estates', address: '3800 Up River Rd', city: 'Corpus Christi', county: 'Nueces', zip: '78408', latitude: 27.8234, longitude: -97.4345, lotCount: 55, estimatedOccupancy: '89.00', propertyType: 'family', ownerName: 'Annaville Estates Inc', source: 'cad' },
  { name: 'Bishop Ranch MHP', address: '900 E Main St', city: 'Bishop', county: 'Nueces', zip: '78343', latitude: 27.5856, longitude: -97.7934, lotCount: 42, estimatedOccupancy: '81.00', propertyType: 'family', ownerName: 'Bishop Ranch Co', source: 'tdhca' },
  { name: 'Driscoll Community', address: '400 W Main St', city: 'Driscoll', county: 'Nueces', zip: '78351', latitude: 27.6712, longitude: -97.7445, lotCount: 30, estimatedOccupancy: '76.00', propertyType: 'family', ownerName: 'Driscoll Land', source: 'cad' },
  { name: 'Padre Island Gateway', address: '15000 S Padre Island Dr', city: 'Corpus Christi', county: 'Nueces', zip: '78418', latitude: 27.6234, longitude: -97.2345, lotCount: 125, estimatedOccupancy: '88.00', propertyType: 'mixed', ownerName: 'Gateway Properties', source: 'tdhca' },
  { name: 'Westside Village', address: '6200 Ayers St', city: 'Corpus Christi', county: 'Nueces', zip: '78415', latitude: 27.7445, longitude: -97.4123, lotCount: 70, estimatedOccupancy: '85.00', propertyType: 'family', ownerName: 'Westside Management', source: 'tdhca' },
  { name: 'London Trails MHP', address: '2800 FM 43', city: 'Corpus Christi', county: 'Nueces', zip: '78415', latitude: 27.7123, longitude: -97.4567, lotCount: 48, estimatedOccupancy: '82.00', propertyType: 'family', ownerName: 'London Trails LLC', source: 'cad' },
  { name: 'Agua Dulce Estates', address: '300 S US-281', city: 'Agua Dulce', county: 'Nueces', zip: '78330', latitude: 27.7845, longitude: -97.9123, lotCount: 35, estimatedOccupancy: '74.00', propertyType: 'family', ownerName: 'Dulce Estates Inc', source: 'tdhca' },
];

// Travis County parks (~10)
const travisParks: CommunityData[] = [
  { name: 'Austin Oaks MHC', address: '7800 N Lamar Blvd', city: 'Austin', county: 'Travis', zip: '78752', latitude: 30.3456, longitude: -97.7145, lotCount: 85, estimatedOccupancy: '95.00', propertyType: 'family', ownerName: 'Austin Oaks Holdings', source: 'tdhca' },
  { name: 'Del Valle Community', address: '4200 Ross Rd', city: 'Del Valle', county: 'Travis', zip: '78617', latitude: 30.1789, longitude: -97.6234, lotCount: 110, estimatedOccupancy: '92.00', propertyType: 'family', ownerName: 'Del Valle Properties', source: 'tdhca' },
  { name: 'Pflugerville Pines', address: '15800 Windermere Dr', city: 'Pflugerville', county: 'Travis', zip: '78660', latitude: 30.4512, longitude: -97.6178, lotCount: 72, estimatedOccupancy: '93.00', propertyType: 'family', ownerName: 'Pines Communities LLC', source: 'cad' },
  { name: 'Manor Creek Estates', address: '12400 US-290 E', city: 'Manor', county: 'Travis', zip: '78653', latitude: 30.3567, longitude: -97.5234, lotCount: 95, estimatedOccupancy: '89.00', propertyType: 'family', ownerName: 'Manor Estates Inc', source: 'tdhca' },
  { name: 'South Austin Senior Park', address: '6900 S Congress Ave', city: 'Austin', county: 'Travis', zip: '78745', latitude: 30.2012, longitude: -97.7823, lotCount: 55, estimatedOccupancy: '97.00', propertyType: 'senior', ownerName: 'South Austin Living', source: 'tdhca' },
  { name: 'Onion Creek Village', address: '9200 Onion Creek Pkwy', city: 'Austin', county: 'Travis', zip: '78747', latitude: 30.1534, longitude: -97.7512, lotCount: 68, estimatedOccupancy: '91.00', propertyType: 'family', ownerName: 'Creek Village LLC', source: 'cad' },
  { name: 'East Austin Community Park', address: '3500 E Martin Luther King', city: 'Austin', county: 'Travis', zip: '78721', latitude: 30.2745, longitude: -97.6989, lotCount: 45, estimatedOccupancy: '88.00', propertyType: 'mixed', ownerName: 'East Austin Properties', source: 'tdhca' },
  { name: 'Creedmoor Heights MHP', address: '8200 FM 1327', city: 'Creedmoor', county: 'Travis', zip: '78610', latitude: 30.0934, longitude: -97.7345, lotCount: 58, estimatedOccupancy: '84.00', propertyType: 'family', ownerName: 'Creedmoor Holdings', source: 'cad' },
  { name: 'Lago Vista Trails', address: '4100 Lohman Ford Rd', city: 'Lago Vista', county: 'Travis', zip: '78645', latitude: 30.4534, longitude: -97.9912, lotCount: 40, estimatedOccupancy: '90.00', propertyType: 'family', ownerName: 'Vista Trails Corp', source: 'tdhca' },
  { name: 'Bee Cave Terrace', address: '13000 Bee Caves Rd', city: 'Bee Cave', county: 'Travis', zip: '78738', latitude: 30.3089, longitude: -97.9423, lotCount: 35, estimatedOccupancy: '96.00', propertyType: 'senior', ownerName: 'Bee Cave Living LLC', source: 'tdhca' },
];

const allParks = [...bexarParks, ...hidalgoParks, ...cameronParks, ...nuecesParks, ...travisParks];

// Generate 12 months of titling data
function generateTitlingData() {
  const counties = ['Bexar', 'Hidalgo', 'Cameron', 'Nueces', 'Travis'];
  const baseData: Record<string, { newTitles: number; transfers: number; totalActive: number }> = {
    Bexar: { newTitles: 45, transfers: 120, totalActive: 8500 },
    Hidalgo: { newTitles: 65, transfers: 180, totalActive: 12000 },
    Cameron: { newTitles: 35, transfers: 95, totalActive: 6200 },
    Nueces: { newTitles: 25, transfers: 70, totalActive: 4800 },
    Travis: { newTitles: 30, transfers: 85, totalActive: 5500 },
  };

  const titlings: Array<{
    county: string;
    month: string;
    newTitles: number;
    transfers: number;
    totalActive: number;
    sourceReport: string;
  }> = [];

  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toISOString().slice(0, 10);

    for (const county of counties) {
      const base = baseData[county]!;
      // Add some variation (+/- 20%)
      const variation = () => 0.8 + Math.random() * 0.4;
      titlings.push({
        county,
        month: monthStr,
        newTitles: Math.round(base.newTitles * variation()),
        transfers: Math.round(base.transfers * variation()),
        totalActive: Math.round(base.totalActive * (1 + (11 - i) * 0.005)),
        sourceReport: `TDHCA Monthly Report ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      });
    }
  }

  return titlings;
}

async function seed() {
  console.log('Starting MH Parks seed...\n');

  const db = getDb();

  // Insert communities
  console.log(`Inserting ${allParks.length} MH communities...`);

  for (const park of allParks) {
    await db.insert(mhCommunities).values({
      id: `mhc_${createId()}`,
      name: park.name,
      address: park.address,
      city: park.city,
      county: park.county,
      state: 'TX',
      zip: park.zip,
      latitude: park.latitude,
      longitude: park.longitude,
      lotCount: park.lotCount,
      estimatedOccupancy: park.estimatedOccupancy,
      propertyType: park.propertyType,
      ownerName: park.ownerName,
      source: park.source,
    });
  }

  console.log(`  Done: ${allParks.length} communities inserted`);
  console.log(`    Bexar: ${bexarParks.length}`);
  console.log(`    Hidalgo: ${hidalgoParks.length}`);
  console.log(`    Cameron: ${cameronParks.length}`);
  console.log(`    Nueces: ${nuecesParks.length}`);
  console.log(`    Travis: ${travisParks.length}`);

  // Insert titling data
  const titlings = generateTitlingData();
  console.log(`\nInserting ${titlings.length} titling records...`);

  for (const titling of titlings) {
    await db.insert(mhTitlings).values({
      id: `mht_${createId()}`,
      county: titling.county,
      month: titling.month,
      newTitles: titling.newTitles,
      transfers: titling.transfers,
      totalActive: titling.totalActive,
      sourceReport: titling.sourceReport,
    });
  }

  console.log(`  Done: ${titlings.length} titling records inserted`);

  console.log('\nMH Parks seed completed successfully!\n');
  process.exit(0);
}

seed().catch((error) => {
  console.error('MH Parks seed failed:', error);
  process.exit(1);
});
