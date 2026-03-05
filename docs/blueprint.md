# **App Name**: iGen - Architectural AI Assistant

## Core Features:

- User Authentication & Role Logic: Secure login/signup with Email/Password, Google, and Phone. Implements specific hardcoded logic to distinguish 'Admin' and 'User' roles.
- iGen Cloud Credit Claim: Displays a native, glassmorphic modal upon successful login for users to claim $300 iGen Cloud Credits, followed by a success toast.
- Ecosystem Dashboard Grid: Presents a responsive 3x2 grid layout (1-column on mobile, 3-column on desktop) showcasing 6 architectural AI feature cards with titles, descriptions, and thumbnails.
- Feature Detail Workspace: Navigates to a dedicated workspace for each feature, featuring a '⚡ SPEED MODE' / '🛠️ PRO MODE' toggle and professional AI controls.
- White-labeled AI Engines Integration: Utilizes mocked API calls for white-labeled AI models (iGen Logic Engine for chat/logic, iGen Vision for image generation, iGen Motion for video generation) leveraging environment variables.
- Magic Voice Assistant (iGen Orb): A floating 'Glowing Orb' UI element with futuristic CSS animations (pulse, multi-color cyan/blue gradient shadows) in the bottom-right for voice-activated interaction using an AI tool.
- Internationalization Toggle: A simple UI switch allowing users to change the application language between default Vietnamese (VI) and English (EN).

## Style Guidelines:

- Primary color: A sophisticated, clear blue (#228EC3) to convey intelligence and professionalism, providing optimal contrast against the light background.
- Background color: The serene and airy light gray-blue of `bg-slate-50` (#F8FAFC) forming the foundational 'Light & Airy' theme.
- Accent color: The distinct vibrant cyan (#06B6D4), specifically reserved for 'iGen' branding text and key interactive highlights, as requested by the user for `text-cyan-500`.
- Body and headline font: 'Inter' (sans-serif) for its modern, clean, and highly readable qualities, fitting the 'Apple/Notion' style.
- Leverage Lucide React icons for all visual metaphors, ensuring consistency and a contemporary, vectorized look throughout the application.
- Employ glassmorphism for cards and panels, using a semi-transparent white background (`bg-white/70 backdrop-blur-md`) to create depth and an airy aesthetic.
- Implement subtle CSS animations (pulse, gradient shadows) for the 'Magic Voice Assistant' orb to suggest futurism and interactivity without being distracting.