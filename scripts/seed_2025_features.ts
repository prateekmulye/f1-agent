#!/usr/bin/env -S node --loader tsx
import { neon } from "@neondatabase/serverless";
import fs from "node:fs/promises";

const sql = neon(process.env.NEON_DATABASE_URL!);

// Mock 2025 season feature data based on 2024 performance and expected 2025 changes
const generate2025Features = () => {
  const races = [
    "2025_bahrain", "2025_saudi", "2025_australia", "2025_japan", "2025_china",
    "2025_miami", "2025_emilia", "2025_monaco", "2025_spain", "2025_canada",
    "2025_austria", "2025_britain", "2025_hungary", "2025_belgium", "2025_netherlands",
    "2025_italy", "2025_azerbaij", "2025_singapore", "2025_usa", "2025_mexico",
    "2025_brazil", "2025_lasvegas", "2025_qatar", "2025_abudhabi"
  ];

  const drivers = [
    // Red Bull - Still dominant but facing more competition
    { id: "VER", quali_pos: 1.8, longrun_delta: -0.4, constructor_form: 0.9, driver_form: 0.95, circuit_effect: 0.1, weather_risk: 0.05 },
    { id: "PER", quali_pos: 4.2, longrun_delta: -0.1, constructor_form: 0.9, driver_form: 0.75, circuit_effect: 0.05, weather_risk: 0.1 },

    // Ferrari - Hamilton boost expected
    { id: "HAM", quali_pos: 2.5, longrun_delta: -0.3, constructor_form: 0.85, driver_form: 0.9, circuit_effect: 0.08, weather_risk: 0.05 },
    { id: "LEC", quali_pos: 2.8, longrun_delta: -0.25, constructor_form: 0.85, driver_form: 0.88, circuit_effect: 0.1, weather_risk: 0.08 },

    // Mercedes - Rebuilding with Russell and Antonelli
    { id: "RUS", quali_pos: 3.5, longrun_delta: -0.15, constructor_form: 0.8, driver_form: 0.85, circuit_effect: 0.05, weather_risk: 0.1 },
    { id: "ANT", quali_pos: 8.5, longrun_delta: 0.2, constructor_form: 0.8, driver_form: 0.7, circuit_effect: 0.0, weather_risk: 0.15 },

    // McLaren - Continuing strong form
    { id: "NOR", quali_pos: 3.2, longrun_delta: -0.2, constructor_form: 0.88, driver_form: 0.9, circuit_effect: 0.08, weather_risk: 0.08 },
    { id: "PIA", quali_pos: 4.5, longrun_delta: -0.1, constructor_form: 0.88, driver_form: 0.82, circuit_effect: 0.05, weather_risk: 0.1 },

    // Aston Martin - Experienced lineup
    { id: "ALO", quali_pos: 6.2, longrun_delta: 0.1, constructor_form: 0.7, driver_form: 0.88, circuit_effect: 0.1, weather_risk: 0.05 },
    { id: "STR", quali_pos: 9.5, longrun_delta: 0.25, constructor_form: 0.7, driver_form: 0.68, circuit_effect: 0.02, weather_risk: 0.12 },

    // Alpine - Mid-pack battle
    { id: "GAS", quali_pos: 8.8, longrun_delta: 0.15, constructor_form: 0.65, driver_form: 0.78, circuit_effect: 0.05, weather_risk: 0.1 },
    { id: "OCO", quali_pos: 9.2, longrun_delta: 0.18, constructor_form: 0.65, driver_form: 0.75, circuit_effect: 0.03, weather_risk: 0.12 },

    // Williams - Fighting for points
    { id: "ALB", quali_pos: 11.5, longrun_delta: 0.3, constructor_form: 0.6, driver_form: 0.8, circuit_effect: 0.08, weather_risk: 0.15 },
    { id: "SAR", quali_pos: 14.2, longrun_delta: 0.45, constructor_form: 0.6, driver_form: 0.65, circuit_effect: 0.02, weather_risk: 0.18 },

    // RB (AlphaTauri) - Solid midfield
    { id: "TSU", quali_pos: 10.8, longrun_delta: 0.25, constructor_form: 0.68, driver_form: 0.76, circuit_effect: 0.05, weather_risk: 0.12 },
    { id: "RIC", quali_pos: 11.2, longrun_delta: 0.28, constructor_form: 0.68, driver_form: 0.72, circuit_effect: 0.08, weather_risk: 0.1 },

    // Kick Sauber - Back of grid battle
    { id: "BOT", quali_pos: 13.5, longrun_delta: 0.4, constructor_form: 0.55, driver_form: 0.75, circuit_effect: 0.05, weather_risk: 0.15 },
    { id: "ZHO", quali_pos: 15.8, longrun_delta: 0.5, constructor_form: 0.55, driver_form: 0.68, circuit_effect: 0.02, weather_risk: 0.18 },

    // Haas - Consistency challenge
    { id: "HUL", quali_pos: 12.8, longrun_delta: 0.35, constructor_form: 0.62, driver_form: 0.78, circuit_effect: 0.06, weather_risk: 0.12 },
    { id: "MAG", quali_pos: 13.2, longrun_delta: 0.38, constructor_form: 0.62, driver_form: 0.74, circuit_effect: 0.04, weather_risk: 0.14 }
  ];

  const features = [];

  for (const race of races) {
    for (const driver of drivers) {
      // Add some randomization to make it more realistic
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier
      const circuitVariation = (Math.random() - 0.5) * 0.2; // -0.1 to +0.1 variation

      features.push({
        race_id: race,
        driver_id: driver.id,
        quali_pos: Math.round(Math.max(1, Math.min(20, driver.quali_pos * randomFactor))),
        avg_fp_longrun_delta: driver.longrun_delta + circuitVariation,
        constructor_form: Math.max(0, Math.min(1, driver.constructor_form * randomFactor)),
        driver_form: Math.max(0, Math.min(1, driver.driver_form * randomFactor)),
        circuit_effect: driver.circuit_effect + circuitVariation * 0.5,
        weather_risk: Math.max(0, Math.min(0.3, driver.weather_risk * randomFactor))
      });
    }
  }

  return features;
};

async function run() {
  console.log("🏁 Seeding 2025 F1 season features...");

  // First, seed the updated drivers and races
  console.log("📊 Updating drivers and races data...");

  const drivers = JSON.parse(await fs.readFile("apps/web/data/drivers.json", "utf8"));
  for (const d of drivers) {
    await sql`insert into drivers(id, code, name, constructor)
              values (${d.id}, ${d.code}, ${d.name}, ${d.constructor})
              on conflict (id) do update set
                code=excluded.code,
                name=excluded.name,
                constructor=excluded.constructor`;
  }
  console.log(`✅ Updated ${drivers.length} drivers`);

  const races = JSON.parse(await fs.readFile("apps/web/data/races.json", "utf8"));
  for (const r of races) {
    await sql`insert into races(id, season, round, name, circuit, date, country)
              values (${r.id}, ${r.season}, ${r.round}, ${r.name}, ${r.circuit}, ${r.date}, ${r.country})
              on conflict (id) do nothing`;
  }
  console.log(`✅ Updated ${races.length} races`);

  // Generate and seed 2025 features
  console.log("🔮 Generating 2025 season predictions features...");
  const features2025 = generate2025Features();

  let insertedCount = 0;
  for (const feat of features2025) {
    await sql`insert into features_current(race_id, driver_id, quali_pos, avg_fp_longrun_delta, constructor_form, driver_form, circuit_effect, weather_risk)
              values (${feat.race_id}, ${feat.driver_id}, ${feat.quali_pos}, ${feat.avg_fp_longrun_delta}, ${feat.constructor_form}, ${feat.driver_form}, ${feat.circuit_effect}, ${feat.weather_risk})
              on conflict (race_id, driver_id) do update set
                quali_pos=excluded.quali_pos,
                avg_fp_longrun_delta=excluded.avg_fp_longrun_delta,
                constructor_form=excluded.constructor_form,
                driver_form=excluded.driver_form,
                circuit_effect=excluded.circuit_effect,
                weather_risk=excluded.weather_risk`;
    insertedCount++;
  }

  console.log(`✅ Generated and seeded ${insertedCount} 2025 season features`);
  console.log("🎯 2025 season data is ready for predictions!");

  // Show sample prediction for first 2025 race
  console.log("\n🏎️ Sample predictions for Bahrain GP 2025:");
  const samplePredictions = await sql`
    SELECT
      fc.driver_id,
      d.name,
      d.constructor,
      fc.quali_pos,
      fc.constructor_form,
      fc.driver_form
    FROM features_current fc
    JOIN drivers d ON d.id = fc.driver_id
    WHERE fc.race_id = '2025_bahrain'
    ORDER BY fc.quali_pos ASC
    LIMIT 8
  `;

  console.table(samplePredictions);
}

if (require.main === module) {
  run().catch((error) => {
    console.error("❌ Error seeding 2025 data:", error);
    process.exit(1);
  });
}