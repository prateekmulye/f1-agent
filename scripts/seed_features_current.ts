#!/usr/bin/env -S node --import tsx
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.NEON_DATABASE_URL!);

const RACE = process.argv[2] || "2024_gbr";

type Row = {
    race_id: string; driver_id: string; quali_pos: number;
    avg_fp_longrun_delta: number; constructor_form: number; driver_form: number;
    circuit_effect: number; weather_risk: number;
};

const rows: Row[] = [
  { race_id: RACE, driver_id: "VER", quali_pos: 1, avg_fp_longrun_delta: -0.12, constructor_form: 18.5, driver_form: 22.0, circuit_effect: 1.2,  weather_risk: 0.1 },
  { race_id: RACE, driver_id: "NOR", quali_pos: 2, avg_fp_longrun_delta: -0.08, constructor_form: 17.2, driver_form: 15.8, circuit_effect: 0.7,  weather_risk: 0.1 },
  { race_id: RACE, driver_id: "HAM", quali_pos: 3, avg_fp_longrun_delta: -0.05, constructor_form: 13.4, driver_form: 12.1, circuit_effect: 0.9,  weather_risk: 0.1 },
];

async function main() {
    for (const r of rows) {
        await sql`
        insert into features_current(race_id, driver_id, quali_pos, avg_fp_longrun_delta, constructor_form, driver_form, circuit_effect, weather_risk)
        values (${r.race_id}, ${r.driver_id}, ${r.quali_pos}, ${r.avg_fp_longrun_delta}, ${r.constructor_form}, ${r.driver_form}, ${r.circuit_effect}, ${r.weather_risk})
        on conflict (race_id, driver_id) do update set
            quali_pos=excluded.quali_pos,
            avg_fp_longrun_delta=excluded.avg_fp_longrun_delta,
            constructor_form=excluded.constructor_form,
            driver_form=excluded.driver_form,
            circuit_effect=excluded.circuit_effect,
            weather_risk=excluded.weather_risk
        `;
    }
    console.log("Seeded features_current for race", RACE)
}
main();