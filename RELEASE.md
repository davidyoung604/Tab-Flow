# Release Notes

### 1.1.0
- You can now discard/unload a tab from memory.
  - Frees up system resources being consumed by tabs that you may not get to for a while. Let's be honest - you only have this extension because you're a tab hoarder.
  - Tab is discarded rather than killed. This means that simply clicking that tab will reload it, rather than having to manually refresh it.
  - "Discard" was chosen because that's the underlying Chrome API call used to do it.
- Fixed a padding issue where the scrollbar was partially on top of text.

### 1.0.1
- Fixed an issue where bookmarking would result in two folders being created - one in "Bookmarks Bar" and the other in "Other Bookmarks"
- Rewrote bookmark tree parsing to no longer require additional API calls
