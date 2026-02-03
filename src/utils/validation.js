/**
 * Validation Schemas
 * Zod schemas for all form sections
 */

import { z } from 'zod';

// ===== Custom Validators =====

const nhsEmailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .refine((val) => val.endsWith('@nhs.net'), {
    message: 'Email must be an NHS email address ending in @nhs.net',
  });

const ukPhoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^[+]?[0-9 ()-]{7,15}$/, 'Please enter a valid UK phone number');

const ukPostcodeSchema = z
  .string()
  .min(1, 'Postcode is required')
  .regex(
    /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i,
    'Please enter a valid UK postcode'
  )
  .transform((val) => val.toUpperCase().replace(/\s+/g, ' ').trim());

const crnSchema = z
  .string()
  .min(1, 'Company Registration Number is required')
  .regex(/^[0-9]{7,8}$/, 'CRN must be 7 or 8 digits')
  .transform((val) => (val.length === 7 ? '0' + val : val));

const nameSchema = z
  .string()
  .min(1, 'This field is required')
  .max(50, 'Maximum 50 characters')
  .regex(
    /^[a-zA-Z\s\-']+$/,
    'Only letters, spaces, hyphens, and apostrophes are allowed'
  );

// ===== Section 1: Requester Information =====

export const section1Schema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  jobTitle: z.string().min(1, 'Job title is required').max(100, 'Maximum 100 characters'),
  department: z.string().min(1, 'Department is required').max(100, 'Maximum 100 characters'),
  nhsEmail: nhsEmailSchema,
  phoneNumber: ukPhoneSchema,
});

// ===== Section 2: Pre-screening =====

export const section2Schema = z.object({
  supplierConnection: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  letterheadAvailable: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  justification: z
    .string()
    .min(10, 'Please provide more detail (minimum 10 characters)')
    .max(350, 'Maximum 350 characters'),
  usageFrequency: z.enum(['one-off', 'occasional', 'regular'], {
    required_error: 'Please select an option',
  }),
  soleTraderStatus: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  serviceCategory: z.enum(['clinical', 'non-clinical'], {
    required_error: 'Please select an option',
  }),
  procurementEngaged: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  prescreeningAcknowledgement: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge the declaration' }),
  }),
});

// ===== Section 3: Supplier Classification =====

export const section3BaseSchema = z.object({
  companiesHouseRegistered: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  supplierType: z.enum(['limited_company', 'charity', 'sole_trader', 'public_sector'], {
    required_error: 'Please select a supplier type',
  }),
  annualValue: z.number().positive('Please enter a valid amount'),
  employeeCount: z.enum(['micro', 'small', 'medium', 'large'], {
    required_error: 'Please select an option',
  }),
  limitedCompanyInterest: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  partnershipInterest: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
});

// Dynamic schema based on supplier type
export const getLimitedCompanySchema = () =>
  section3BaseSchema.extend({
    crn: crnSchema,
  });

export const getCharitySchema = (companiesHouse) => {
  const base = section3BaseSchema.extend({
    charityNumber: z.string().min(1, 'Charity number is required').max(8, 'Maximum 8 digits'),
  });

  if (companiesHouse === 'yes') {
    return base.extend({
      crnCharity: crnSchema,
    });
  }

  return base;
};

export const getSoleTraderSchema = () =>
  section3BaseSchema.extend({
    idType: z.enum(['passport', 'driving_licence'], {
      required_error: 'Please select ID type',
    }),
  });

export const getPublicSectorSchema = () =>
  section3BaseSchema.extend({
    organisationType: z.string().min(1, 'Please select organisation type'),
  });

// ===== Section 4: Supplier Details =====

export const section4Schema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100, 'Maximum 100 characters'),
  tradingName: z.string().max(100, 'Maximum 100 characters').optional(),
  registeredAddress: z
    .string()
    .min(1, 'Registered address is required')
    .max(300, 'Maximum 300 characters'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(50, 'Maximum 50 characters')
    .regex(/^[a-zA-Z\s\-]+$/, 'Only letters, spaces, and hyphens are allowed'),
  postcode: ukPostcodeSchema,
  contactName: z.string().min(1, 'Contact name is required').max(100, 'Maximum 100 characters'),
  contactEmail: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  contactPhone: ukPhoneSchema,
  website: z
    .string()
    .url('Please enter a valid URL starting with https://')
    .startsWith('https://', 'URL must start with https://')
    .optional()
    .or(z.literal('')),
});

// ===== Section 5: Service Description =====

export const section5Schema = z.object({
  serviceType: z
    .array(z.string())
    .min(1, 'Please select at least one service type')
    .max(7, 'Maximum 7 service types'),
  serviceDescription: z
    .string()
    .min(10, 'Please provide more detail (minimum 10 characters)')
    .max(350, 'Maximum 350 characters'),
});

// ===== Section 6: Financial & Accounts =====

export const section6BaseSchema = z.object({
  overseasSupplier: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  accountsAddressSame: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  ghxDunsKnown: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  cisRegistered: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  publicLiability: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  vatRegistered: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
});

export const getSection6Schema = (formData) => {
  let schema = section6BaseSchema;

  // Overseas supplier fields
  if (formData.overseasSupplier === 'yes') {
    schema = schema.extend({
      iban: z
        .string()
        .min(1, 'IBAN is required')
        .min(15, 'IBAN must be between 15 and 34 characters')
        .max(34, 'IBAN must be between 15 and 34 characters')
        .regex(/^[A-Z]{2}[0-9A-Z\s]+$/i, 'IBAN must start with a 2-letter country code (e.g., GB)'),
      swiftCode: z
        .string()
        .min(1, 'SWIFT/BIC code is required')
        .regex(
          /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i,
          'SWIFT/BIC code must be 8 or 11 characters (format: AAAABBCCXXX)'
        ),
      bankRouting: z
        .string()
        .min(1, 'Bank routing number is required')
        .regex(/^[0-9]{9}$/, 'Bank Routing Number must be exactly 9 digits'),
    });
  } else if (formData.overseasSupplier === 'no') {
    // UK supplier fields
    schema = schema.extend({
      sortCode: z
        .string()
        .min(1, 'Sort Code is required')
        .regex(/^[0-9\s-]{6,8}$/, 'UK Sort Code must be 6 digits (e.g., 12-34-56)')
        .transform((val) => val.replace(/[\s-]/g, ''))
        .refine((val) => val.length === 6, 'UK Sort Code must be exactly 6 digits'),
      accountNumber: z
        .string()
        .min(1, 'Account Number is required')
        .regex(/^[0-9]{8}$/, 'UK Account Number must be exactly 8 digits'),
    });
  }

  // Separate accounts address
  if (formData.accountsAddressSame === 'no') {
    schema = schema.extend({
      accountsAddress: z.string().min(1, 'Accounts address is required'),
      accountsCity: z.string().min(1, 'City is required'),
      accountsPostcode: ukPostcodeSchema,
      accountsPhone: ukPhoneSchema,
      accountsEmail: z.string().email('Please enter a valid email address'),
    });
  }

  // DUNS number
  if (formData.ghxDunsKnown === 'yes') {
    schema = schema.extend({
      ghxDunsNumber: z
        .string()
        .min(1, 'DUNS number is required')
        .regex(/^[0-9\s-]{9,11}$/, 'DUNS number must be 9 digits')
        .transform((val) => val.replace(/[\s-]/g, ''))
        .refine((val) => val.length === 9, 'DUNS number must be exactly 9 digits'),
    });
  }

  // UTR for CIS
  if (formData.cisRegistered === 'yes') {
    schema = schema.extend({
      utrNumber: z
        .string()
        .min(1, 'UTR number is required')
        .regex(/^[0-9\s]{10,13}$/, 'UTR (Unique Taxpayer Reference) must be 10 digits')
        .transform((val) => val.replace(/\s/g, ''))
        .refine((val) => val.length === 10, 'UTR must be exactly 10 digits'),
    });
  }

  // Public liability insurance
  if (formData.publicLiability === 'yes') {
    schema = schema.extend({
      plCoverage: z.number().positive('Please enter a valid amount'),
      plExpiry: z.string().min(1, 'Expiry date is required').refine((date) => {
        const expiry = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return expiry >= today;
      }, 'Expiry date must be today or in the future'),
    });
  }

  // VAT number
  if (formData.vatRegistered === 'yes') {
    schema = schema.extend({
      vatNumber: z
        .string()
        .min(1, 'VAT number is required')
        .regex(
          /^(GB)?[0-9\s]{9,15}$/i,
          'UK VAT Number must be 9 or 12 digits (GB prefix optional, e.g., GB123456789)'
        )
        .transform((val) => val.replace(/\s/g, '').toUpperCase())
        .refine((val) => {
          const withoutGB = val.startsWith('GB') ? val.slice(2) : val;
          return withoutGB.length === 9 || withoutGB.length === 12;
        }, 'VAT number must be 9 or 12 digits after GB prefix'),
    });
  }

  return schema;
};

// ===== Section 7: Review & Submit =====

export const section7Schema = z.object({
  finalAcknowledgement: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge before submitting' }),
  }),
});

// Authorisation schema (for reviewers)
export const authorisationSchema = z.object({
  assessment: z.enum(['standard', 'opw_ir35'], {
    required_error: 'Please select an assessment type',
  }),
  notes: z.string().max(500, 'Maximum 500 characters').optional(),
  signatureName: z.string().min(1, 'Signature name is required'),
  signatureDate: z.string().min(1, 'Date is required'),
});
