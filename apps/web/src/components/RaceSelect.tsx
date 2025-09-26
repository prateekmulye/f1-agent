/**
 * RaceSelect
 *
 * Dropdown bound to Python API for choosing the current race context.
 * Groups races by season for better UX.
 */
"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Race = {
    id: string;
    name: string;
    season: number;
    round: number;
    date: string;
    country: string;
};

type GroupedRaces = {
    [season: number]: Race[];
};

export default function RaceSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [races, setRaces] = useState<Race[]>([]);
    const [groupedRaces, setGroupedRaces] = useState<GroupedRaces>({});

    useEffect(() => {
        apiGet("races")
            .then((rows: Race[]) => {
                setRaces(rows);

                // Group races by season
                const grouped = rows.reduce((acc: GroupedRaces, race: Race) => {
                    if (!acc[race.season]) {
                        acc[race.season] = [];
                    }
                    acc[race.season].push(race);
                    return acc;
                }, {});

                // Sort races within each season by round
                Object.keys(grouped).forEach(season => {
                    grouped[parseInt(season)].sort((a, b) => a.round - b.round);
                });

                setGroupedRaces(grouped);
            })
            .catch(() => {
                setRaces([]);
                setGroupedRaces({});
            });
    }, []);

    // If current value isn't in the list, default to the first option (newest season, first round)
    useEffect(() => {
        if (races.length && !races.find(r => r.id === value)) {
            const sortedSeasons = Object.keys(groupedRaces)
                .map(s => parseInt(s))
                .sort((a, b) => b - a); // Newest season first

            if (sortedSeasons.length > 0) {
                const newestSeason = sortedSeasons[0];
                const firstRace = groupedRaces[newestSeason]?.[0];
                if (firstRace) {
                    onChange(firstRace.id);
                }
            }
        }
    }, [races, value, onChange, groupedRaces]);

    const sortedSeasons = Object.keys(groupedRaces)
        .map(s => parseInt(s))
        .sort((a, b) => b - a); // Newest season first

    return (
        <select
            className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 min-w-[320px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {sortedSeasons.map((season) => (
                <optgroup key={season} label={`🏁 ${season} Season (${groupedRaces[season].length} races)`}>
                    {groupedRaces[season].map((race) => (
                        <option key={race.id} value={race.id}>
                            Round {race.round}: {race.name} - {race.country}
                        </option>
                    ))}
                </optgroup>
            ))}
        </select>
    );
}