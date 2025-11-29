# 🎨 UI/UX Features Guide

## Overview

Discovery Atlas now includes comprehensive UI/UX improvements including onboarding tutorials, custom themes, accessibility features, and advanced user preferences.

---

## ✨ Features Implemented

### 1. 🚀 Onboarding Tutorial

**Location**: Automatically appears for first-time users on the landing page

**Features**:
- 5-step interactive tutorial
- Highlights key features with visual overlays
- Progress tracking
- Skip option available
- Keyboard accessible

**How it works**:
- Automatically triggers for new users after 1 second
- Can be manually reset via `useOnboarding` hook
- Stored in localStorage as `onboarding_completed`

**Components**:
- `src/components/onboarding/OnboardingTutorial.tsx`
- `src/hooks/useOnboarding.tsx`

**To trigger manually**:
```typescript
const { startOnboarding } = useOnboarding();
startOnboarding();
```

---

### 2. 📸 Interactive Quest Walkthrough

**Location**: Can be triggered before quest submission

**Features**:
- 4-step walkthrough of quest submission process
- Beautiful animated transitions
- Visual icons for each step
- Progress dots

**Steps covered**:
1. Take a Photo
2. Add Location
3. Write Description
4. AI Verification

**Component**: `src/components/quest/QuestWalkthrough.tsx`

**Usage**:
```typescript
import { QuestWalkthrough } from '@/components/quest/QuestWalkthrough';

<QuestWalkthrough open={showWalkthrough} onOpenChange={setShowWalkthrough} />
```

---

### 3. 🎨 Custom Themes & Skins

**Location**: User Preferences Modal or Account Settings

**Available Themes**:
1. **Discovery** (Default) - Purple & teal
2. **Ocean** - Blues and ocean vibes
3. **Forest** - Natural greens and earth tones
4. **Sunset** - Warm oranges and golden hues
5. **Purple** - Rich purples and magentas
6. **Rose** - Elegant pinks and roses
7. **Cosmic** - Deep space purples and blues

**Features**:
- Live theme preview
- Dark/Light mode support for all themes
- Persisted in localStorage
- Smooth transitions between themes

**Theme Variables**:
- All colors use HSL format
- Defined in `src/index.css`
- Applied via CSS classes (e.g., `theme-ocean`)

**Hook**: `src/hooks/useThemes.tsx`

**Usage**:
```typescript
const { currentTheme, setTheme, themeOptions, toggleMode } = useThemes();

// Change theme
setTheme('ocean');

// Toggle dark/light mode
toggleMode();
```

---

### 4. ⚙️ Advanced User Preferences

**Location**: User Preferences Modal

**Component**: `src/components/settings/UserPreferencesModal.tsx`

**Preference Categories**:

#### 🎨 Theme & Appearance
- Dark/Light mode toggle
- 7 color theme options
- Visual theme preview

#### ♿ Accessibility
- **Reduced Motion**: Minimizes animations
- **High Contrast**: Increases visibility
- **Font Size**: 75% - 150% adjustable
- Keyboard navigation support
- Focus indicators

#### 🔊 Sound & Effects
- Animation toggle
- Sound effects toggle
- Volume control (0-100%)

#### ⚡ Behavior
- Auto-play media
- Browser notifications

**Storage**: All preferences saved in localStorage as `user_preferences`

---

### 5. ♿ Accessibility Improvements

**Features Implemented**:

#### Keyboard Navigation
- All interactive elements keyboard accessible
- Visual focus indicators
- Tab order optimized
- Skip-to-main-content link

#### ARIA Labels
- Proper role attributes
- aria-label on all buttons
- aria-busy for loading states
- aria-pressed for toggles
- Semantic HTML structure

#### Responsive Design
- Mobile-first approach
- Touch-friendly targets (44px minimum)
- No tap highlight on mobile
- Smooth touch scrolling

#### Reduced Motion Support
- Respects `prefers-reduced-motion`
- Manual toggle in preferences
- Disables animations when enabled

#### High Contrast Mode
- Manual toggle available
- Increases border contrast
- Adjusts focus ring colors

**CSS Classes Added**:
```css
.reduce-motion /* Disable animations */
.high-contrast /* Increase contrast */
.skip-to-main /* Skip navigation link */
```

---

### 6. 🎬 Enhanced Animations

**New Animation Features**:

- Smooth page transitions with framer-motion
- Scale animations on interactive elements
- Fade-in effects for modals
- Progress bar animations
- Theme transition effects
- Micro-interactions on buttons

**Performance**:
- Hardware-accelerated transforms
- Optimized for 60fps
- Can be disabled via preferences

---

## 🎯 Usage Examples

### Opening User Preferences

```typescript
import { UserPreferencesModal } from '@/components/settings/UserPreferencesModal';

const [showPreferences, setShowPreferences] = useState(false);

<UserPreferencesModal 
  open={showPreferences} 
  onOpenChange={setShowPreferences} 
/>
```

### Triggering Onboarding

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';

const { startOnboarding, resetOnboarding, hasCompletedOnboarding } = useOnboarding();

// Start onboarding
startOnboarding();

// Reset for testing
resetOnboarding();

// Check if completed
if (!hasCompletedOnboarding) {
  startOnboarding();
}
```

### Applying Custom Theme

```typescript
import { useThemes } from '@/hooks/useThemes';

const { setTheme, currentTheme, themeOptions } = useThemes();

// Change theme
setTheme('sunset');

// List available themes
themeOptions.forEach(theme => {
  console.log(theme.name, theme.colors);
});
```

---

## 🔧 Technical Details

### localStorage Keys

- `onboarding_completed`: Boolean for onboarding status
- `selected-theme`: Current theme ID
- `user_preferences`: JSON object with all preferences
- `notification_sound_enabled`: Sound preference

### CSS Variables

All theme colors use CSS variables:
```css
--primary: 261 86% 55%;
--secondary: 0 100% 85%;
--accent: 201 59% 60%;
--quest-primary: 261 86% 55%;
--quest-secondary: 156 100% 48%;
--quest-accent: 39 100% 50%;
```

### Accessibility Standards

- WCAG 2.1 Level AA compliance
- Minimum 44x44px touch targets
- 4.5:1 contrast ratio for text
- Keyboard navigation for all interactive elements
- Screen reader compatible

---

## 🎨 Design System

### Color Tokens

All colors MUST use HSL format via CSS variables:
```tsx
// ❌ Wrong
<div className="bg-purple-500">

// ✅ Correct
<div className="bg-primary">
```

### Animation Guidelines

- Default duration: 0.3s
- Easing: ease-out for enters, ease-in for exits
- Use framer-motion for complex animations
- Respect reduced motion preferences

---

## 📱 Mobile Considerations

- Touch targets: Minimum 44x44px
- Viewport meta tag configured
- No tap highlight color
- Smooth touch scrolling
- Responsive font sizes
- Mobile-optimized layouts

---

## 🚀 Future Enhancements

Potential additions:
- More theme options
- Custom theme creator
- Voice navigation
- Gesture controls
- Advanced animation presets
- User-created color schemes

---

## 📝 Notes

1. **Theme Persistence**: Themes are saved per-user in localStorage
2. **Performance**: All animations are GPU-accelerated
3. **Accessibility**: All features are keyboard and screen-reader accessible
4. **Mobile**: Fully responsive and touch-optimized
5. **Dark Mode**: All themes support both light and dark modes

---

## 🐛 Troubleshooting

**Onboarding not showing?**
- Check localStorage for `onboarding_completed`
- Call `resetOnboarding()` to reset

**Theme not applying?**
- Check browser console for errors
- Verify localStorage has `selected-theme`
- Ensure CSS is loaded

**Animations not working?**
- Check `user_preferences` in localStorage
- Verify `reducedMotion` is false
- Check browser animation settings

---

## 📚 Related Files

- `src/index.css` - Theme definitions and accessibility styles
- `src/hooks/useThemes.tsx` - Theme management hook
- `src/hooks/useOnboarding.tsx` - Onboarding state management
- `src/components/onboarding/OnboardingTutorial.tsx` - Onboarding UI
- `src/components/quest/QuestWalkthrough.tsx` - Quest walkthrough UI
- `src/components/settings/UserPreferencesModal.tsx` - Preferences UI
- `tailwind.config.ts` - Tailwind theme configuration

---

**Last Updated**: 2025-11-29
