# Adding real product photos (manual)

You can add a real photo for any product without re-seeding the database or
rebuilding the app. The site shows your uploaded photo automatically.

## How it works

Each product has a **slug** — the bit after `/p/` in its URL
(e.g. `https://resourcecentre.co.ke/p/dell-xps-13-2025` → slug `dell-xps-13-2025`).

The site looks for a photo at:

```
apps/web/public/products/<slug>.jpg
```

If that file exists, it's shown. If not, it falls back to the catalogue image,
and if there's none, to the brand name. So: **drop in a correctly-named JPG and
the real photo appears.**

## Steps

1. Open **`product-photo-filenames.csv`** (in the project root). It lists every
   product with its `slug` and the exact `upload_filename` to use. Products
   marked `has_catalogue_image = NO — needs photo` are the priority (174 of them).
2. Save each photo as a **JPG** named exactly the `upload_filename`
   (e.g. `dell-xps-13-2025.jpg`). Square-ish, on a white/transparent background,
   ~800×800px looks best. Keep files reasonably small (< ~300 KB).
3. Put the files in `apps/web/public/products/`.
4. Upload that folder to the server. From your Mac:

   ```bash
   rsync -av apps/web/public/products/ \
     root@102.68.86.216:/var/www/resourcecentre/apps/web/public/products/
   ```

That's it — public files are served immediately, **no rebuild or restart needed.**
Refresh the product page and your photo shows.

## Notes

- Use only photos you have the right to use (your own shots, supplier/distributor
  asset packs, or manufacturer press images cleared for retail listings).
- Filenames must match the slug exactly, all lowercase, words separated by hyphens.
- Only `.jpg` is auto-detected. If you have a PNG, convert it to JPG first
  (or rename — but real JPG compresses better).
- To replace a photo later, just overwrite the file with the same name.
