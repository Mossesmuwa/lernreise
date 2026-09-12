import { motion, useReducedMotion } from 'motion/react';

const NODE_STYLE = {
  completed: { fill: '#0F6E56', stroke: 'none', r: 7 },
  current: { fill: '#0F6E56', stroke: 'none', r: 9 },
  not_started: { fill: 'none', stroke: '#D8DDD6', r: 7 },
};

export default function JourneyPath({ levels }) {
  const reduceMotion = useReducedMotion();
  const width = 320;
  const padding = 24;
  const y = 26;
  const step = levels.length > 1 ? (width - padding * 2) / (levels.length - 1) : 0;

  return (
    <svg viewBox={`0 0 ${width} 64`} className="w-full" role="img" aria-label="Your level progress">
      <motion.line
        x1={padding}
        y1={y}
        x2={width - padding}
        y2={y}
        stroke="#D8DDD6"
        strokeWidth="2"
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {levels.map((lvl, i) => {
        const cx = padding + i * step;
        const style = NODE_STYLE[lvl.status] ?? NODE_STYLE.not_started;
        return (
          <g key={lvl.id}>
            {lvl.status === 'current' && !reduceMotion && (
              <motion.circle
                cx={cx}
                cy={y}
                r={style.r}
                fill="none"
                stroke="#0F6E56"
                strokeWidth="2"
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 1.9 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <motion.circle
              cx={cx}
              cy={y}
              r={style.r}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth="2"
              initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.12 * i, type: 'spring', stiffness: 320, damping: 22 }}
            />
            <text
              x={cx}
              y={y + 24}
              textAnchor="middle"
              fontSize="11"
              fill={lvl.status === 'current' ? '#0F6E56' : '#8a9089'}
            >
              {lvl.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}