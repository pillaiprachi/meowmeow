import {catalogChapters} from '../pages/catalog-chapters.js';

const chapterPhotos = new Map(catalogChapters.flatMap(({feature, products, photos}) => [
  feature, ...products.map(({photo}) => photo), ...photos
].map(photo => [photo[0].split('/').at(-1).replace('.webp', ''), photo])));

const existingPreviews = new Set(catalogChapters.flatMap(({feature, products}) => [feature[0], ...products.map(({photo}) => photo[0])]));

function image(type, src, width, height, alt) {
  const stem = src.split('/').at(-1).replace('.webp', '');
  const preview = width >= 960
    ? {src: existingPreviews.has(src) ? src.replace('.webp', '-640.webp') : `/product-media/${stem}-640.webp`, width: 640}
    : undefined;
  return {type, src, width, height, alt, thumb: `/product-media/${stem}-160.webp`, preview};
}

function chapter(type, file, description) {
  const [src, width, height, alt] = chapterPhotos.get(file);
  return image(type, src, width, height, description || alt);
}

// In display order. Each chapter photograph is assigned by subject, with the original caption and dimensions reused.
const photography = {
  'l-istante': [
    chapter('model', 'img-9151', 'L’Istante with a white shirt and dark jacket on a green bench'),
    chapter('detail', 'img-9200'),
    chapter('model', 'img-9114'),
    image('knot', '/about-assets/first-chapter-poster.webp', 1152, 648, 'L’Istante knot against a pale striped shirt on the green bench'),
    chapter('editorial', 'img-9197'),
    chapter('editorial', 'img-9122'),
    chapter('detail', 'img-9180'),
    chapter('editorial', 'img-9150'),
    chapter('editorial', 'img-9113'),
    chapter('detail', 'img-9120'),
    chapter('editorial', 'img-9195'),
    chapter('editorial', 'img-9181'),
    chapter('editorial', 'img-9201'),
    chapter('editorial', 'img-9127'),
    chapter('detail', 'img-9101'),
    chapter('editorial', 'img-9163'),
    chapter('editorial', 'img-9182'),
    chapter('detail', 'img-9179')
  ],
  'la-corsa': [
    chapter('model', 'img-9287', 'La Corsa with a dark suit and sunglasses outdoors'),
    chapter('detail', 'img-9306'),
    chapter('model', 'img-9298'),
    chapter('detail', 'img-9253'),
    chapter('editorial', 'img-9262'),
    chapter('detail', 'img-9311')
  ],
  'il-controllo': [
    chapter('model', 'curva-shoot3741', 'Il Controllo with a tan coat, white shirt and jeans'),
    chapter('detail', 'curva-shoot3803-3'),
    image('model', '/campaign-assets/plate-14.webp', 1000, 1500, 'Full-length studio portrait of Il Controllo with a black jacket and white shirt'),
    chapter('editorial', 'curva-shoot9004-2'),
    image('detail', '/lookbook-assets/page-03.webp', 1400, 1980, 'Il Controllo football motif against a tan coat, white shirt and jeans'),
    chapter('editorial', 'curva-shoot3804-2'),
    chapter('editorial', 'curva-shoot1682'),
    chapter('editorial', 'curva-shoot3750'),
    chapter('editorial', 'curva-shoot0037'),
    chapter('editorial', 'curva-shoot3795')
  ],
  'il-ritmo': [
    chapter('model', 'curva-shoot4423', 'Il Ritmo styled with a grey suit and pale yellow shirt'),
    chapter('detail', 'curva-shoot0635-2'),
    chapter('model', 'curva-shoot0584'),
    image('knot', '/campaign-assets/plate-02.webp', 1500, 1000, 'Il Ritmo knot against a black shirt with a stitched crest'),
    chapter('editorial', 'curva-shoot0570'),
    chapter('detail', 'curva-shoot4420'),
    chapter('editorial', 'curva-shoot0655-2'),
    chapter('editorial', 'curva-shoot4422'),
    chapter('editorial', 'curva-shoot0596')
  ],
  'nadal-orange': [
    chapter('model', 'curva-shoot-part24017', 'Nadal Orange with a blue jacket and white shirt against a pink backdrop'),
    chapter('detail', 'curva-shoot-part24024'),
    chapter('model', 'curva-shoot-part25057'),
    chapter('knot', 'curva-shoot7325', 'Nadal Orange knot and pale blue shirt collar in profile'),
    image('editorial', '/campaign-assets/plate-22.webp', 1000, 1500, 'Nadal Orange with folded arms and a blue jacket against a pink backdrop'),
    chapter('editorial', 'curva-shoot-part24013'),
    chapter('editorial', 'curva-shoot7323'),
    chapter('editorial', 'curva-shoot-part25058'),
    chapter('editorial', 'curva-shoot-part24020'),
    chapter('editorial', 'curva-shoot-part24022'),
    chapter('editorial', 'curva-shoot-part24011'),
    chapter('editorial', 'curva-shoot-part24028'),
    chapter('editorial', 'curva-shoot-part24029'),
    chapter('editorial', 'curva-shoot-part24033'),
    chapter('editorial', 'curva-shoot7322')
  ],
  'dusty-rose': [
    chapter('model', 'curva-shoot4165', 'Dusty Rose with a white shirt and ribbed taupe jacket'),
    chapter('detail', 'curva-shoot-part21913'),
    chapter('model', 'curva-shoot-part27785'),
    chapter('knot', 'curva-shoot2100'),
    chapter('editorial', 'curva-shoot6253'),
    chapter('editorial', 'curva-shoot-part29857'),
    chapter('editorial', 'curva-shoot-part24608'),
    chapter('knot', 'curva-shoot5190'),
    chapter('detail', 'curva-shoot-part21928'),
    chapter('editorial', 'curva-shoot2102'),
    chapter('editorial', 'curva-shoot-part27783'),
    chapter('editorial', 'curva-shoot-part29854'),
    chapter('editorial', 'curva-shoot-part27791'),
    chapter('editorial', 'curva-shoot-part29846'),
    chapter('editorial', 'curva-shoot-part29850'),
    chapter('editorial', 'curva-shoot-part29847'),
    chapter('editorial', 'curva-shoot6271'),
    chapter('knot', 'curva-shoot6272'),
    chapter('editorial', 'curva-shoot-part29848'),
    chapter('editorial', 'curva-shoot-part27789'),
    chapter('editorial', 'curva-shoot-part27787')
  ]
};

export function galleryMedia(id, {name, img, imageWidth, imageHeight = 800}) {
  const [hero, ...alternates] = photography[id] || [];
  const alt = `${name}, full-length isolated silk tie`;
  if (!hero) return img ? [{type: 'product', src: img, width: imageWidth, height: imageHeight, alt}] : [];
  return [hero, image('product', img, imageWidth, imageHeight, alt), ...alternates];
}
