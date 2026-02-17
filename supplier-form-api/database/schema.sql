-- =============================================================================
-- NHS Supplier Setup Form - Database Schema
-- SQL Server
-- Version: 3.0
-- =============================================================================

-- Create database (run as admin)
-- CREATE DATABASE NHSSupplierForms;
-- GO
-- USE NHSSupplierForms;
-- GO

-- =============================================================================
-- SUBMISSIONS TABLE
-- Main table for all supplier setup requests
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Submissions]') AND type in (N'U'))
BEGIN
CREATE TABLE Submissions (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SubmissionID NVARCHAR(50) NOT NULL UNIQUE,
    DisplayReference NVARCHAR(100) NULL,

    -- Status tracking
    -- Valid statuses: pending_review, pending_pbp_review, info_required, pbp_approved,
    --   pending_procurement_review, procurement_approved, procurement_approved_opw,
    --   pending_opw_review, opw_approved, Completed_Payroll, inside_ir35_sds_issued,
    --   pending_contract, contract_uploaded, pending_ap_control, completed, rejected
    -- Terminal states: 'completed' (Oracle/AP), 'Completed_Payroll' (ESR), 'inside_ir35_sds_issued', 'rejected'
    -- SDS states: 'inside_ir35_sds_issued', 'sds_appeal' (for Inside IR35 intermediary tracking)
    Status NVARCHAR(50) NOT NULL DEFAULT 'pending_review',
    -- Valid stages: pbp, procurement, opw, contract, ap, completed, completed_payroll, sds_issued
    CurrentStage NVARCHAR(50) NOT NULL DEFAULT 'pbp',

    -- Requester Information
    RequesterFirstName NVARCHAR(100) NULL,
    RequesterLastName NVARCHAR(100) NULL,
    RequesterJobTitle NVARCHAR(100) NULL,
    RequesterDepartment NVARCHAR(100) NULL,
    RequesterEmail NVARCHAR(255) NULL,
    RequesterPhone NVARCHAR(50) NULL,

    -- Supplier Basic Information
    CompanyName NVARCHAR(255) NULL,
    TradingName NVARCHAR(255) NULL,
    SupplierType NVARCHAR(50) NULL,
    CRN NVARCHAR(20) NULL,
    CRNVerified BIT DEFAULT 0,
    CharityNumber NVARCHAR(20) NULL,
    VATNumber NVARCHAR(20) NULL,

    -- Supplier Address
    RegisteredAddress NVARCHAR(500) NULL,
    City NVARCHAR(100) NULL,
    Postcode NVARCHAR(20) NULL,
    Country NVARCHAR(100) DEFAULT 'United Kingdom',

    -- Supplier Contact
    ContactName NVARCHAR(200) NULL,
    ContactEmail NVARCHAR(255) NULL,
    ContactPhone NVARCHAR(50) NULL,

    -- Bank Details
    BankName NVARCHAR(100) NULL,
    SortCode NVARCHAR(10) NULL,
    AccountNumber NVARCHAR(20) NULL,
    AccountName NVARCHAR(200) NULL,
    IBAN NVARCHAR(50) NULL,
    SwiftCode NVARCHAR(20) NULL,

    -- Contract Information
    ServiceDescription NVARCHAR(MAX) NULL,
    ContractValue DECIMAL(18, 2) NULL,
    PaymentTerms NVARCHAR(100) NULL,

    -- Full Form Data (JSON)
    FormDataJSON NVARCHAR(MAX) NULL,

    -- PBP Review
    PBPReviewData NVARCHAR(MAX) NULL,
    PBPApprovalDate DATETIME NULL,
    PBPApprovedBy NVARCHAR(255) NULL,
    PBPComments NVARCHAR(MAX) NULL,

    -- Procurement Review
    ProcurementReviewData NVARCHAR(MAX) NULL,
    ProcurementDecision NVARCHAR(50) NULL,
    ProcurementApprovedBy NVARCHAR(255) NULL,
    ProcurementDate DATETIME NULL,

    -- OPW Review
    OPWReviewData NVARCHAR(MAX) NULL,
    OPWDecision NVARCHAR(50) NULL,
    OPWApprovedBy NVARCHAR(255) NULL,
    OPWDate DATETIME NULL,
    IR35Determination NVARCHAR(50) NULL,
    OutcomeRoute NVARCHAR(50) NULL, -- 'oracle_ap', 'payroll_esr', 'cannot_engage', NULL (still in progress)

    -- Contract Review
    ContractReviewData NVARCHAR(MAX) NULL,
    ContractUploadedBy NVARCHAR(255) NULL,
    ContractUploadDate DATETIME NULL,

    -- AP Control Review
    APReviewData NVARCHAR(MAX) NULL,
    APApprovedBy NVARCHAR(255) NULL,
    APApprovalDate DATETIME NULL,
    VendorNumber NVARCHAR(50) NULL,

    -- External References
    AlembaReference NVARCHAR(50) NULL,
    V1Reference NVARCHAR(50) NULL,

    -- Flags
    SupplierConnection BIT DEFAULT 0,
    ConnectionDetails NVARCHAR(MAX) NULL,
    IsDuplicateFlagged BIT DEFAULT 0,
    DuplicateCheckResult NVARCHAR(MAX) NULL,

    -- Metadata
    CreatedBy NVARCHAR(255) NULL,
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME DEFAULT GETUTCDATE(),

    -- Indexes
    INDEX IX_Submissions_Status (Status),
    INDEX IX_Submissions_CurrentStage (CurrentStage),
    INDEX IX_Submissions_CreatedAt (CreatedAt),
    INDEX IX_Submissions_CompanyName (CompanyName)
);
END
GO

-- =============================================================================
-- SUBMISSION DOCUMENTS TABLE
-- Tracks all uploaded documents with governance flags
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SubmissionDocuments]') AND type in (N'U'))
BEGIN
CREATE TABLE SubmissionDocuments (
    DocumentID INT IDENTITY(1,1) PRIMARY KEY,
    SubmissionID NVARCHAR(50) NOT NULL,

    -- Document Information
    DocumentType NVARCHAR(50) NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    FileSize INT NULL,
    MimeType NVARCHAR(100) NULL,

    -- SharePoint Storage
    SharePointPath NVARCHAR(500) NOT NULL,
    SharePointLibrary NVARCHAR(100) NOT NULL,

    -- Governance Flags (CRITICAL for DLP compliance)
    IsSensitive BIT NOT NULL DEFAULT 0,
    AllowAlembaSync BIT NOT NULL DEFAULT 1,

    -- Metadata
    UploadedBy NVARCHAR(255) NOT NULL,
    UploadedAt DATETIME DEFAULT GETUTCDATE(),

    -- Foreign key
    CONSTRAINT FK_Documents_Submission FOREIGN KEY (SubmissionID)
        REFERENCES Submissions(SubmissionID),

    -- Indexes
    INDEX IX_Documents_SubmissionID (SubmissionID),
    INDEX IX_Documents_DocumentType (DocumentType),
    INDEX IX_Documents_IsSensitive (IsSensitive),
    INDEX IX_Documents_AllowAlembaSync (AllowAlembaSync)
);
END
GO

-- =============================================================================
-- AUDIT TRAIL TABLE
-- Comprehensive logging for compliance
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuditTrail]') AND type in (N'U'))
BEGIN
CREATE TABLE AuditTrail (
    AuditID INT IDENTITY(1,1) PRIMARY KEY,

    -- Reference
    SubmissionID NVARCHAR(50) NULL,
    AlembaReference NVARCHAR(50) NULL,

    -- Action Details
    ActionType NVARCHAR(100) NOT NULL,
    ActionDetails NVARCHAR(MAX) NULL,

    -- Status Change
    PreviousStatus NVARCHAR(50) NULL,
    NewStatus NVARCHAR(50) NULL,

    -- User Information
    PerformedBy NVARCHAR(255) NOT NULL,
    PerformedByEmail NVARCHAR(255) NULL,

    -- Client Information
    IPAddress NVARCHAR(50) NULL,
    UserAgent NVARCHAR(500) NULL,

    -- Timestamp
    PerformedAt DATETIME DEFAULT GETUTCDATE(),

    -- Indexes
    INDEX IX_Audit_SubmissionID (SubmissionID),
    INDEX IX_Audit_ActionType (ActionType),
    INDEX IX_Audit_PerformedAt (PerformedAt),
    INDEX IX_Audit_PerformedBy (PerformedBy)
);
END
GO

-- =============================================================================
-- VENDORS REFERENCE TABLE
-- For duplicate detection and fuzzy matching
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorsReference]') AND type in (N'U'))
BEGIN
CREATE TABLE VendorsReference (
    VendorID INT IDENTITY(1,1) PRIMARY KEY,

    -- Vendor Information
    VendorNumber NVARCHAR(50) NOT NULL UNIQUE,
    CompanyName NVARCHAR(255) NOT NULL,
    NormalizedName NVARCHAR(255) NULL,
    TradingName NVARCHAR(255) NULL,

    -- Identifiers
    CRN NVARCHAR(20) NULL,
    VATNumber NVARCHAR(20) NULL,

    -- Status
    IsActive BIT DEFAULT 1,

    -- Metadata
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME DEFAULT GETUTCDATE(),

    -- Indexes for fuzzy matching
    INDEX IX_Vendors_CompanyName (CompanyName),
    INDEX IX_Vendors_NormalizedName (NormalizedName),
    INDEX IX_Vendors_CRN (CRN),
    INDEX IX_Vendors_VATNumber (VATNumber)
);
END
GO

-- =============================================================================
-- NOTIFICATION QUEUE TABLE
-- For Power Automate triggers via SharePoint list changes
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NotificationQueue]') AND type in (N'U'))
BEGIN
CREATE TABLE NotificationQueue (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,

    -- Reference
    SubmissionID NVARCHAR(50) NOT NULL,

    -- Notification Details
    NotificationType NVARCHAR(50) NOT NULL,
    RecipientEmail NVARCHAR(255) NOT NULL,
    RecipientName NVARCHAR(200) NULL,
    Subject NVARCHAR(500) NOT NULL,
    Body NVARCHAR(MAX) NOT NULL,

    -- Processing Status
    Processed BIT DEFAULT 0,
    ProcessedAt DATETIME NULL,
    ErrorMessage NVARCHAR(MAX) NULL,

    -- Metadata
    CreatedAt DATETIME DEFAULT GETUTCDATE(),

    -- Indexes
    INDEX IX_Notification_Processed (Processed),
    INDEX IX_Notification_SubmissionID (SubmissionID)
);
END
GO

-- =============================================================================
-- SESSIONS TABLE
-- For session management and authentication tracking
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sessions]') AND type in (N'U'))
BEGIN
CREATE TABLE Sessions (
    SessionID NVARCHAR(255) PRIMARY KEY,

    -- User Information
    UserEmail NVARCHAR(255) NOT NULL,
    UserName NVARCHAR(200) NULL,
    UserGroups NVARCHAR(MAX) NULL,

    -- Session Data
    SessionData NVARCHAR(MAX) NULL,

    -- Metadata
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    ExpiresAt DATETIME NOT NULL,
    LastAccessedAt DATETIME DEFAULT GETUTCDATE(),

    -- Indexes
    INDEX IX_Sessions_UserEmail (UserEmail),
    INDEX IX_Sessions_ExpiresAt (ExpiresAt)
);
END
GO

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to normalize company names for duplicate detection
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NormalizeCompanyName]') AND type in (N'FN', N'IF', N'TF'))
BEGIN
    EXEC('CREATE FUNCTION dbo.NormalizeCompanyName(@name NVARCHAR(255))
RETURNS NVARCHAR(255)
AS
BEGIN
    DECLARE @result NVARCHAR(255) = LOWER(@name);

    -- Remove common suffixes
    SET @result = REPLACE(@result, '' limited'', '''');
    SET @result = REPLACE(@result, '' ltd'', '''');
    SET @result = REPLACE(@result, '' plc'', '''');
    SET @result = REPLACE(@result, '' llp'', '''');
    SET @result = REPLACE(@result, '' inc'', '''');
    SET @result = REPLACE(@result, '' corp'', '''');
    SET @result = REPLACE(@result, '' uk'', '''');

    -- Remove special characters
    SET @result = REPLACE(@result, ''.'', '''');
    SET @result = REPLACE(@result, '','', '''');
    SET @result = REPLACE(@result, '''''''', '''');
    SET @result = REPLACE(@result, ''"'', '''');
    SET @result = REPLACE(@result, ''&'', ''and'');

    -- Trim whitespace
    SET @result = LTRIM(RTRIM(@result));

    RETURN @result;
END;')
END
GO

-- Drop and recreate if it exists (workaround for function updates)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NormalizeCompanyName]') AND type in (N'FN', N'IF', N'TF'))
DROP FUNCTION dbo.NormalizeCompanyName
GO

CREATE FUNCTION dbo.NormalizeCompanyName(@name NVARCHAR(255))
RETURNS NVARCHAR(255)
AS
BEGIN
    DECLARE @result NVARCHAR(255) = LOWER(@name);

    -- Remove common suffixes
    SET @result = REPLACE(@result, ' limited', '');
    SET @result = REPLACE(@result, ' ltd', '');
    SET @result = REPLACE(@result, ' plc', '');
    SET @result = REPLACE(@result, ' llp', '');
    SET @result = REPLACE(@result, ' inc', '');
    SET @result = REPLACE(@result, ' corp', '');
    SET @result = REPLACE(@result, ' uk', '');

    -- Remove special characters
    SET @result = REPLACE(@result, '.', '');
    SET @result = REPLACE(@result, ',', '');
    SET @result = REPLACE(@result, '''', '');
    SET @result = REPLACE(@result, '"', '');
    SET @result = REPLACE(@result, '&', 'and');

    -- Trim whitespace
    SET @result = LTRIM(RTRIM(@result));

    RETURN @result;
END;
GO

-- =============================================================================
-- STORED PROCEDURES
-- =============================================================================

-- Procedure to check for duplicate vendors
-- DI-01: Fixed SQL wildcard injection vulnerability by escaping special characters
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CheckDuplicateVendor]') AND type in (N'P', N'PC'))
DROP PROCEDURE dbo.CheckDuplicateVendor
GO

CREATE PROCEDURE dbo.CheckDuplicateVendor
    @CompanyName NVARCHAR(255),
    @VATNumber NVARCHAR(20) = NULL,
    @CRN NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NormalizedName NVARCHAR(255) = dbo.NormalizeCompanyName(@CompanyName);

    -- SECURITY: Escape SQL wildcard characters to prevent wildcard injection
    -- Replace %, _, and [ with their escape sequences
    DECLARE @EscapedName NVARCHAR(255) = @NormalizedName;
    SET @EscapedName = REPLACE(@EscapedName, '[', '[[]');  -- Escape [ first
    SET @EscapedName = REPLACE(@EscapedName, '%', '[%]');  -- Escape %
    SET @EscapedName = REPLACE(@EscapedName, '_', '[_]');  -- Escape _

    SELECT
        VendorID,
        VendorNumber,
        CompanyName,
        CRN,
        VATNumber,
        CASE
            WHEN CRN = @CRN AND @CRN IS NOT NULL THEN 'EXACT_CRN_MATCH'
            WHEN VATNumber = @VATNumber AND @VATNumber IS NOT NULL THEN 'EXACT_VAT_MATCH'
            WHEN NormalizedName = @NormalizedName THEN 'EXACT_NAME_MATCH'
            ELSE 'POTENTIAL_MATCH'
        END AS MatchType
    FROM VendorsReference
    WHERE IsActive = 1
        AND (
            (CRN = @CRN AND @CRN IS NOT NULL)
            OR (VATNumber = @VATNumber AND @VATNumber IS NOT NULL)
            OR NormalizedName = @NormalizedName
            OR NormalizedName LIKE '%' + @EscapedName + '%' ESCAPE '['
        );
END;
GO

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View for PBP work queue
IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_PBPWorkQueue]'))
DROP VIEW vw_PBPWorkQueue
GO

CREATE VIEW vw_PBPWorkQueue AS
SELECT
    SubmissionID,
    DisplayReference,
    Status,
    CompanyName,
    RequesterFirstName + ' ' + RequesterLastName AS RequesterName,
    RequesterEmail,
    RequesterDepartment,
    CreatedAt,
    UpdatedAt,
    DATEDIFF(day, CreatedAt, GETUTCDATE()) AS DaysWaiting
FROM Submissions
WHERE Status IN ('pending_review', 'pending_pbp_review', 'info_required')
    AND CurrentStage = 'pbp';
GO

-- View for Procurement work queue
IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_ProcurementWorkQueue]'))
DROP VIEW vw_ProcurementWorkQueue
GO

CREATE VIEW vw_ProcurementWorkQueue AS
SELECT
    SubmissionID,
    DisplayReference,
    Status,
    CompanyName,
    RequesterFirstName + ' ' + RequesterLastName AS RequesterName,
    RequesterEmail,
    ContractValue,
    PBPApprovalDate,
    CreatedAt,
    UpdatedAt
FROM Submissions
WHERE Status IN ('approved', 'pending_procurement_review', 'pbp_approved')
    AND CurrentStage = 'procurement';
GO

-- View for AP Control work queue
IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_APControlWorkQueue]'))
DROP VIEW vw_APControlWorkQueue
GO

CREATE VIEW vw_APControlWorkQueue AS
SELECT
    SubmissionID,
    DisplayReference,
    Status,
    CompanyName,
    RequesterFirstName + ' ' + RequesterLastName AS RequesterName,
    RequesterEmail,
    ContractValue,
    ProcurementDecision,
    IR35Determination,
    CreatedAt,
    UpdatedAt
FROM Submissions
WHERE Status IN ('pending_ap_control', 'contract_uploaded')
    AND CurrentStage = 'ap';
GO

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert sample data for testing (remove in production)
-- INSERT INTO VendorsReference (VendorNumber, CompanyName, NormalizedName, CRN, IsActive)
-- VALUES
--     ('V001', 'Test Supplier Ltd', 'test supplier', '12345678', 1),
--     ('V002', 'Example Company PLC', 'example company', '87654321', 1);

PRINT 'Schema created successfully';
GO
