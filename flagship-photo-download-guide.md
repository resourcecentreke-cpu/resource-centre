# Flagship photo download guide

Download a clear product photo for each phone below, then put the files in your
**Resourcecentre** folder (or tell me where) and I'll rename them to the exact
slug filename and place them in `apps/web/public/products/`. No rebuild needed —
public files serve immediately.

**What to grab:** a front (or front+back) product render on a plain/white or
transparent background. JPG or PNG, ideally ~600×760 or larger. Save each one,
then I'll handle the resizing/renaming.

**Rights note:** use images you're entitled to use — the manufacturer's official
**press / media kit**, or the **product image from the retailer page** where the
phone is sold (as a retail/affiliate listing site, these are the right sources).
Avoid random blog/watermarked images.

---

## The five flagship cards

| # | Phone | Save the file as | Official photo source |
|---|-------|------------------|------------------------|
| 1 | Samsung Galaxy S26 Ultra | `samsung-galaxy-s26-ultra.jpg` | Samsung Mobile Press → https://www.samsungmobilepress.com/media-assets · or Newsroom media library → https://news.samsung.com/global/ |
| 2 | Google Pixel 10 Pro XL | `google-pixel-10-pro-xl.jpg` | Google Store product page → https://store.google.com/category/phones · Google press → https://blog.google/products/pixel/ |
| 3 | iPhone 17 Pro Max | `iphone-17-pro-max.jpg` | Apple Newsroom → https://www.apple.com/newsroom/ · product page → https://www.apple.com/iphone-17-pro/ |
| 4 | Oppo Find X9 Ultra | `oppo-find-x9-ultra.jpg` | OPPO Newsroom → https://www.oppo.com/en/newsroom/ · Find X series → https://www.oppo.com/en/smartphones/series-find-x/ |
| 5 | Vivo X200 Pro | `vivo-x200-pro.jpg` | vivo global → https://www.vivo.com/en/products · X200 Pro page → https://www.vivo.com/en/products/x200-pro |

> Tip: on a product/press page, right-click the main phone image → "Save image as…"
> and name it whatever you like — I'll rename it to the slug above when I place it.

---

## Brand portals (for adding more phones later)

From your press-kit directory — public media portals you can pull from:

| Brand | Press / media portal |
|-------|----------------------|
| Samsung | https://www.samsungmobilepress.com/media-assets · https://news.samsung.com/global/ |
| Apple | https://www.apple.com/newsroom/ |
| Google Pixel | https://blog.google/products/pixel/ · https://store.google.com/category/phones |
| OnePlus | https://www.oneplus.com/global/press-releases |
| Xiaomi | https://www.mi.com/global/about/newsroom/ |
| OPPO | https://www.oppo.com/en/newsroom/ |
| vivo | https://www.vivo.com/en/about-vivo/newsroom |
| Honor | https://www.hihonor.com/global/news/ |
| Realme | https://www.realme.com/global/newsroom |
| Tecno | https://www.tecno-mobile.com/news/ |
| Infinix | https://www.infinixmobility.com/news |

---

## How to hand them to me

1. Save the downloaded images anywhere in your **Resourcecentre** folder
   (e.g. a new `incoming-photos/` folder is fine — any names).
2. Tell me **"photos are in"** (and the folder name if not the root).
3. I'll rename each to the correct `<slug>.jpg`, optimise/resize, and move them
   into `apps/web/public/products/`. They'll show on the cards instantly after
   your next deploy (or right away on the live server once that folder is synced).

You can do as many as you like — even 1 or 2 to start. Any phone without a photo
keeps the branded fallback panel, so it never looks broken.
