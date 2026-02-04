import { useEffect, useRef } from 'react';

const Squiggle = ({ style = {}, animateType = 'wiggle', strokeColor = '#FF4C2B', strokeWidth = 3, width = 100, height = 50, viewBox = '0 0 200 100' }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (animateType === 'float' && svgRef.current) {
            svgRef.current.animate(
                [
                    { transform: 'translateY(0px)' },
                    { transform: 'translateY(-10px)' },
                    { transform: 'translateY(0px)' }
                ],
                {
                    duration: 3000,
                    iterations: Infinity,
                    easing: 'ease-in-out'
                }
            );
        }
    }, [animateType]);

    return (
        <svg
            ref={svgRef}
            style={style}
            width={width}
            height={height}
            viewBox={viewBox}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M 10 50 Q 30 30, 50 50 T 90 50 T 130 50 T 170 50 T 210 50"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Squiggle;
