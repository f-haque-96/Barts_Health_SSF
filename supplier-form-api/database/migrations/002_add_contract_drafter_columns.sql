-- =============================================================================
-- Migration 002: Add Contract Drafter Columns
-- Created: 2026-02-13
-- Description: Adds columns for contract drafter workflow tracking
-- =============================================================================

-- Contract Drafter status tracking
IF COL_LENGTH('Submissions', 'ContractDrafterStatus') IS NULL
BEGIN
    ALTER TABLE Submissions ADD ContractDrafterStatus NVARCHAR(50) NULL;
    PRINT 'Added ContractDrafterStatus column';
END
GO

IF COL_LENGTH('Submissions', 'ContractDrafterAssignedTo') IS NULL
BEGIN
    ALTER TABLE Submissions ADD ContractDrafterAssignedTo NVARCHAR(255) NULL;
    PRINT 'Added ContractDrafterAssignedTo column';
END
GO

IF COL_LENGTH('Submissions', 'ContractTemplateUsed') IS NULL
BEGIN
    ALTER TABLE Submissions ADD ContractTemplateUsed NVARCHAR(255) NULL;
    PRINT 'Added ContractTemplateUsed column';
END
GO

IF COL_LENGTH('Submissions', 'ContractApprovedAt') IS NULL
BEGIN
    ALTER TABLE Submissions ADD ContractApprovedAt DATETIME NULL;
    PRINT 'Added ContractApprovedAt column';
END
GO

IF COL_LENGTH('Submissions', 'ContractApprovedBy') IS NULL
BEGIN
    ALTER TABLE Submissions ADD ContractApprovedBy NVARCHAR(255) NULL;
    PRINT 'Added ContractApprovedBy column';
END
GO

PRINT 'Migration 002: Contract drafter columns added';
