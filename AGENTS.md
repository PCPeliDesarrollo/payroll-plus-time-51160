# Layout rules

- Global safe-area spacing is owned by `#root` and the shared protection strip; headers must not add the top inset again, so controls and viewport sizing share a single boundary.
- Shared dialogs and sheets must remain within the safe viewport, including when page-specific height classes are supplied, so close buttons and actions stay reachable.