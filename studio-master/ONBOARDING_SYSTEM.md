# FiCX Onboarding System

## Overview

The FiCX onboarding system is designed to help first-time users understand and effectively use the platform. It consists of multiple components that work together to provide a comprehensive learning experience.

## Components

### 1. Enhanced Onboarding Page (`/onboarding`)

**File:** `src/app/onboarding/page.tsx`

A multi-step onboarding flow that collects:
- Company information (name, industry, size)
- User goals and objectives
- Team setup preferences
- Feature preferences

**Features:**
- Progress tracking with visual indicators
- Step-by-step navigation
- Data persistence in localStorage
- Automatic tutorial trigger

### 2. Tutorial Overlay System

**File:** `src/components/shared/tutorial-overlay.tsx`

An interactive guided tour that:
- Highlights key UI elements
- Provides contextual explanations
- Adapts content based on user preferences
- Tracks completion status

**Features:**
- Dynamic positioning around UI elements
- Highlight overlays for focus
- Skip and navigation controls
- Action buttons for direct navigation

### 3. Welcome Banner

**File:** `src/components/shared/welcome-banner.tsx`

A personalized welcome message that:
- Displays company-specific greeting
- Shows quick action cards based on preferences
- Provides easy access to tutorial
- Can be dismissed by users

### 4. Contextual Tooltips

**File:** `src/components/shared/contextual-tooltip.tsx`

Smart tooltips that:
- Show only for new users
- Disappear after being viewed
- Provide helpful hints for UI elements
- Track user interaction

### 5. Tutorial Hook

**File:** `src/hooks/use-tutorial.ts`

Manages tutorial state and provides:
- Tutorial visibility control
- Onboarding data management
- Completion tracking
- Reset functionality

### 6. Help & Support Page

**File:** `src/app/help/page.tsx`

A comprehensive help center with:
- Searchable help articles
- Categorized content
- Difficulty levels
- Quick action links

### 7. Onboarding Progress Tracker

**File:** `src/components/shared/onboarding-progress.tsx`

Tracks user progress through:
- Visual progress indicators
- Step-by-step completion
- Next action suggestions
- Completion celebrations

## User Flow

### First-Time User Experience

1. **Registration/Login** → User creates account or logs in
2. **Onboarding Check** → System checks if user has completed onboarding
3. **Onboarding Flow** → If not completed, redirects to `/onboarding`
4. **Multi-Step Setup** → User completes 4-step onboarding process
5. **Dashboard Redirect** → User is redirected to dashboard with `?tutorial=true`
6. **Welcome Banner** → Personalized welcome message appears
7. **Tutorial Overlay** → Interactive tour starts automatically
8. **Contextual Hints** → Tooltips appear on key UI elements
9. **Progress Tracking** → Onboarding progress is tracked and displayed

### Returning User Experience

1. **Login** → User logs in
2. **Onboarding Check** → System checks completion status
3. **Dashboard** → Direct access to dashboard
4. **Optional Tutorial** → Tutorial can be restarted from help page
5. **Contextual Help** → Help page available for reference

## Data Storage

### localStorage Keys

- `ficx_onboarding_data`: Stores user onboarding preferences and completion status
- `ficx_tutorial_completed`: Tracks tutorial completion
- `ficx_seen_tooltips`: Tracks which tooltips have been viewed

### Data Structure

```typescript
// Onboarding Data
{
  companyName: string;
  industry: string;
  companySize: string;
  goals: string[];
  teamSize: string;
  features: string[];
  completedAt: string;
  showTutorial: boolean;
}

// Tutorial Data
{
  completed: boolean;
  completedAt: string;
  stepsCompleted: number;
}
```

## Customization

### Adding New Onboarding Steps

1. Update the `onboardingSteps` array in `onboarding/page.tsx`
2. Add corresponding form fields and validation
3. Update the `renderStepContent` function
4. Add step to progress tracking

### Adding New Tutorial Steps

1. Update the `getTutorialSteps` function in `tutorial-overlay.tsx`
2. Add target selectors for UI elements
3. Write descriptive content
4. Add action buttons if needed

### Adding New Tooltips

1. Add content to `TOOLTIP_CONTENT` object
2. Wrap UI elements with `ContextualTooltip` component
3. Provide unique `elementId`
4. Set appropriate `showForNewUsers` flag

## Best Practices

### Content Guidelines

- Keep explanations concise and actionable
- Use clear, non-technical language
- Provide specific examples when possible
- Include visual cues and icons

### UX Guidelines

- Allow users to skip or dismiss elements
- Provide clear progress indicators
- Use consistent visual design
- Ensure accessibility compliance

### Technical Guidelines

- Use TypeScript for type safety
- Implement proper error handling
- Follow React best practices
- Maintain component reusability

## Testing

### Manual Testing Checklist

- [ ] Complete onboarding flow as new user
- [ ] Verify tutorial overlay appears correctly
- [ ] Test tooltip functionality
- [ ] Check progress tracking accuracy
- [ ] Verify data persistence
- [ ] Test tutorial reset functionality
- [ ] Validate help page navigation

### Automated Testing

Consider adding tests for:
- Onboarding form validation
- Tutorial step navigation
- Data persistence
- Component rendering
- User interaction flows

## Troubleshooting

### Common Issues

1. **Tutorial not appearing**: Check localStorage for completion status
2. **Tooltips not showing**: Verify user is new and hasn't seen them
3. **Progress not updating**: Check data structure and localStorage
4. **Navigation issues**: Verify route configurations

### Debug Commands

```javascript
// Check onboarding data
console.log(JSON.parse(localStorage.getItem('ficx_onboarding_data')));

// Check tutorial status
console.log(JSON.parse(localStorage.getItem('ficx_tutorial_completed')));

// Reset tutorial
localStorage.removeItem('ficx_tutorial_completed');
localStorage.removeItem('ficx_seen_tooltips');
```

## Future Enhancements

### Planned Features

- Video tutorials integration
- Interactive walkthroughs
- A/B testing for onboarding flows
- Personalized content based on usage
- Advanced analytics and insights
- Multi-language support

### Potential Improvements

- Gamification elements
- Achievement badges
- Social proof integration
- Advanced customization options
- Integration with external help systems

## Support

For questions or issues with the onboarding system:

1. Check the help page at `/help`
2. Review this documentation
3. Contact the development team
4. Submit feature requests through the help page 