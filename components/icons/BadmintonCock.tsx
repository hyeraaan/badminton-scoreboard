import React from "react";

export const BadmintonCock = ({ size = 24, color = "currentColor", ...props }: React.SVGProps<SVGSVGElement> & { size?: number, color?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {/* Cork (Head) */}
            <path d="M10 20a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />

            {/* Feathers (Skirt) */}
            <path d="M12 20v-5" />
            <path d="M6 5c1 3 4 10 4 10" />
            <path d="M18 5c-1 3 -4 10 -4 10" />
            <path d="M12 15l-3 -8" />
            <path d="M12 15l3 -8" />

            {/* Top ring of feathers */}
            <path d="M6 5h12" />
        </svg>
    );
};
