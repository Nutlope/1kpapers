export function GreekCyberArt({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      className={compact ? "greek-art compact" : "greek-art"}
      viewBox="0 0 720 275"
      role="img"
      aria-label="A technical engraving of Daedalus's labyrinth, a mechanical owl, and a fragmented cyber-oracle"
    >
      <g className="constellation" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M14 211 62 176l33 13 42-51 32 19 28-47" />
        <path d="M490 49h35l17 25 40-7 25 31 51-8 37 34" strokeDasharray="3 5" />
        <path d="M133 26v37M116 44h34M632 183l24 17 40-13" strokeDasharray="2 4" />
        {["14,211", "62,176", "95,189", "137,138", "169,157", "197,110", "490,49", "525,49", "542,74", "582,67", "607,98", "658,90", "695,124"].map((point) => {
          const [cx, cy] = point.split(",");
          return <circle key={point} cx={cx} cy={cy} r="3" fill="var(--paper)" />;
        })}
      </g>

      <g className="labyrinth" fill="none" stroke="currentColor">
        <path d="m128 98 124-70 124 70-124 71-124-71Z" strokeWidth="1.4" />
        <path d="m128 98v90l124 70 124-70V98" strokeWidth="1.4" />
        <path d="m252 169v89M376 98l-124 71-124-71" strokeWidth="1" />
        <path d="m155 98 97-55 97 55-97 56-97-56Zm29 0 68-39 68 39-68 40-68-40Zm29 0 39-23 39 23-39 23-39-23Z" strokeWidth="5" />
        <path d="M184 98h34v-16h33v32h33V82h36M155 98v70l97 55 97-55V98M184 115v51l68 39 68-39v-51M213 132v32l39 23 39-23v-32" strokeWidth="2.2" />
        <path d="m128 113 124 72 124-72M128 132l124 71 124-71M128 151l124 71 124-71" strokeWidth="0.6" strokeDasharray="3 3" />
        <path d="M143 90V67h28V44M361 89V65h-24V38M252 29V10" strokeWidth="1" />
        <circle cx="252" cy="10" r="4" fill="var(--paper)" strokeWidth="1.2" />
      </g>

      <g className="owl" transform="translate(408 126)" fill="none" stroke="currentColor">
        <path d="m8 42 17-29 21 9 19-9 17 29-9 48-28 20L17 90 8 42Z" strokeWidth="1.8" />
        <path d="m25 13-13-9 5 27M65 13l13-9-5 27" strokeWidth="1.5" />
        <circle cx="30" cy="42" r="13" strokeWidth="1.5" />
        <circle cx="60" cy="42" r="13" strokeWidth="1.5" />
        <circle cx="30" cy="42" r="5" fill="currentColor" />
        <circle cx="60" cy="42" r="5" fill="currentColor" />
        <path d="m39 56 6 8 6-8M20 69l25 25 25-25M24 78h42M28 88h34M45 64v30M45 110v16M31 126h28" strokeWidth="1.2" />
        <path d="M17 52 1 67l18 3M73 52l16 15-18 3" strokeWidth="1" />
        <path d="M6 69H-8v13h-14M83 69h14v13h14" strokeDasharray="3 3" />
      </g>

      <g className="oracle" transform="translate(543 75)" fill="none" stroke="currentColor">
        <path d="M42 10 18 26 7 68l9 60 31 39 31-39 9-60-12-42L51 10Z" strokeWidth="1.4" />
        <path d="M47 11v156M18 26l29 21 28-21M7 68l40 15 40-15M16 128l31-16 31 16" strokeWidth="0.8" />
        <path d="m20 62 14-8 10 10-15 9-9-11Zm54 0-14-8-10 10 15 9 9-11Z" strokeWidth="1.3" />
        <path d="m42 88-7 20 12 5 13-5-8-20M35 132l12 6 13-6" strokeWidth="1.2" />
        <path d="M3 49h16M74 42h22M8 94h12M76 104h18M20 146H2M72 145h17" strokeDasharray="2 4" />
        <path d="M47 47 61 7M47 83 16 1M47 112l43 11M47 138 31 39" strokeWidth="0.6" strokeDasharray="4 3" />
      </g>

      <g className="circuit" fill="none" stroke="currentColor" strokeWidth="0.9">
        <path d="M392 24h39v19h31M392 44h18v37h38M392 64h8v47h19" />
        <path d="M91 231H54v-18H25M108 246H72v18H38" />
        <path d="M666 227h27v-31h19M650 245h43v14h19" />
        <circle cx="462" cy="43" r="3" fill="var(--paper)" />
        <circle cx="448" cy="81" r="3" fill="var(--paper)" />
        <circle cx="419" cy="111" r="3" fill="var(--paper)" />
      </g>
    </svg>
  );
}
