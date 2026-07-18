# Mobius 3D Intake

A mobile-first, 3D-styled web intake form that replaces a 12-page PDF. Built with React + Vite + Three.js + Tailwind CSS.

## Features

- **3D Aesthetic**: Floating cards, depth layers, subtle parallax, glassmorphism
- **Mobile-First**: Touch-optimized, no hover dependencies, large tap targets
- **Multi-Step Form**: 4-step wizard with validation
- **Gatechecker Schema**: Exact field names (teacher_name, subject_code, etc.)
- **JSON Output**: Generates canonical JSON payload matching the Gatechecker schema
- **Vercel-Ready**: Static build for easy deployment

## Tech Stack

- **Frontend**: React 18 + Vite
- **3D Graphics**: Three.js + @react-three/fiber + @react-three/drei
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Deploy!

## Form Structure

The form is divided into 4 steps:

### Step 1: Personal Information
- `teacher_name` (required)
- `email` (required)
- `phone` (required)

### Step 2: School Information
- `school_name` (required)
- `school_address` (required)
- `school_city` (required)
- `school_state` (required)
- `school_zip` (required)
- `school_country`

### Step 3: Subject Information
- `subject_code` (required)
- `subject_name` (required)
- `grade_level` (required)

### Step 4: Class Information
- `class_period` (required)
- `class_size` (required)
- `class_duration`
- `preferred_contact_method`
- `special_requirements`
- `notes`

## JSON Output

The form generates a JSON payload with the following structure:

```json
{
  "teacher_name": "string",
  "email": "string",
  "phone": "string",
  "school_name": "string",
  "school_address": "string",
  "school_city": "string",
  "school_state": "string",
  "school_zip": "string",
  "school_country": "string",
  "subject_code": "string",
  "subject_name": "string",
  "grade_level": "string",
  "class_period": "string",
  "class_size": "string",
  "class_duration": "string",
  "special_requirements": "string",
  "preferred_contact_method": "string",
  "notes": "string",
  "submission_date": "ISO 8601 string",
  "form_version": "1.0.0"
}
```

## Mobile Optimization

- Large touch targets (minimum 48x48px)
- No hover-dependent interactions
- Responsive design with mobile-first approach
- Optimized for touch input

## 3D Features

- Floating 3D background with geometric shapes
- Glassmorphism cards with depth
- Subtle parallax effects
- Smooth animations and transitions

## License

MIT
