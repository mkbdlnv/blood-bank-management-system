import Admin from "../../../backend/models/adminModel.js";
import Blood from "../../../backend/models/bloodModel.js";
import BloodRequest from "../../../backend/models/bloodRequestModel.js";
import Donor from "../../../backend/models/donorModel.js";
import Facility from "../../../backend/models/facilityModel.js";

const ACCOUNTS = {
  admin: {
    email: "exp.admin@example.com",
    password: "AdminPass123!",
    role: "admin",
    name: "Experimental Admin",
  },
  hospital: {
    email: "exp.hospital@example.com",
    password: "QaPass123!",
    role: "hospital",
    facilityType: "hospital",
    name: "Experimental Hospital",
    registrationNumber: "EXP-HOSPITAL-001",
  },
  bloodLab: {
    email: "exp.lab@example.com",
    password: "QaPass123!",
    role: "blood-lab",
    facilityType: "blood-lab",
    name: "Experimental Blood Lab",
    registrationNumber: "EXP-LAB-001",
  },
};

function buildLoginDonorPayload(index) {
  const padded = String(index).padStart(2, "0");

  return {
    fullName: `Experimental Login Donor ${padded}`,
    email: `exp.login.${padded}@example.com`,
    password: "QaPass123!",
    phone: `91${String(index).padStart(8, "0")}`.slice(0, 10),
    role: "donor",
    address: {
      street: "11 Login Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    bloodGroup: "O+",
    age: 28,
    gender: "Male",
    weight: 68,
  };
}

function buildFacilityPayload(account) {
  return {
    name: account.name,
    email: account.email,
    password: account.password,
    phone: "9123456789",
    emergencyContact: "9876543210",
    address: {
      street: "42 Research Avenue",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    registrationNumber: account.registrationNumber,
    facilityType: account.facilityType,
    role: account.role,
    facilityCategory: "Private",
    documents: {
      registrationProof: {
        url: `https://example.com/${account.registrationNumber}.pdf`,
        filename: `${account.registrationNumber}.pdf`,
      },
    },
    status: "approved",
  };
}

export async function seedExperimentalData(mongoUri) {
  const mongoose = Facility.db.base;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  const emails = Object.values(ACCOUNTS).map((account) => account.email);
  const registrationNumbers = Object.values(ACCOUNTS)
    .filter((account) => account.registrationNumber)
    .map((account) => account.registrationNumber);
  const loginPool = Array.from({ length: 40 }, (_value, index) => buildLoginDonorPayload(index + 1));
  const loginEmails = loginPool.map((account) => account.email);

  const facilities = await Facility.find({ email: { $in: emails } }).select("_id");
  const facilityIds = facilities.map((facility) => facility._id);

  await BloodRequest.deleteMany({
    $or: [
      { hospitalId: { $in: facilityIds } },
      { labId: { $in: facilityIds } },
    ],
  });
  await Blood.deleteMany({
    $or: [
      { hospital: { $in: facilityIds } },
      { bloodLab: { $in: facilityIds } },
    ],
  });
  await Facility.deleteMany({
    $or: [
      { email: { $in: emails } },
      { registrationNumber: { $in: registrationNumbers } },
    ],
  });
  await Admin.deleteMany({ email: ACCOUNTS.admin.email });
  await Donor.deleteMany({ email: { $in: loginEmails } });

  const admin = await Admin.create({
    name: ACCOUNTS.admin.name,
    email: ACCOUNTS.admin.email,
    password: ACCOUNTS.admin.password,
    role: ACCOUNTS.admin.role,
  });

  const hospital = await Facility.create(buildFacilityPayload(ACCOUNTS.hospital));
  const bloodLab = await Facility.create(buildFacilityPayload(ACCOUNTS.bloodLab));
  const loginUsers = [];
  for (const payload of loginPool) {
    loginUsers.push(await Donor.create(payload));
  }

  return {
    admin: {
      ...ACCOUNTS.admin,
      id: admin._id.toString(),
    },
    hospital: {
      ...ACCOUNTS.hospital,
      id: hospital._id.toString(),
    },
    bloodLab: {
      ...ACCOUNTS.bloodLab,
      id: bloodLab._id.toString(),
    },
    loginPool: loginUsers.map((user, index) => ({
      id: user._id.toString(),
      email: loginPool[index].email,
      password: loginPool[index].password,
      role: "donor",
    })),
  };
}
