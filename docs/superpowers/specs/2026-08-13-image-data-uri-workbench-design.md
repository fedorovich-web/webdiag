# WebDiag Image Data URI Workbench Design

## Decision

Promote WD-107 as one browser-local delivery workbench that produces an exact
Data URI for one small raster image and a separate tiny PNG placeholder. Keep
WD-108 internal because a standalone placeholder generator would duplicate the
same file intake and Canvas workflow without adding a distinct product outcome.

## Input and output contract

Accept one browser-decodable JPEG, PNG, WebP, or AVIF of at most 1 MiB and within
the existing 40-megapixel decode bound. The original Data URI uses the validated
media type and exact source bytes. It is not recompressed, optimized, sanitized,
or uploaded.

The placeholder preserves aspect ratio, limits the longest side to 24 pixels,
and encodes a new PNG through Canvas. Return its dimensions, byte length, Data
URI, and a ready-to-copy CSS `background-image: url("...")` declaration. This is
a tiny raster placeholder, not BlurHash, dominant-color inference, or a network
optimization recommendation.

## UX and safety

The result clearly separates the full source Data URI from the small placeholder
and shows character/byte costs before copy actions. Long strings stay in bounded
read-only textareas with wrapping. No URI is inserted as executable HTML and no
user-controlled filename or MIME value becomes markup.

File bytes remain in browser memory. A new selection clears prior output and the
ImageBitmap closes on replacement or unmount. Oversized, unsupported, malformed,
or non-decodable files receive a localized error.

