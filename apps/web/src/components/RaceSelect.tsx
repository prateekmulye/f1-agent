"use client";
import { useEffect, useState } from "react";
import { set } from "zod";

type Race = {
    id: string;
    name: string;
    season: number;
    round: number;
};

export default function RaceSelect({ value, onChange }:{ value:string; onChange:(v:string)=>void }) {
    const [races, setRaces] = useState<Race[]>([]);
    useEffect(() => {
        fetch("/api/races")
        .then(r => r.json())
        .then(setRaces);
    });
    return (
        <select
            className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-zinc-100"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {races.map((r) => (
                <option key={r.id} value={r.id}>
                    {r.name} (Season {r.season}, Round {r.round})
                </option>
            ))}
        </select>
    );
}