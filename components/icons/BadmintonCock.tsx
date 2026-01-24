import React from "react";

export const BadmintonCock = ({ size = 24, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {/* Cork (Head) - Simplified for Shadcn/Icon feel */}
            <path d="M10 20a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />

            {/* Feathers - Clean lines */}
            <path d="M12 20v-4" />
            <path d="M6 6c1 3 4 10 4 10" />
            <path d="M18 6c-1 3 -4 10 -4 10" />

            {/* Cross structures */}
            <path d="M12 16l-3 -7" />
            <path d="M12 16l3 -7" />
            <path d="M6 6h12" />
        </svg>
    );
};
