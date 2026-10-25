import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const ROOT_FONT_SIZE_PX = 16;

/**
 * YouTube sets <html> font-size to 10px, and rem units inside the sidebar's
 * shadow root still follow it, shrinking every Tailwind size to 62.5%.
 * Convert rem to px so the UI has the same size on every page.
 */
const remToPx = () => ({
  postcssPlugin: 'rem-to-px',
  Declaration(decl) {
    if (!decl.value.includes('rem')) return;
    decl.value = decl.value.replace(
      /(-?\d*\.?\d+)rem\b/g,
      (_, value) =>
        `${Number((parseFloat(value) * ROOT_FONT_SIZE_PX).toFixed(4))}px`
    );
  },
});
remToPx.postcss = true;

export default {
  plugins: [tailwindcss, remToPx, autoprefixer],
};
