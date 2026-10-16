# AVC-Reward Project Page

A static, English-language project page for the AVC-Reward paper. It uses native HTML, CSS, and JavaScript and can be published with GitHub Pages.

## Preview locally

From the repository root, run:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Assets

The paper figures and result tables are embedded as vector PDFs in `assets/figures/`. The case-study videos used by the page are kept in their original `ref/` subfolders and loaded on demand by the browser. `SITE_COPY.md` contains the page text in editable form.

The arXiv button links directly to the AVC-Reward paper: https://arxiv.org/abs/2610.22321.
