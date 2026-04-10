/**
 * Default password used for QA test accounts.
 */
const DEFAULT_PASSWORD = "QaPass123!";

/**
 * Converts a value to a safe slug format for use in emails, names, etc.
 * @param {string|number} value - The value to convert.
 * @returns {string} A safe slug string.
 */
function toSafeSlug(value) {
  return String(value || "local")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "local";
}

/**
 * Converts a value to a string of digits, ensuring minimum length.
 * @param {string|number} value - The value to convert.
 * @param {number} minLength - Minimum length of the resulting string.
 * @returns {string} A string of digits.
 */
function toDigits(value, minLength = 6) {
  const digits = String(value || "").replace(/\D/g, "") || "1234567890";
  return digits.repeat(Math.ceil(minLength / digits.length)).slice(0, minLength);
}

/**
 * Builds a QA test scenario with sample data for donor, hospital, and blood lab.
 * @param {string} runId - Identifier for the test run, used to generate unique data.
 * @returns {object} An object containing donor, hospital, and bloodLab test data.
 */
export function buildQaScenario(runId = "local") {
  const slug = toSafeSlug(runId);
  const digits = toDigits(runId, 10);
  const pincode = `5${toDigits(runId, 5)}`;

  return {
    donor: {
      email: `qa.donor.${slug}@example.com`,
      password: DEFAULT_PASSWORD,
      fullName: `QA Donor ${slug}`,
      phone: `9${digits.slice(1)}`,
      emergencyContact: `8${digits.slice(1)}`,
      dob: "1995-06-15",
      address: {
        street: "123 QA Avenue",
        city: "Mumbai",
        state: "Maharashtra",
        pincode,
      },
      age: 28,
      gender: "Male",
      bloodGroup: "O+",
      weight: 72,
      role: "donor",
    },
    hospital: {
      email: `qa.hospital.${slug}@example.com`,
      password: DEFAULT_PASSWORD,
      name: `QA Hospital ${slug}`,
      phone: `9${digits.slice(1)}`,
      emergencyContact: `8${digits.slice(1)}`,
      address: {
        street: "45 Hospital Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode,
      },
      registrationNumber: `HOSP-${slug}`.toUpperCase(),
      facilityType: "hospital",
      role: "hospital",
      facilityCategory: "Private",
      documents: {
        registrationProof: {
          url: "https://example.com/qa-hospital-registration.pdf",
          filename: "qa-hospital-registration.pdf",
        },
      },
    },
    bloodLab: {
      email: `qa.lab.${slug}@example.com`,
      password: DEFAULT_PASSWORD,
      name: `QA Blood Lab ${slug}`,
      phone: `7${digits.slice(1)}`,
      emergencyContact: `6${digits.slice(1)}`,
      address: {
        street: "77 Lab Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode,
      },
      registrationNumber: `LAB-${slug}`.toUpperCase(),
      facilityType: "blood-lab",
      role: "blood-lab",
      facilityCategory: "Private",
      documents: {
        registrationProof: {
          url: "https://example.com/qa-blood-lab-registration.pdf",
          filename: "qa-blood-lab-registration.pdf",
        },
      },
    },
  };
}

export { DEFAULT_PASSWORD };
