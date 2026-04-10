import { randomUUID } from "node:crypto";

const DEFAULT_PASSWORD = "QaPass123!";

function buildSuffix(prefix = "qa") {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function buildDigits(value) {
  return String(value).replace(/\D/g, "").padEnd(9, "1").slice(0, 9);
}

export function buildDonorPayload(overrides = {}) {
  const suffix = overrides.suffix || buildSuffix("donor");
  const digits = buildDigits(suffix);

  return {
    fullName: `Test Donor ${suffix}`,
    email: `donor.${suffix}@example.com`,
    password: DEFAULT_PASSWORD,
    phone: `9${digits}`,
    emergencyContact: `8${digits}`,
    age: 29,
    gender: "Male",
    bloodGroup: "O+",
    weight: 72,
    address: {
      street: "123 Donor Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    role: "donor",
    ...overrides,
  };
}

export function buildFacilityPayload(overrides = {}) {
  const facilityType = overrides.facilityType || "hospital";
  const suffix = overrides.suffix || buildSuffix(facilityType);
  const digits = buildDigits(suffix);

  return {
    name: `Test ${facilityType} ${suffix}`,
    email: `${facilityType}.${suffix}@example.com`,
    password: DEFAULT_PASSWORD,
    phone: `9${digits}`,
    emergencyContact: `8${digits}`,
    address: {
      street: "45 Facility Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400002",
    },
    registrationNumber: `${facilityType}-${suffix}`.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase(),
    facilityType,
    role: facilityType,
    facilityCategory: "Private",
    documents: {
      registrationProof: {
        url: `https://example.com/${facilityType}-${suffix}.pdf`,
        filename: `${facilityType}-${suffix}.pdf`,
      },
    },
    status: "pending",
    ...overrides,
  };
}

export function buildAdminPayload(overrides = {}) {
  const suffix = overrides.suffix || buildSuffix("admin");

  return {
    name: `Admin ${suffix}`,
    email: `admin.${suffix}@example.com`,
    password: DEFAULT_PASSWORD,
    role: "admin",
    ...overrides,
  };
}

export { DEFAULT_PASSWORD };
