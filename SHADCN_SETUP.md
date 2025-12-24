# shadcn/ui Setup Guide

shadcn/ui has been successfully configured in your project! 🎉

## What's Been Set Up

1. **Configuration File**: `components.json` - Contains all shadcn/ui settings
2. **CSS Variables**: Updated `app/globals.css` with shadcn color system
3. **Utility Functions**: `lib/utils.ts` with `cn()` function for class merging
4. **Example Components**: Added common components in `components/ui/`

## Installed Components

The following components are available in `components/ui/`:

- ✅ **Button** - Versatile button component with multiple variants
- ✅ **Card** - Container component with header, content, and footer
- ✅ **Input** - Styled input field
- ✅ **Label** - Form label component
- ✅ **Textarea** - Multi-line text input

## How to Add More Components

You can add more shadcn/ui components using the CLI:

```bash
npx shadcn@latest add [component-name]
```

### Popular Components to Add:

```bash
# Forms
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch

# Navigation
npx shadcn@latest add dropdown-menu
npx shadcn@latest add navigation-menu
npx shadcn@latest add tabs

# Feedback
npx shadcn@latest add alert
npx shadcn@latest add toast
npx shadcn@latest add dialog
npx shadcn@latest add sheet

# Data Display
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar

# Layout
npx shadcn@latest add separator
npx shadcn@latest add skeleton
```

## Usage Example

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example Form</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <Button>Submit</Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Button Variants

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

## Button Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
```

## Customization

All components use CSS variables defined in `app/globals.css`. You can customize colors by modifying the `:root` and `.dark` variables.

## Documentation

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Component Examples](https://ui.shadcn.com/docs/components)
- [Theming Guide](https://ui.shadcn.com/docs/theming)

