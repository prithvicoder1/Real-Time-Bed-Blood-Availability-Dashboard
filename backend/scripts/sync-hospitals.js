#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const SOURCE = 'https://livingatlas.esri.in/server/rest/services/LivingAtlas/IND_Hospital_Directory/MapServer/0/query';
const OUTPUT = path.join(__dirname, '../data/hospitals.json');
const BLOOD_TYPES = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const CITY_TARGETS = [
  ['Delhi',28.61,77.21],['Mumbai',19.08,72.88],['Bengaluru',12.97,77.59],['Chennai',13.08,80.27],['Kolkata',22.57,88.36],
  ['Hyderabad',17.39,78.49],['Ahmedabad',23.02,72.57],['Pune',18.52,73.86],['Jaipur',26.91,75.79],['Lucknow',26.85,80.95],
  ['Nagpur',21.15,79.09],['Indore',22.72,75.86],['Bhopal',23.26,77.41],['Patna',25.61,85.14],['Ranchi',23.34,85.31],
  ['Bhubaneswar',20.30,85.82],['Guwahati',26.14,91.74],['Chandigarh',30.73,76.78],['Surat',21.17,72.83],['Thiruvananthapuram',8.52,76.94]
];
const FIELDS = 'objectid,health_facility_name,address,locality,facility_type,state_name,district_name,lat,lon';

function demoInventory(id, type) {
  let seed = [...String(id)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const next = max => (seed = (seed * 9301 + 49297) % 233280) % max;
  const scale = /hospital|medical college/i.test(type) ? 3 : /community|district/i.test(type) ? 2 : 1;
  const total = 30 * scale + next(90 * scale); const available = 3 + next(Math.max(5, Math.round(total * .28)));
  return { beds: { total, occupied: total - available, icu: next(12 * scale), oxygen: next(20 * scale) }, blood: Object.fromEntries(BLOOD_TYPES.map(group => [group, next(30 * scale)])) };
}

async function main() {
  const fetchRows = async (where, count, offset=0) => { const params = new URLSearchParams({ where, outFields:FIELDS, returnGeometry:'false', resultRecordCount:String(count), resultOffset:String(offset), orderByFields:'objectid', f:'json' }); const response=await fetch(`${SOURCE}?${params}`);if(!response.ok)throw new Error(`Directory request failed: ${response.status}`);return (await response.json()).features||[]; };
  const cityBatches=await Promise.all(CITY_TARGETS.map(async([coverageCity,lat,lon])=>(await fetchRows(`lat BETWEEN ${lat-.3} AND ${lat+.3} AND lon BETWEEN ${lon-.3} AND ${lon+.3}`,7)).map(feature=>({...feature,coverageCity}))));
  const selected=new Map(cityBatches.flat().map(feature=>[feature.attributes.objectid,feature]));
  for(const offset of [0,5000,10000,15000,20000]){if(selected.size>=150)break;for(const feature of await fetchRows('1=1',50,offset)){if(!selected.has(feature.attributes.objectid))selected.set(feature.attributes.objectid,{...feature,coverageCity:null});if(selected.size===150)break;}}
  const records=[...selected.values()].slice(0,150).map(({ attributes: row,coverageCity }) => { const id = `nhd-${row.objectid}`; return { id, name: row.health_facility_name?.trim() || `Health facility ${row.objectid}`, email: `${id}@directory.carebridge.invalid`, city: coverageCity || row.district_name?.trim() || row.locality?.trim() || 'Unknown', state: row.state_name?.trim() || 'Unknown', location: [row.address,row.locality,row.district_name].filter(Boolean).join(', '), lat: row.lat, lng: row.lon, type: row.facility_type?.trim() || 'Health Facility', coverageCity, verificationStatus: 'public_directory', inventorySource: 'simulated_demo', sourceUrl: SOURCE, ...demoInventory(id, row.facility_type || '') }; });
  if(records.length!==150)throw new Error(`Expected 150 records, received ${records.length}`);
  fs.writeFileSync(OUTPUT, `${JSON.stringify(records, null, 2)}\n`); console.log(`Saved ${records.length} attributed directory records to ${OUTPUT}`);
}
main().catch(error => { console.error(error.message); process.exit(1); });
