#!/usr/bin/env tsx

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Database connection
const sql = neon(process.env.NEON_DATABASE_URL!);

// OpenF1 API base URL
const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

// F1 team colors and branding
const TEAM_DATA = {
  'red_bull_racing': {
    name: 'Red Bull Racing',
    full_name: 'Red Bull Racing Honda RBPT',
    color_main: '#1E41FF',
    color_light: '#4B6BFF',
    color_dark: '#0A2EE6',
    logo_emoji: '🏆'
  },
  'mclaren': {
    name: 'McLaren',
    full_name: 'McLaren Mercedes',
    color_main: '#FF8700',
    color_light: '#FFB347',
    color_dark: '#E6760A',
    logo_emoji: '🧡'
  },
  'ferrari': {
    name: 'Ferrari',
    full_name: 'Scuderia Ferrari',
    color_main: '#E8002D',
    color_light: '#FF4D6D',
    color_dark: '#C4002A',
    logo_emoji: '🏎️'
  },
  'mercedes': {
    name: 'Mercedes',
    full_name: 'Mercedes-AMG Petronas F1 Team',
    color_main: '#27F4D2',
    color_light: '#5EF7DE',
    color_dark: '#1DD1B0',
    logo_emoji: '⭐'
  },
  'aston_martin': {
    name: 'Aston Martin',
    full_name: 'Aston Martin Aramco Cognizant F1 Team',
    color_main: '#229971',
    color_light: '#4CAF50',
    color_dark: '#1B7A5A',
    logo_emoji: '💚'
  },
  'rb': {
    name: 'RB',
    full_name: 'RB Formula One Team',
    color_main: '#6692FF',
    color_light: '#8BB0FF',
    color_dark: '#4A7AE6',
    logo_emoji: '🔵'
  },
  'alpine': {
    name: 'Alpine',
    full_name: 'BWT Alpine F1 Team',
    color_main: '#FF87BC',
    color_light: '#FFB3D1',
    color_dark: '#E665A0',
    logo_emoji: '🇫🇷'
  },
  'williams': {
    name: 'Williams',
    full_name: 'Williams Racing',
    color_main: '#64C4FF',
    color_light: '#8AD4FF',
    color_dark: '#4AB8E6',
    logo_emoji: '🔷'
  },
  'haas': {
    name: 'Haas',
    full_name: 'MoneyGram Haas F1 Team',
    color_main: '#B6BABD',
    color_light: '#D0D3D6',
    color_dark: '#9CA0A3',
    logo_emoji: '🇺🇸'
  },
  'sauber': {
    name: 'Sauber',
    full_name: 'Kick Sauber',
    color_main: '#52E252',
    color_light: '#7AE67A',
    color_dark: '#2ECC2E',
    logo_emoji: '🇨🇭'
  }
};

// 2025 F1 Drivers Data
const DRIVERS_2025 = [
  { code: 'VER', number: 1, first_name: 'Max', last_name: 'Verstappen', nationality: 'Dutch', flag: '🇳🇱', team: 'red_bull_racing', dob: '1997-09-30' },
  { code: 'PER', number: 11, first_name: 'Sergio', last_name: 'Perez', nationality: 'Mexican', flag: '🇲🇽', team: 'red_bull_racing', dob: '1990-01-26' },
  { code: 'NOR', number: 4, first_name: 'Lando', last_name: 'Norris', nationality: 'British', flag: '🇬🇧', team: 'mclaren', dob: '1999-11-13' },
  { code: 'PIA', number: 81, first_name: 'Oscar', last_name: 'Piastri', nationality: 'Australian', flag: '🇦🇺', team: 'mclaren', dob: '2001-04-06' },
  { code: 'LEC', number: 16, first_name: 'Charles', last_name: 'Leclerc', nationality: 'Monégasque', flag: '🇲🇨', team: 'ferrari', dob: '1997-10-16' },
  { code: 'HAM', number: 44, first_name: 'Lewis', last_name: 'Hamilton', nationality: 'British', flag: '🇬🇧', team: 'ferrari', dob: '1985-01-07' },
  { code: 'RUS', number: 63, first_name: 'George', last_name: 'Russell', nationality: 'British', flag: '🇬🇧', team: 'mercedes', dob: '1998-02-15' },
  { code: 'ANT', number: 12, first_name: 'Kimi', last_name: 'Antonelli', nationality: 'Italian', flag: '🇮🇹', team: 'mercedes', dob: '2006-08-25' },
  { code: 'ALO', number: 14, first_name: 'Fernando', last_name: 'Alonso', nationality: 'Spanish', flag: '🇪🇸', team: 'aston_martin', dob: '1981-07-29' },
  { code: 'STR', number: 18, first_name: 'Lance', last_name: 'Stroll', nationality: 'Canadian', flag: '🇨🇦', team: 'aston_martin', dob: '1998-10-29' },
  { code: 'TSU', number: 22, first_name: 'Yuki', last_name: 'Tsunoda', nationality: 'Japanese', flag: '🇯🇵', team: 'rb', dob: '2000-05-11' },
  { code: 'LAW', number: 30, first_name: 'Liam', last_name: 'Lawson', nationality: 'New Zealander', flag: '🇳🇿', team: 'rb', dob: '2002-02-11' },
  { code: 'GAS', number: 10, first_name: 'Pierre', last_name: 'Gasly', nationality: 'French', flag: '🇫🇷', team: 'alpine', dob: '1996-02-07' },
  { code: 'OCO', number: 31, first_name: 'Esteban', last_name: 'Ocon', nationality: 'French', flag: '🇫🇷', team: 'alpine', dob: '1996-09-17' },
  { code: 'ALB', number: 23, first_name: 'Alexander', last_name: 'Albon', nationality: 'Thai', flag: '🇹🇭', team: 'williams', dob: '1996-03-23' },
  { code: 'DOO', number: 45, first_name: 'Jack', last_name: 'Doohan', nationality: 'Australian', flag: '🇦🇺', team: 'williams', dob: '2003-01-20' },
  { code: 'HUL', number: 27, first_name: 'Nico', last_name: 'Hulkenberg', nationality: 'German', flag: '🇩🇪', team: 'haas', dob: '1987-08-19' },
  { code: 'BEA', number: 50, first_name: 'Oliver', last_name: 'Bearman', nationality: 'British', flag: '🇬🇧', team: 'haas', dob: '2005-05-08' },
  { code: 'HAD', number: 25, first_name: 'Gabriel', last_name: 'Bortoleto', nationality: 'Brazilian', flag: '🇧🇷', team: 'sauber', dob: '2004-10-14' },
  { code: 'SAI', number: 55, first_name: 'Carlos', last_name: 'Sainz', nationality: 'Spanish', flag: '🇪🇸', team: 'sauber', dob: '1994-09-01' }
];

// Constructor standings (2024 end of season points)
const CONSTRUCTOR_STANDINGS_2024 = {
  'red_bull_racing': 589,
  'mclaren': 544,
  'ferrari': 537,
  'mercedes': 382,
  'aston_martin': 94,
  'alpine': 65,
  'haas': 54,
  'rb': 46,
  'williams': 17,
  'sauber': 0
};

async function fetchFromOpenF1(endpoint: string) {
  try {
    const response = await fetch(`${OPENF1_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

async function seedCountries() {
  console.log('🌍 Seeding countries...');

  // Common F1 countries with their flags
  const countries = [
    { country_key: 'aus', country_name: 'Australia', flag_emoji: '🇦🇺' },
    { country_key: 'bhr', country_name: 'Bahrain', flag_emoji: '🇧🇭' },
    { country_key: 'sau', country_name: 'Saudi Arabia', flag_emoji: '🇸🇦' },
    { country_key: 'jpn', country_name: 'Japan', flag_emoji: '🇯🇵' },
    { country_key: 'chn', country_name: 'China', flag_emoji: '🇨🇳' },
    { country_key: 'usa', country_name: 'United States', flag_emoji: '🇺🇸' },
    { country_key: 'ita', country_name: 'Italy', flag_emoji: '🇮🇹' },
    { country_key: 'mon', country_name: 'Monaco', flag_emoji: '🇲🇨' },
    { country_key: 'can', country_name: 'Canada', flag_emoji: '🇨🇦' },
    { country_key: 'esp', country_name: 'Spain', flag_emoji: '🇪🇸' },
    { country_key: 'aut', country_name: 'Austria', flag_emoji: '🇦🇹' },
    { country_key: 'gbr', country_name: 'Great Britain', flag_emoji: '🇬🇧' },
    { country_key: 'hun', country_name: 'Hungary', flag_emoji: '🇭🇺' },
    { country_key: 'bel', country_name: 'Belgium', flag_emoji: '🇧🇪' },
    { country_key: 'nld', country_name: 'Netherlands', flag_emoji: '🇳🇱' },
    { country_key: 'aze', country_name: 'Azerbaijan', flag_emoji: '🇦🇿' },
    { country_key: 'sgp', country_name: 'Singapore', flag_emoji: '🇸🇬' },
    { country_key: 'mex', country_name: 'Mexico', flag_emoji: '🇲🇽' },
    { country_key: 'bra', country_name: 'Brazil', flag_emoji: '🇧🇷' },
    { country_key: 'qat', country_name: 'Qatar', flag_emoji: '🇶🇦' },
    { country_key: 'are', country_name: 'UAE', flag_emoji: '🇦🇪' }
  ];

  for (const country of countries) {
    await sql`
      INSERT INTO countries (country_key, country_name, flag_emoji)
      VALUES (${country.country_key}, ${country.country_name}, ${country.flag_emoji})
      ON CONFLICT (country_key) DO UPDATE SET
        country_name = EXCLUDED.country_name,
        flag_emoji = EXCLUDED.flag_emoji
    `;
  }

  console.log(`✅ Seeded ${countries.length} countries`);
}

async function seedTeams() {
  console.log('🏁 Seeding teams...');

  for (const [key, team] of Object.entries(TEAM_DATA)) {
    await sql`
      INSERT INTO teams (team_key, team_name, full_name, color_main, color_light, color_dark, logo_emoji)
      VALUES (${key}, ${team.name}, ${team.full_name}, ${team.color_main}, ${team.color_light}, ${team.color_dark}, ${team.logo_emoji})
      ON CONFLICT (team_key) DO UPDATE SET
        team_name = EXCLUDED.team_name,
        full_name = EXCLUDED.full_name,
        color_main = EXCLUDED.color_main,
        color_light = EXCLUDED.color_light,
        color_dark = EXCLUDED.color_dark,
        logo_emoji = EXCLUDED.logo_emoji
    `;
  }

  console.log(`✅ Seeded ${Object.keys(TEAM_DATA).length} teams`);
}

async function seedDrivers() {
  console.log('🏎️ Seeding drivers...');

  for (const driver of DRIVERS_2025) {
    // Get team ID
    const teamResult = await sql`SELECT id FROM teams WHERE team_key = ${driver.team}`;
    const teamId = teamResult[0]?.id;

    if (!teamId) {
      console.error(`Team not found: ${driver.team}`);
      continue;
    }

    await sql`
      INSERT INTO drivers (
        driver_number, driver_code, first_name, last_name, full_name,
        nationality, flag_emoji, date_of_birth, team_id, active
      )
      VALUES (
        ${driver.number}, ${driver.code}, ${driver.first_name}, ${driver.last_name},
        ${driver.first_name + ' ' + driver.last_name}, ${driver.nationality}, ${driver.flag},
        ${driver.dob}, ${teamId}, true
      )
      ON CONFLICT (driver_code) DO UPDATE SET
        driver_number = EXCLUDED.driver_number,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        full_name = EXCLUDED.full_name,
        nationality = EXCLUDED.nationality,
        flag_emoji = EXCLUDED.flag_emoji,
        date_of_birth = EXCLUDED.date_of_birth,
        team_id = EXCLUDED.team_id,
        active = EXCLUDED.active
    `;
  }

  console.log(`✅ Seeded ${DRIVERS_2025.length} drivers`);
}

async function seedConstructorStandings() {
  console.log('🏆 Seeding constructor standings...');

  let position = 1;
  // Sort teams by points (descending)
  const sortedTeams = Object.entries(CONSTRUCTOR_STANDINGS_2024)
    .sort(([,a], [,b]) => b - a);

  for (const [teamKey, points] of sortedTeams) {
    const teamResult = await sql`SELECT id FROM teams WHERE team_key = ${teamKey}`;
    const teamId = teamResult[0]?.id;

    if (!teamId) {
      console.error(`Team not found: ${teamKey}`);
      continue;
    }

    await sql`
      INSERT INTO constructor_standings (year, team_id, position, points)
      VALUES (2025, ${teamId}, ${position}, ${points})
      ON CONFLICT (year, team_id) DO UPDATE SET
        position = EXCLUDED.position,
        points = EXCLUDED.points
    `;

    position++;
  }

  console.log(`✅ Seeded constructor standings for ${sortedTeams.length} teams`);
}

async function seedMeetingsFromOpenF1() {
  console.log('📅 Fetching 2025 meetings from OpenF1...');

  const meetings = await fetchFromOpenF1('/meetings?year=2025');
  if (!meetings || meetings.length === 0) {
    console.error('❌ No meetings data from OpenF1 API');
    return;
  }

  console.log(`📊 Found ${meetings.length} meetings for 2025`);

  for (const meeting of meetings) {
    // Find country by matching country name
    const countryResult = await sql`
      SELECT id FROM countries
      WHERE LOWER(country_name) = LOWER(${meeting.country_name})
      OR country_key = ${meeting.country_key}
    `;
    let countryId = countryResult[0]?.id;

    // If country not found, create it
    if (!countryId) {
      const insertResult = await sql`
        INSERT INTO countries (country_key, country_name, flag_emoji)
        VALUES (${meeting.country_key}, ${meeting.country_name}, '🏁')
        RETURNING id
      `;
      countryId = insertResult[0]?.id;
    }

    // Insert or update meeting
    await sql`
      INSERT INTO meetings (
        meeting_key, year, round_number, meeting_name, official_name,
        country_id, date_start, date_end, gmt_offset
      )
      VALUES (
        ${meeting.meeting_key}, ${meeting.year}, ${meeting.round_number || 0},
        ${meeting.meeting_name}, ${meeting.meeting_official_name || meeting.meeting_name},
        ${countryId}, ${meeting.date_start}, ${meeting.date_end}, ${meeting.gmt_offset}
      )
      ON CONFLICT (meeting_key) DO UPDATE SET
        year = EXCLUDED.year,
        round_number = EXCLUDED.round_number,
        meeting_name = EXCLUDED.meeting_name,
        official_name = EXCLUDED.official_name,
        country_id = EXCLUDED.country_id,
        date_start = EXCLUDED.date_start,
        date_end = EXCLUDED.date_end,
        gmt_offset = EXCLUDED.gmt_offset
    `;
  }

  console.log(`✅ Seeded ${meetings.length} meetings from OpenF1`);
}

async function updateSyncStatus(dataSource: string, endpoint: string, status: string, recordsCount = 0, error?: string) {
  await sql`
    INSERT INTO sync_status (data_source, endpoint, last_sync, sync_status, records_synced, error_message)
    VALUES (${dataSource}, ${endpoint}, CURRENT_TIMESTAMP, ${status}, ${recordsCount}, ${error})
  `;
}

async function main() {
  try {
    console.log('🚀 Starting F1 dynamic data seeding...\n');

    // Run the schema creation first
    console.log('📋 Creating database schema...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'create_f1_schema.sql'), 'utf8');
    // Split and execute schema commands individually since neon doesn't support .unsafe()
    const commands = schemaSQL.split(';').filter(cmd => cmd.trim().length > 0);
    for (const command of commands) {
      if (command.trim()) {
        await sql.unsafe(command.trim() + ';');
      }
    }
    console.log('✅ Database schema created\n');

    // Seed reference data first
    await seedCountries();
    await updateSyncStatus('static_data', 'countries', 'success', 21);

    await seedTeams();
    await updateSyncStatus('static_data', 'teams', 'success', 10);

    await seedDrivers();
    await updateSyncStatus('static_data', 'drivers', 'success', 20);

    await seedConstructorStandings();
    await updateSyncStatus('static_data', 'constructor_standings', 'success', 10);

    // Seed dynamic data from OpenF1
    await seedMeetingsFromOpenF1();
    await updateSyncStatus('openf1_api', 'meetings?year=2025', 'success');

    console.log('\n🎉 F1 dynamic data seeding completed successfully!');
    console.log('\n📈 Database now contains:');
    console.log('   • 2025 season data structure');
    console.log('   • All 10 F1 teams with branding');
    console.log('   • All 20 drivers for 2025 season');
    console.log('   • Constructor championship standings');
    console.log('   • 2025 race calendar from OpenF1 API');
    console.log('   • Sync tracking for future updates\n');

  } catch (error) {
    console.error('❌ Error seeding F1 data:', error);
    await updateSyncStatus('seeding', 'full_seed', 'error', 0, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}