# Möbius Muse Blueprint — Data Intake

A mobile-first web form that replaces a 12-page fillable PDF used to collect Kenyan private school data (CBC curriculum). This is the first stage of the pipeline:

**Web Intake Form → Blueprint Gatechecker → Workload Balancer**

## Features

- **3-step data entry flow**: School & Policy → Subjects → Teachers
- **Mobile-first design**: Optimized for phone browsers with tap targets ≥44px
- **Accessible**: Respects `prefers-reduced-motion`, keyboard navigation, visible focus states
- **No build step**: Plain HTML + CSS + vanilla JS (ES modules)
- **Static site**: Deployable to Vercel or any static hosting

## Quick Start

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Sami-rixx/mobius-3d-intake.git
   cd mobius-3d-intake
   ```

2. Open `index.html` in your browser:
   ```bash
   # Option 1: Direct file open
   open index.html
   
   # Option 2: Simple Python server
   python3 -m http.server 8000
   # Then open http://localhost:8000
   
   # Option 3: Node.js http-server
   npx http-server
   # Then open http://localhost:8080
   ```

### Deployment to Vercel

1. Import the repository into Vercel
2. Select framework preset: **Other**
3. No build command needed
4. Output directory: (leave blank, files are at repo root)
5. Deploy!

## Project Structure

```
mobius-3d-intake/
  index.html              # Main HTML shell
  /css
    tokens.css           # Brand variables
    layout.css           # Layout styles
    components.css       # Component styles (chips, cards, buttons)
  /js
    main.js              # Boot + step router
    state.js             # In-memory form state
    schema.js            # Payload builder + validator
    step1-school-policy.js
    step2-subjects.js
    step3-teachers.js
    output.js            # Download/copy/submit actions
  /assets
    mobius-mark.svg      # Animated brand mark
  PROGRESS.md
  README.md
```

## Data Contract

The form outputs a JSON payload matching the exact schema validated by Gatechecker:

```json
{
  "schema_version": "1.0.0",
  "school": { "name": "...", "filled_by": "...", "filled_at": "..." },
  "policy": {
    "generalists_grade_scope": "explicit_only",
    "overload_policy": "block",
    "ambiguous_data_policy": "use_default_and_warn",
    "specialist_scope_lock": true
  },
  "subjects": [
    {
      "subject_code": "...",
      "subject_name": "...",
      "grade_levels": [...],
      "periods_per_week": [...],
      "double_lessons_allowed": true
    }
  ],
  "teachers": [
    {
      "teacher_id": "...",
      "teacher_name": "...",
      "max_periods_week": 0,
      "specialist": false,
      "confidence": 1.0,
      "flag_note": null
    }
  ],
  "capabilities": [
    { "teacher_id": "...", "subject_code": "...", "grades_can_teach": [...] }
  ],
  "preferences": [
    {
      "teacher_id": "...",
      "subject_code": "...",
      "grades": [...],
      "priority": 2,
      "granularity": "subject_level"
    }
  ]
}
```

## Known Bug Traps (Validated)

1. **N/A grade-band exclusion**: When a grade band doesn't apply to a subject (e.g., Science & Technology is N/A for Jr. School), that band is **completely absent** from `grade_levels`/`periods_per_week` — never included with `0` periods.

2. **Field naming**: Uses `teacher_name`, never `name` for teacher objects.

## Brand System

- **Möbius Blue**: `#1B3A5C` (headers, nav, trust elements)
- **Accent Teal**: `#2FA6A0` (primary actions, success)
- **Accent Gold**: `#C9A96E` (warnings, last resort)
- **Night Background**: `#0E1B2E` (app shell)
- **Text Body**: `#D7DEE7` (high-contrast grey)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## Contributing

1. Read `PROGRESS.md` for current build status
2. Follow the existing folder structure and naming conventions
3. Keep modules small and single-purpose
4. Test on real mobile devices, not just emulators
5. Commit after every meaningfully complete unit of work

## License

MIT
