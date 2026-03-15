# 3D Tree Assets

## Summary

`web/public/3d/tree/` に配置している 3D 木アセットの出典と採用理由を整理する。

- trunk: `tree_stump_02`
- branch: `dry_branches_medium_01`
- blossom node / tag bud: `flower_heliophila`
- bark textures: `sakura_bark`
- environment HDRI: `rooitou_park`

## Source List

| Role         | Asset                  | Author                          | License | Source                                         |
| ------------ | ---------------------- | ------------------------------- | ------- | ---------------------------------------------- |
| Trunk        | Tree Stump 02          | Poly Haven                      | CC0     | https://polyhaven.com/a/tree_stump_02          |
| Branch       | Dry Branches Medium 01 | Poly Haven                      | CC0     | https://polyhaven.com/a/dry_branches_medium_01 |
| Blossom      | Flower Heliophila      | Poly Haven                      | CC0     | https://polyhaven.com/a/flower_heliophila      |
| Bark texture | Sakura Bark            | Charlotte Baglioni / Poly Haven | CC0     | https://polyhaven.com/a/sakura_bark            |
| HDRI         | Rooitou Park           | Greg Zaal / Poly Haven          | CC0     | https://polyhaven.com/a/rooitou_park           |

## Notes

- `glb` files are optimized with `@gltf-transform/cli` and committed under `web/public/3d/tree/`.
- Raw downloads are kept only in temporary local working directories and are not committed.
- As of 2026-03-16, the originally planned Sketchfab assets required authenticated download from the public page, so the implementation switched to directly downloadable CC0 assets from Poly Haven.
