/**
 * Decorative scene behind the dashboard title: a car pulls into the lot once
 * when the page opens, then everything stands still. It is an original,
 * generic drawing (no real model) and is hidden from screen readers.
 * The motion lives in index.css (.car-drive, .road-slide, .wheel-spin) and
 * is switched off for people who prefer reduced motion.
 */
export function ShowroomBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Road: a dark strip with dashed centre line that slides while the car arrives. */}
      <div data-part="road" className="absolute inset-x-0 bottom-0 h-10 bg-asphalt">
        <div className="road-slide absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" />
      </div>

      <svg
        data-part="car"
        viewBox="0 0 400 120"
        className="car-drive absolute bottom-5 right-4 w-48 text-plate sm:right-[24%] sm:w-80"
      >
        {/* body */}
        <path
          fill="currentColor"
          d="M14 92 L14 74 Q16 66 38 64 L92 58 Q112 34 152 30 L232 30 Q266 32 290 56 L352 64 Q384 68 386 82 L386 92 Z"
        />
        {/* windows */}
        <path fill="#08402f" d="M108 58 Q122 40 152 38 L186 38 L186 58 Z M196 38 L230 38 Q252 40 270 58 L196 58 Z" />
        {/* wheels: a tyre, then a hub that spins */}
        {[96, 312].map((x) => (
          <g key={x}>
            <circle cx={x} cy={94} r={22} fill="#1c2127" />
            <g className="wheel-spin" style={{ transformOrigin: `${x}px 94px` }}>
              <circle cx={x} cy={94} r={11} fill="#e4e7ea" />
              <path d={`M${x} 84 V104 M${x - 10} 94 H${x + 10}`} stroke="#1c2127" strokeWidth={3} />
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}
