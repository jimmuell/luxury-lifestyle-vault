# Founder step — add the brand card image for the 404 / error pages

**Date:** 2026-06-04
**For:** Jim (do this **before** handing the 404/error Code prompt to Claude Code)
**Why:** The branded 404/error pages use the founding-member card image. Claude Code can't read Google Drive, so the image has to live in the repo first.

## Do this (≈30 seconds)

1. Open Drive → **Luxury Lifestyle Vault → 09 Brand Assets**, and download **`llv_final_brand_card.png`**:
   https://drive.google.com/file/d/1Yevwx62nipICraXQHVzpzam8yrAbRZP8/view
2. In the repo, create the folder `public/brand/` if it doesn't exist.
3. Save the file there, named exactly:
   ```
   public/brand/llv-card.png
   ```
   (Full path: `<repo>/public/brand/llv-card.png`)

That's it. The image is 2.6 MB, but the pages use Next.js `<Image>`, which automatically resizes/compresses it on serve — visitors get a small optimized version, not the full file.

## Then

Hand the Code prompt `docs/_archive/cowork/2026-06-04/07_llv_code_prompt_2026-06-04_branded_404_error.md` to Claude Code. It references `public/brand/llv-card.png`. Code will commit the image along with the new pages, so it deploys to Vercel with everything else.
