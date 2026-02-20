# Hero Components

A collection of reusable hero section components for creating stunning, performant hero sections with modern features.

## Components

### HeroBackground

A flexible hero background component with support for high-quality imagery, gradient overlays, and optional particle effects.

#### Features

- ✅ Full-width background image support with lazy loading
- ✅ Gradient overlay with customizable colors (soft blur/vignette)
- ✅ Optional subtle animated particles (CSS or Framer Motion)
- ✅ Responsive image sources (WebP/AVIF with fallbacks)
- ✅ Performance optimized (lazy load, proper sizing)
- ✅ Vignette effect for better text readability
- ✅ Optional blur effect on background
- ✅ Decorative animated blobs as alternative to particles
- ✅ Fully customizable gradient overlays
- ✅ Accessible and semantic HTML

#### Basic Usage

```tsx
import { HeroBackground } from '@/components/hero';

function MyHero() {
  return (
    <HeroBackground minHeight="70vh">
      <div className="flex items-center justify-center h-full">
        <h1 className="text-5xl font-bold text-white">
          Welcome to BubbleQuest
        </h1>
      </div>
    </HeroBackground>
  );
}
```

#### With Background Image

```tsx
<HeroBackground
  imageSrc="https://example.com/hero.jpg"
  imageAlt="Beautiful landscape"
  gradient={{
    from: 'from-black/60',
    via: 'via-black/30',
    to: 'to-transparent',
    opacity: 1,
  }}
  minHeight="80vh"
>
  <div className="flex items-center justify-center h-full px-6">
    <div className="text-center text-white">
      <h1 className="text-6xl font-bold mb-4">Your Next Adventure</h1>
      <p className="text-2xl">Starts here</p>
    </div>
  </div>
</HeroBackground>
```

#### With Responsive Images (WebP/AVIF)

```tsx
<HeroBackground
  imageSrcSet={{
    avif: '/images/hero-1920.avif',
    webp: '/images/hero-1920.webp',
    fallback: '/images/hero-1920.jpg',
  }}
  imageAlt="Hero background"
  enableVignette
  minHeight="70vh"
>
  {/* Your content */}
</HeroBackground>
```

#### With Particle Effects

```tsx
<HeroBackground
  enableParticles
  particleCount={30}
  gradient={{
    from: 'from-bubblequest-primary-600/50',
    to: 'to-transparent',
    opacity: 0.9,
  }}
  minHeight="100vh"
>
  {/* Your content */}
</HeroBackground>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Content to render on top of the background |
| `imageSrc` | `string` | - | Image source URL |
| `imageSrcSet` | `object` | - | Responsive image sources (avif, webp, fallback) |
| `imageAlt` | `string` | `'Hero background'` | Alt text for the background image |
| `gradient` | `object` | See below | Gradient overlay configuration |
| `enableParticles` | `boolean` | `false` | Enable particle effects |
| `particleCount` | `number` | `20` | Number of particles to render |
| `minHeight` | `string` | `'70vh'` | Minimum height of the hero section |
| `className` | `string` | - | Additional CSS classes |
| `enableVignette` | `boolean` | `true` | Enable vignette effect |
| `enableBlur` | `boolean` | `false` | Enable blur effect on background |

#### Gradient Object

```typescript
{
  from?: string;    // Starting color (top) - Tailwind class
  via?: string;     // Via color (middle) - Tailwind class
  to?: string;      // Ending color (bottom) - Tailwind class
  opacity?: number; // Opacity of the gradient (0-1)
}
```

Default gradient:
```typescript
{
  from: 'from-black/40',
  via: 'via-black/20',
  to: 'to-transparent',
  opacity: 1,
}
```

#### Performance Considerations

1. **Image Optimization**: Always provide WebP/AVIF formats for better compression
2. **Lazy Loading**: Images are lazy-loaded by default
3. **Particle Count**: Keep particle count reasonable (20-30) for smooth animations
4. **Gradient Overlays**: Use gradient overlays to improve text readability
5. **Responsive Images**: Provide multiple image sizes for different screen sizes

#### Accessibility

- Uses semantic HTML (`<section>`)
- Provides alt text for background images
- Ensures proper contrast with gradient overlays
- Particles are marked as `pointer-events-none` to not interfere with interactions

#### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful fallback for older browsers (JPEG/PNG fallback)
- CSS animations use GPU acceleration for smooth performance
- Respects `prefers-reduced-motion` for animations

#### Examples

See `HeroBackground.example.tsx` for complete usage examples including:
- Basic gradient background
- Image with custom gradient
- Responsive image formats
- Particle effects
- Blur effects
- Full-screen hero sections

## Testing

Run tests with:
```bash
npm test src/components/hero
```

## Future Enhancements

- [ ] Video background support
- [ ] Parallax scrolling effect
- [ ] Custom particle shapes
- [ ] More animation presets
- [ ] Intersection Observer for performance
- [ ] Dark mode support
