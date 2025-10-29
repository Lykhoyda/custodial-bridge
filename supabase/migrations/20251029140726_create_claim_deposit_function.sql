CREATE OR REPLACE FUNCTION claim_deposit_for_processing(deposit_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
AS $$
DECLARE
    current_status text;
BEGIN
    -- Lock the row and get current status
    SELECT deposit_status INTO current_status
    FROM deposits
    WHERE id = deposit_id
        FOR UPDATE;

    -- Check if it's still 'confirmed'
    IF current_status = 'confirmed' THEN
        -- Update to 'processing' to prevent other workers from claiming it
        UPDATE deposits
        SET
            deposit_status = 'processing',
            updated_at = NOW()
        WHERE id = deposit_id;

        RETURN true;  -- Successfully claimed
    ELSE
        RETURN false;  -- Someone else got it
    END IF;
END;
$$;