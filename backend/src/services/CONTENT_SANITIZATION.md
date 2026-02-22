# Content Sanitization Documentation

## Overview

The Community Service implements comprehensive content sanitization to prevent XSS (Cross-Site Scripting) attacks and ensure user-generated content is safe to display.

## Implementation

### Library

Uses `isomorphic-dompurify` - a universal XSS sanitizer that works in both Node.js and browser environments.

### Sanitization Method

Located in `CommunityService.sanitizeContent()` (private method)

### Configuration

```typescript
DOMPurify.sanitize(content, {
  ALLOWED_TAGS: [],        // No HTML tags allowed - strips all HTML
  ALLOWED_ATTR: [],        // No attributes allowed
  KEEP_CONTENT: true,      // Keep text content after stripping tags
  FORBID_TAGS: [           // Explicitly forbid dangerous tags
    'script',
    'style', 
    'iframe',
    'object',
    'embed'
  ],
  FORBID_ATTR: [           // Forbid event handlers
    'onerror',
    'onload',
    'onclick',
    'onmouseover'
  ],
});
```

### Additional Processing

After DOMPurify sanitization, the method also:
1. Removes `javascript:` protocol URLs (case-insensitive)
2. Trims whitespace from the result

## What Gets Sanitized

### 1. Script Tags
**Input:** `<script>alert("XSS")</script>Hello World`  
**Output:** `Hello World`

### 2. Event Handlers
**Input:** `<img src="x" onerror="alert('XSS')" />Test`  
**Output:** `Test`

### 3. JavaScript URLs
**Input:** `<a href="javascript:alert('XSS')">Click me</a>`  
**Output:** `Click me`

### 4. All HTML Tags
**Input:** `<div><p>Hello <strong>World</strong></p></div>`  
**Output:** `Hello World`

### 5. Style Tags
**Input:** `<style>body { background: red; }</style>Content`  
**Output:** `Content`

### 6. Dangerous Elements
**Input:** `<iframe src="evil.com"></iframe>Text`  
**Output:** `Text`

**Input:** `<object data="evil.swf"></object>Text`  
**Output:** `Text`

## What Gets Preserved

### Plain Text
**Input:** `This is a normal post with no HTML`  
**Output:** `This is a normal post with no HTML`

### Whitespace (trimmed)
**Input:** `  Hello World  `  
**Output:** `Hello World`

### Special Characters
**Input:** `I love emojis! 🎉 & special chars: @#$%`  
**Output:** `I love emojis! 🎉 & special chars: @#$%`

## Usage

The sanitization is automatically applied in the following methods:

### 1. Post Creation
```typescript
CommunityService.createPost(data: CreatePostData)
```
- Sanitizes `data.content` before storing in database
- Validates content length after sanitization

### 2. Post Update
```typescript
CommunityService.updatePost(postId, userId, data: UpdatePostData)
```
- Sanitizes `data.content` if provided
- Validates content length after sanitization

## Validation

After sanitization, the content is validated:
- **Minimum length:** 1 character
- **Maximum length:** 500 characters
- **Error:** Throws error if outside these bounds

## Requirements Validation

This implementation validates:
- **Requirement 1.2:** "WHEN a user includes text in a post, THE Content_Sanitizer SHALL remove XSS vulnerabilities before storage"

Specifically removes:
- Script tags
- Event handlers (onerror, onload, onclick, onmouseover, etc.)
- javascript: URLs
- All HTML tags (while preserving text content)
- Dangerous elements (iframe, object, embed, style)

## Security Considerations

### Defense in Depth

While this sanitization is comprehensive, it's part of a defense-in-depth strategy:

1. **Input Sanitization** (this layer) - Remove malicious content
2. **Output Encoding** - Frontend should also encode when displaying
3. **Content Security Policy** - Browser-level protection
4. **Rate Limiting** - Prevent abuse

### Why Strip All HTML?

The decision to strip ALL HTML tags (not just dangerous ones) is intentional:
- **Simplicity:** Easier to maintain and audit
- **Consistency:** All posts have plain text formatting
- **Security:** No edge cases with allowed tags
- **User Experience:** Prevents formatting inconsistencies

### Case-Insensitive Matching

The `javascript:` protocol removal is case-insensitive to catch variations like:
- `javascript:`
- `JavaScript:`
- `JAVASCRIPT:`
- `JaVaScRiPt:`

## Testing

To manually test sanitization:

1. Create a post with malicious content
2. Verify the stored content in the database
3. Confirm no script tags or event handlers remain

Example test cases:
```typescript
// Test 1: Script tag
POST /api/community/posts
{ "content": "<script>alert('XSS')</script>Hello" }
// Expected DB value: "Hello"

// Test 2: Event handler
POST /api/community/posts
{ "content": "<img onerror='alert(1)'>Test" }
// Expected DB value: "Test"

// Test 3: JavaScript URL
POST /api/community/posts
{ "content": "<a href='javascript:alert(1)'>Link</a>" }
// Expected DB value: "Link"
```

## Related Files

- `backend/src/services/communityService.ts` - Implementation
- `backend/src/middleware/rateLimitMiddleware.ts` - Rate limiting
- `.kiro/specs/community-threads-feed/requirements.md` - Requirements
- `.kiro/specs/community-threads-feed/design.md` - Design specifications
