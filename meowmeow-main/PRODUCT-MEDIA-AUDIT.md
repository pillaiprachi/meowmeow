# CURVA product media audit

The [product media registry](src/shop/product-media.js) lists the 85 distinct photographs and product views in gallery order. The first image is the hero. The full-length isolated view comes second, followed by print details, alternate styling, and knot photographs where available. Product IDs remain the `tie` query values on `/curva?tie=<id>#rack`.

| Product | ID | Gallery images | Hero source |
| --- | --- | ---: | --- |
| L’Istante | `l-istante` | 19 | `catalog-assets/chapter-1/img-9151.webp` |
| La Corsa | `la-corsa` | 7 | `catalog-assets/chapter-1/img-9287.webp` |
| Il Controllo | `il-controllo` | 11 | `catalog-assets/chapter-2/curva-shoot3741.webp` |
| Il Ritmo | `il-ritmo` | 10 | `catalog-assets/chapter-2/curva-shoot4423.webp` |
| Nadal Orange | `nadal-orange` | 16 | `catalog-assets/chapter-3/curva-shoot-part24017.webp` |
| Dusty Rose | `dusty-rose` | 22 | `catalog-assets/chapter-3/curva-shoot4165.webp` |

La Corsa has the smallest gallery, with seven images. Its print close-ups show the blade. A dedicated knot close-up was unavailable. No product-specific packaging photograph or dedicated weave macro was verified. The galleries use the closest verified print and knot details.

All 85 originals, 85 thumbnails, and 24 responsive previews decoded successfully. The 101 newly derived files total about 660 KiB. The existing product photos stay at their original resolution.

## Excluded source assets

The audit compared the visual subjects, filenames, existing captions and product references, and pixel dimensions across the catalog, campaign, rack, hero, lookbook, and about directories. It covered 101 existing original WebPs. Responsive renditions and thumbnails do not count as gallery images.

| Existing asset under `public/` | Reason |
| --- | --- |
| `catalog-assets/chapter-3/img-9969-copy.webp`, `img-9971-copy.webp`, `img-9974-copy.webp`, `img-9975-copy.webp` | Shared still lifes showing Nadal Orange and Dusty Rose together. |
| `catalog-assets/chapter-3/curva-shoot-part24026.webp` | Alternate framing of the Nadal Orange portrait registered as the higher-resolution `campaign-assets/plate-22.webp`. |
| `hero-assets/la-corsa.webp` | Texture version of the isolated La Corsa view registered from `rack-assets/r9-cutout.webp`. |
| `about-assets/first-chapter-portraits.webp` | Composite showing Il Ritmo and Il Controllo. |
| `lookbook-assets/page-01.webp`, `page-02.webp` | Designed Il Ritmo pages using the same styled sequence as the standalone prints. |
| `lookbook-assets/page-04.webp`, `page-05.webp` | Alternate lookbook layouts for La Corsa `img-9287` and L’Istante `img-9197`. Page 5’s source caption says La Corsa, but the visible stadium print and matching catalog photograph identify L’Istante. |
| `lookbook-assets/page-06.webp`, `page-07.webp` | Two halves of a multi-tie spread with text and partial product views. |
| `lookbook-assets/page-08.webp`, `page-09.webp` | Typeset and reframed Dusty Rose spread. The gallery uses the standalone `curva-shoot2100.webp` knot photograph. |
| `rack-assets/silk-atlas.webp` | Multi-product texture atlas used by the rack renderer. |

`about-assets/first-chapter.mp4` is the existing editorial film. The gallery includes its L’Istante poster still. Brand SVGs are interface assets. No remaining standalone still was left with an unresolved product identity.

## Adding media

A product can register an ordered `media` list in [the product store](src/shop/store.js). Each image supplies `src`, `width`, `height`, `alt`, and `type`. `thumb` and a responsive `preview` with `src` and `width` are optional. The catalog and rack use the same gallery component. The rack product image also works as a single-image gallery when it is the only registered asset.

## Verification

- Desktop Chromium verified product identity, gallery count, image proportions, thumbnail and keyboard navigation, full-screen navigation, and return to the catalog on all six ties. Hover zoom and the full-screen zoom controls were exercised on L’Istante.
- Emulated mobile Chromium verified touch navigation, full-screen pinch zoom, and page width on all six ties. La Corsa and Dusty Rose also passed vertical-scroll checks while touching the image.
- Browser fixtures covered one image, two mixed-aspect images, an empty gallery, a broken first image, and a delayed next image.
- The rack deep link, Escape behavior, Add to Bag, and bag persistence at checkout passed. The production build and `git diff --check` passed.
