# WebDiag Image Palette Extractor Design

## Decision

Promote WD-083 as one browser-local image workbench. It accepts one JPEG, PNG,
WebP, or browser-supported AVIF and returns a deterministic sampled palette of
up to eight colors. No file bytes, pixels, or palette values are sent to an API.

## Extraction contract

Decode the image with the existing bounded raster loader. Draw it into a sample
canvas whose longest side is at most 160 pixels, preserving aspect ratio. Ignore
fully transparent pixels. Composite partially transparent pixels onto white so
the displayed HEX values describe the visible sampled result.

Quantize each RGB channel to five significant bits, count the resulting buckets,
sort by count descending and then HEX ascending, and return the requested number
of colors. Each item exposes HEX, RGB, sampled pixel count, and percentage of
the non-transparent sample. Percentage is rounded to one decimal place.

This is a deterministic sampled palette, not an exact inventory, perceptual
clustering model, brand-color detector, accessibility check, or color-profile
analysis. Nearby shades can occupy separate buckets and small details can be
omitted by downsampling.

## UX

The control panel contains one file input and a four-to-eight color count. The
result presents large color swatches, copyable HEX/RGB values, and sample share.
The source dimensions and file size remain visible. Empty transparent images and
unsupported/oversized inputs show a localized error. There is no upload, save,
history, invented color name, or automatic recommendation.

## Security and performance

Reuse the existing 25 MiB, 40-megapixel, type/filename, and ImageBitmap bounds.
The sample canvas bounds analysis work independently of source dimensions.
Object pixels stay in browser memory and are released when a new image replaces
the prior bitmap or the component unmounts.

