#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const SOURCE = 'https://livingatlas.esri.in/server/rest/services/LivingAtlas/IND_Hospital_Directory/MapServer/0/query';
const OUTPUT = path.join(__dirname, '../data/hospitals.json');
const BLOOD_TYPES = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];

function demoInventory(id, type) {
  let seed = [...String(id)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const next = max => (seed = (seed * 9301 + 49297) % 233280) % max;
  const scale = /hospital|medical college/i.test(type) ? 3 : /community|district/i.test(type) ? 2 : 1;
  const total = 30 * scale + next(90 * scale); const available = 3 + next(Math.max(5, Math.round(total * .28)));
  return { beds: { total, occupied: total - available, icu: next(12 * scale), oxygen: next(20 * scale) }, blood: Object.fromEntries(BLOOD_TYPES.map(group => [group, next(30 * scale)])) };
}

async function main() {
  const params = new URLSearchParams({ where: '1=1', outFields: 'objectid,health_facility_name,address,locality,facility_type,state_name,district_name,lat,lon', returnGeometry: 'false', resultRecordCount: '150', orderByFields: 'objectid', f: 'json' });
  const response = await fetch(`${SOURCE}?${params}`); if (!response.ok) throw new Error(`Directory request failed: ${response.status}`);
  const payload = await response.json();
  const records = payload.features.map(({ attributes: row }) => { const id = `nhd-${row.objectid}`; return { id, name: row.health_facility_name?.trim() || `Health facility ${row.objectid}`, email: `${id}@directory.carebridge.invalid`, city: row.district_name?.trim() || row.locality?.trim() || 'Unknown', state: row.state_name?.trim() || 'Unknown', location: [row.address,row.locality].filter(Boolean).join(', '), lat: row.lat, lng: row.lon, type: row.facility_type?.trim() || 'Health Facility', verificationStatus: 'public_directory', inventorySource: 'simulated_demo', sourceUrl: SOURCE, ...demoInventory(id, row.facility_type || '') }; });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(records, null, 2)}\n`); console.log(`Saved ${records.length} attributed directory records to ${OUTPUT}`);
}
main().catch(error => { console.error(error.message); process.exit(1); });
