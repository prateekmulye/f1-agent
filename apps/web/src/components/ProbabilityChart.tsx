"use client";
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Row = {
    driver_id: string;
    prob_points: number
};

export default function ProbabilityChart({ raceId }: { raceId: string }) {
    const [rows, setRows] = useState<Row[]>([]);
    useEffect(() => { 
        fetch(`/api/predict?race_id=${raceId}`)
        .then(r=>r.json())
        .then(setRows); }, [raceId]);

    const data = rows.slice(0,10).map((r)=>({
        name: r.driver_id,
        p: Math.round(r.prob_points*1000)/10,
        lo: Math.max(0, Math.round((r.prob_points-0.08)*1000)/10),
        hi: Math.min(100, Math.round((r.prob_points+0.08)*1000)/10),
    }));

    return (
        <div className="w-full h-56">
            <ResponsiveContainer>
                <AreaChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
                    <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <YAxis domain={[0,100]} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <Tooltip formatter={(v:any)=>`${v}%`} />
                    <Area type="monotone" dataKey="hi" stroke="#52525b" fillOpacity={0.1} fill="#52525b" />
                    <Area type="monotone" dataKey="p"  stroke="#E10600" fillOpacity={0.2} fill="#E10600" />
                    <Area type="monotone" dataKey="lo" stroke="#52525b" fillOpacity={0.1} fill="#52525b" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}