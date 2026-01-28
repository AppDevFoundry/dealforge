package db

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// SyncCheckpoint represents a sync progress checkpoint record.
type SyncCheckpoint struct {
	ID                   string
	SyncSessionID        string
	Source               string // 'bls', 'census', 'hud'
	LastCompletedEntity  *string
	TotalRecordsSynced   int
	Status               string // 'in_progress', 'completed', 'rate_limited', 'failed'
	StartedAt            time.Time
	LastUpdatedAt        time.Time
}

// CreateCheckpoint creates a new sync checkpoint record.
func (c *Client) CreateCheckpoint(ctx context.Context, sessionID, source string) (*SyncCheckpoint, error) {
	id := fmt.Sprintf("chk_%s", uuid.New().String())

	query := `
		INSERT INTO sync_checkpoints (
			id, sync_session_id, source, total_records_synced, status, started_at, last_updated_at
		) VALUES (
			$1, $2, $3, 0, 'in_progress', NOW(), NOW()
		)
		RETURNING id, sync_session_id, source, last_completed_entity, total_records_synced,
		          status, started_at, last_updated_at
	`

	checkpoint := &SyncCheckpoint{}
	err := c.pool.QueryRow(ctx, query, id, sessionID, source).Scan(
		&checkpoint.ID,
		&checkpoint.SyncSessionID,
		&checkpoint.Source,
		&checkpoint.LastCompletedEntity,
		&checkpoint.TotalRecordsSynced,
		&checkpoint.Status,
		&checkpoint.StartedAt,
		&checkpoint.LastUpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create checkpoint: %w", err)
	}

	return checkpoint, nil
}

// UpdateCheckpoint updates an existing checkpoint with progress information.
func (c *Client) UpdateCheckpoint(ctx context.Context, sessionID string, lastEntity string, recordCount int) error {
	query := `
		UPDATE sync_checkpoints
		SET last_completed_entity = $1,
		    total_records_synced = total_records_synced + $2,
		    last_updated_at = NOW()
		WHERE sync_session_id = $3 AND status = 'in_progress'
	`

	result, err := c.pool.Exec(ctx, query, lastEntity, recordCount, sessionID)
	if err != nil {
		return fmt.Errorf("failed to update checkpoint: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("no active checkpoint found for session %s", sessionID)
	}

	return nil
}

// UpdateCheckpointStatus updates the status of a checkpoint.
func (c *Client) UpdateCheckpointStatus(ctx context.Context, sessionID, status string) error {
	query := `
		UPDATE sync_checkpoints
		SET status = $1,
		    last_updated_at = NOW()
		WHERE sync_session_id = $2
	`

	_, err := c.pool.Exec(ctx, query, status, sessionID)
	if err != nil {
		return fmt.Errorf("failed to update checkpoint status: %w", err)
	}

	return nil
}

// GetCheckpointBySession retrieves a checkpoint by session ID.
func (c *Client) GetCheckpointBySession(ctx context.Context, sessionID string) (*SyncCheckpoint, error) {
	query := `
		SELECT id, sync_session_id, source, last_completed_entity, total_records_synced,
		       status, started_at, last_updated_at
		FROM sync_checkpoints
		WHERE sync_session_id = $1
	`

	checkpoint := &SyncCheckpoint{}
	err := c.pool.QueryRow(ctx, query, sessionID).Scan(
		&checkpoint.ID,
		&checkpoint.SyncSessionID,
		&checkpoint.Source,
		&checkpoint.LastCompletedEntity,
		&checkpoint.TotalRecordsSynced,
		&checkpoint.Status,
		&checkpoint.StartedAt,
		&checkpoint.LastUpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get checkpoint: %w", err)
	}

	return checkpoint, nil
}

// GetLastCheckpointForSource retrieves the most recent checkpoint for a given source.
// This is useful for finding the last sync session to potentially resume from.
func (c *Client) GetLastCheckpointForSource(ctx context.Context, source string) (*SyncCheckpoint, error) {
	query := `
		SELECT id, sync_session_id, source, last_completed_entity, total_records_synced,
		       status, started_at, last_updated_at
		FROM sync_checkpoints
		WHERE source = $1
		ORDER BY started_at DESC
		LIMIT 1
	`

	checkpoint := &SyncCheckpoint{}
	err := c.pool.QueryRow(ctx, query, source).Scan(
		&checkpoint.ID,
		&checkpoint.SyncSessionID,
		&checkpoint.Source,
		&checkpoint.LastCompletedEntity,
		&checkpoint.TotalRecordsSynced,
		&checkpoint.Status,
		&checkpoint.StartedAt,
		&checkpoint.LastUpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get last checkpoint: %w", err)
	}

	return checkpoint, nil
}
