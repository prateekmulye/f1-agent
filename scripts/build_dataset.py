#!/usr/bin/env python3
import requests, csv, time
from collections import defaultdict

BASE = "https://api.jolpi.ca/ergast/f1"

def jget(path):
    url = f"{BASE}/{path}.json"
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    return r.json()["MRData"]

def seasons():
    return ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010"]

def results_for_season(season):
    d = jget(f"{season}/results")
    races = d["RaceTable"]["Races"]
    out = []
    for r in races:
        race_id = f"{season}_{r['round']}_{r['Circuit']['circuitId']}"
        for res in r["Results"]:
            driver = res["Driver"]["driverId"]
            constructor = res["Constructor"]["constructorId"]
            grid = int(res.get("grid", 0) or 0)
            finish = int(res.get("position", 20) or 20)
            points = float(res.get("points", 0) or 0)
            out.append((race_id, r["raceName"], r["Circuit"]["circuitId"], season, int(r["round"]), driver, constructor, grid, finish, points))
    return out

def quali_for_season(season):
    d = jget(f"{season}/qualifying")
    races = d["RaceTable"]["Races"]
    qpos = {}
    for r in races:
        race_id = f"{season}_{r['round']}_{r['Circuit']['circuitId']}"
        for q in r.get("QualifyingResults", []):
            driver = q["Driver"]["driverId"]
            qpos[(race_id, driver)] = int(q.get("position", 20) or 20)
    return qpos

def main():
    rows = []
    points_hist = defaultdict(list)
    constructor_points_hist = defaultdict(list)
    circuit_points_hist = defaultdict(list)

    for sz in seasons():
        res = results_for_season(sz)
        qpos = quali_for_season(sz)

        res.sort(key=lambda x: (x[3], x[4]))
        for race_id, race_name, circuit_id, season, rnd, driver, constructor, grid, finish, points in res:
            d_form = sum(points_hist[driver][-3:]) / max(1, len(points_hist[driver][-3:]))
            c_form = sum(constructor_points_hist[constructor][-3:]) / max(1, len(constructor_points_hist[constructor][-3:]))
            drv_circ = f"{driver}:{circuit_id}"
            circ_hist = circuit_points_hist[drv_circ]
            circuit_effect = (sum(circ_hist) / len(circ_hist)) if circ_hist else 0.0

            quali_pos = qpos.get((race_id, driver), grid if grid>0 else 20)
            weather_risk = 0.0

            rows.append({
                "race_id": race_id,
                "driver_id": driver,
                "quali_pos": quali_pos,
                "avg_fp_longrun_delta": 0.0,
                "constructor_form": round(c_form, 3),
                "corcuit_effect": round(circuit_effect, 3),
                "weather_risk": weather_risk,
                "points": points,
            })

            points_hist[driver].append(points)
            constructor_points_hist[constructor].append(points)
            circuit_points_hist[drv_circ].append(points)

            time.sleep(0.002)

    import os, pathlib
    pathlib.Path("data").mkdir(parents=True, exist_ok=True)
    with open("data/historical_features.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    
    print("Wrote data/historical_features.csv with", len(rows), "rows")

if __name__ == "__main__":
    main()