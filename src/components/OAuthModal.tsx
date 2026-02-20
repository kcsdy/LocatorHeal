"use client";

export default function OAuthModal({
  open,
  writeAccess,
  onToggleWriteAccess,
  onClose,
  onAuthorize,
}: {
  open: boolean;
  writeAccess: boolean;
  onToggleWriteAccess: (v: boolean) => void;
  onClose: () => void;
  onAuthorize: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="GitHub OAuth Connect">
      <div className="modal">
        <div className="modalHeader">
          <div>
            <div className="modalTitle">Connect GitHub</div>
          </div>
          <button className="iconBtn" onClick={onClose} aria-label="Close modal" type="button">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="modalStep">
            <div className="stepBadge">1</div>
            <div>
              <div className="stepTitle">Choose access level</div>
              <div className="stepText">Read access scans. Write access enables PR creation.</div>

              <div className="toggleRow">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={writeAccess}
                    onChange={(e) => onToggleWriteAccess(e.target.checked)}
                  />
                  <span>
                    Enable write access <span className="mutedInline">— recommended</span>
                  </span>
                </label>

                <div className="pill small">{writeAccess ? "Scopes: repo + pull_request" : "Scopes: read-only"}</div>
              </div>
            </div>
          </div>

          <div className="modalStep">
            <div className="stepBadge">2</div>
            <div>
              <div className="stepTitle">Authorize</div>

              <div className="modalActions">
                <button className="btn primary" onClick={onAuthorize} type="button">
                  Authorize with GitHub
                </button>
                <button className="btn" onClick={onClose} type="button">
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
