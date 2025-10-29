CREATE TABLE IF NOT EXISTS deposits
(
    id                   UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    deposit_address      varchar(42)  NOT NULL,
    destination_address  varchar(42)  NOT NULL,
    index                integer      NOT NULL,
    nonce                integer      NOT NULL
                                               DEFAULT 0,

    deposit_status       text         NOT NULL
        CHECK (deposit_status IN ('waiting', 'confirming', 'confirmed', 'failed'))
                                               DEFAULT 'waiting',
    deposit_tx_hash      varchar(66)  NULL,
    deposit_block_number integer      NULL,
    deposit_amount       varchar(255) NOT NULL,

    payout_status        text         NOT NULL
        CHECK (payout_status IN ('pending', 'sent', 'failed'))
                                               DEFAULT 'pending',
    payout_tx_hash       varchar(66)  NULL,
    payout_amount        varchar(255) NULL,
    fee                  varchar(255) NULL,

    deposit_error        varchar(255) NULL,
    payout_error         varchar(255) NULL,

    created_at           timestamptz  NOT NULL DEFAULT NOW(),
    updated_at           timestamptz  NOT NULL DEFAULT NOW()
);