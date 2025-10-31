# Loading Animations Implementation Guide

## Overview

Beautiful loading animations and skeleton loaders have been added throughout the PlaceMate application to enhance user experience during async operations.

## Components Created

### 1. **Spinner** (`src/components/ui/Spinner.jsx`)

Simple animated spinner for inline loading states.

**Sizes available:**

- `sm` - Small (16px)
- `md` - Medium (32px)
- `lg` - Large (48px)
- `xl` - Extra Large (64px)

**Usage:**

```jsx
import { Spinner } from "../../components/ui";

<Spinner size="md" />;
```

---

### 2. **PulsingDots**

Pulsing dots animation for subtle loading states.

**Usage:**

```jsx
import { PulsingDots } from "../../components/ui";

<PulsingDots />;
```

---

### 3. **LoadingOverlay**

Full-screen loading overlay with backdrop blur.

**Usage:**

```jsx
import { LoadingOverlay } from "../../components/ui";

{
  loading && <LoadingOverlay message="Loading data..." />;
}
```

---

### 4. **TableRowSkeleton**

Skeleton loader for table rows.

**Props:**

- `columns` - Number of columns (default: 6)

**Usage:**

```jsx
import { TableRowSkeleton } from "../../components/ui";

<tbody>
  {loading ? (
    [...Array(5)].map((_, i) => <TableRowSkeleton key={i} columns={6} />)
  ) : (
    // Actual data rows
  )}
</tbody>
```

---

### 5. **CardSkeleton**

Skeleton loader for card components.

**Usage:**

```jsx
import { CardSkeleton } from "../../components/ui";

{
  loading ? <CardSkeleton /> : <ActualCard />;
}
```

---

### 6. **LoadingButton**

Button with integrated loading spinner.

**Props:**

- `loading` - Boolean to show/hide spinner
- `disabled` - Disable button (auto-disabled when loading)
- All standard button props

**Usage:**

```jsx
import { LoadingButton } from "../../components/ui";

<LoadingButton
  loading={isSubmitting}
  onClick={handleSubmit}
  className="px-6 py-2 bg-blue-600 text-white rounded-lg"
>
  Submit Form
</LoadingButton>;
```

---

### 7. **ShimmerPlaceholder**

Content placeholder with shimmer animation effect.

**Props:**

- `lines` - Number of placeholder lines (default: 3)

**Usage:**

```jsx
import { ShimmerPlaceholder } from "../../components/ui";

{
  loading ? <ShimmerPlaceholder lines={4} /> : <Content />;
}
```

---

## Pages Updated

### 1. **CompaniesList** (`pages/admin/company/CompaniesList.jsx`)

- ✅ Table skeleton during data fetch
- ✅ Smooth fade-in after load
- ✅ Search result loading states

### 2. **CompanyDetails** (`pages/admin/company/CompanyDetails.jsx`)

- ✅ Card skeletons for header and sections
- ✅ Shimmer placeholders for text content

### 3. **CompanyRegistration** (`pages/admin/CompanyRegistration.jsx`)

- ✅ Form skeleton during edit mode data fetch
- ✅ LoadingButton for submit with spinner
- ✅ Disabled state during submission

### 4. **RegisteredStudents** (`pages/admin/RegisteredStudents.jsx`)

- ✅ Table skeleton for student list
- ✅ Ready for real API integration

### 5. **AdminDashboard** (`pages/admin/AdminDashboard.jsx`)

- ✅ Card skeletons for statistics
- ✅ Ready for async stat fetching

---

## Tailwind Configuration

Added custom animations in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    animation: {
      shimmer: "shimmer 2s infinite",
      "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    },
    keyframes: {
      shimmer: {
        "0%": { transform: "translateX(-100%)" },
        "100%": { transform: "translateX(100%)" },
      },
    },
  },
}
```

---

## Testing

A demo page has been created to showcase all loading components:

**File:** `src/components/ui/LoadingDemo.jsx`

**To view:**

1. Import and add route to your router
2. Navigate to the demo page
3. Interact with different loading states

---

## Best Practices

### 1. **Use appropriate loaders for context**

- **Tables:** Use `TableRowSkeleton`
- **Cards:** Use `CardSkeleton`
- **Buttons:** Use `LoadingButton`
- **Full page:** Use `LoadingOverlay`
- **Inline text:** Use `ShimmerPlaceholder`

### 2. **Loading state management**

```jsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getData();
      setData(data);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### 3. **Conditional rendering**

```jsx
{
  loading ? <Skeleton /> : error ? <ErrorMessage /> : <ActualContent />;
}
```

### 4. **Button loading states**

```jsx
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
  setSubmitting(true);
  try {
    await api.submit(data);
  } finally {
    setSubmitting(false);
  }
};

<LoadingButton loading={submitting} onClick={handleSubmit}>
  Submit
</LoadingButton>;
```

---

## Performance Notes

- All animations use CSS transforms (GPU-accelerated)
- Skeleton loaders are lightweight divs with CSS animations
- No external dependencies added
- Dark mode fully supported
- Responsive and accessible

---

## Future Enhancements

1. **Progress bars** for file uploads
2. **Percentage indicators** for long operations
3. **Animated transitions** between loading and loaded states
4. **Custom skeleton shapes** for specific layouts
5. **Lazy loading** indicators for infinite scroll

---

## Accessibility

All loading components include:

- `role="status"` for screen readers
- `aria-label="Loading"` where appropriate
- Proper color contrast in both light and dark modes
- No seizure-inducing animations (smooth, controlled speeds)

---

## Support

For issues or questions:

1. Check the `LoadingDemo.jsx` for examples
2. Review component props in `Spinner.jsx`
3. Test with `loading={true}` prop
4. Verify Tailwind config is loaded

---

## Summary

✅ 7 reusable loading components created  
✅ 5 major pages updated with loading states  
✅ Custom Tailwind animations configured  
✅ Demo page for testing  
✅ Dark mode support throughout  
✅ Zero external dependencies  
✅ Fully accessible

All components are exported from `src/components/ui/index.js` for easy importing.
