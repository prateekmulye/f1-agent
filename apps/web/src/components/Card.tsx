import { clsx } from "clsx";
export function Card({ className, children }: {className?: string; children: React.ReactNode}) {
    return <div className={clsx("bg-zinc-900/70 border border-zinc-800 rounded-xl shadow-card", className)}>{children}</div>;
}
export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
    return (
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-100">{title}</h2>
            {action}
        </div>
    );
}
export function CardBody({ children, className }: { children: React.ReactNode; className?: string}) {
    return <div className={clsx("px-4 py-3 text-sm text-zinc-200", className)}>{children}</div>;
}