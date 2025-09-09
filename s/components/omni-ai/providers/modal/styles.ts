import {css} from "@benev/slate"

export const styles = css`
  .config-input {
    width: 45%;
  }

  .muted {
    margin-top: 0.5em;
  }

  .main {
    width: 50%;
  }

  .config-figure {
    margin-top: 2em;
    width: 100%;
  }

  .config-input-wrapper {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    row-gap: 2em;
    column-gap: 1em;
  }


  .modal-ui {
    width: 100%;
    display: flex;
    flex-direction: row;
  }

  .config-actions {
    margin-top: 1em;

  }

  .detail-button {
    margin-top: 1em;
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  .media-card {
		position: relative;
		border-radius: var(--card-radius);
		background-color: #252525;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		transition: transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
		display: flex;
		flex-direction: column;
	}

	.media-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

  .media-element {
		position: relative;
		background-color: #1a1a1a;
		overflow: hidden;
		aspect-ratio: 16/9;
    width: 300px;
    cursor: pointer;
	}

	.media-element img,
	.media-element video {
		width: 100%;
		height: 100%;
		object-fit: cover;
    display: block
    border-radius: 1em;
	}

  .media-card:hover .media-overlay {
		opacity: 1;
	}

  .media-card.selected {
    border: 3px solid transparent;
    border-color: #F3D408FF;
    border-width: 0.1em;
  }

  .media-grid.disabled {
    opacity: 0.5;
    pointer-events: none;
    user-select: none;
    filter: grayscale(80%);
  }

  .media-info {
		padding: 10px;
		background-color: #252525;
	}

	.media-name {
		display: block;
		font-size: 0.85rem;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

  .media-grid {
    display: flex;
    flex-direction: row;
    overflow: auto;
    width: auto;
    gap: 1em;
    margin-top: 1em;
  }

  .btn-generate {
    margin-top: 1em;
  }

`