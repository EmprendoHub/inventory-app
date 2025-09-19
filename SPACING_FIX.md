# QR/Barcode Spacing Fix

## Problem
The title and price text were being cut off at the bottom of the 4x3cm sticker because there was unwanted space between the QR/barcode image and the text.

## Spacing Sources Identified & Fixed

### 1. **CSS File (qrstyles.scss)**
**BEFORE:**
```css
.code-container img {
  margin-bottom: 0.05cm !important; /* ❌ Unwanted space */
}

.code-container {
  justify-content: space-between !important; /* ❌ Pushed elements apart */
}

.code-container .text-center {
  justify-content: center !important; /* ❌ Centered text area */
  min-height: 1cm !important; /* ❌ Forced minimum height */
}

.code-container .text-center p {
  padding: 1px 0 !important; /* ❌ Extra padding */
}
```

**AFTER:**
```css
.code-container img {
  margin: 0 !important; /* ✅ No margin */
}

.code-container {
  justify-content: flex-start !important; /* ✅ Pack elements tightly */
}

.code-container .text-center {
  justify-content: flex-start !important; /* ✅ Start from top */
  /* Removed min-height */
}

.code-container .text-center p {
  padding: 0 !important; /* ✅ No padding */
}
```

### 2. **Component File (QRGenerator.tsx)**
**BEFORE:**
```tsx
className="flex flex-col items-center justify-between" // ❌ Space between
<div className="text-center mt-1 print:mt-0"> // ❌ Margin top
```

**AFTER:**
```tsx
className="flex flex-col items-center justify-start" // ✅ Pack from start
<div className="text-center print:mt-0"> // ✅ No margin
```

## Result
- ✅ **No space** between QR/barcode image and title/price text
- ✅ **Tight layout** - image and text are packed together
- ✅ **More room** for text at the bottom of the 4x3cm sticker
- ✅ **Better readability** - title and price are no longer cut off

## Layout Changes Summary
1. **Removed** image bottom margin (0.05cm)
2. **Changed** container from `space-between` to `flex-start`
3. **Removed** text area minimum height constraint
4. **Eliminated** padding on text paragraphs
5. **Removed** margin-top on text container
