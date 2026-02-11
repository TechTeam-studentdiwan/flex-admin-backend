import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const AddressSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    label: String,
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: "Qatar" },
    isDefault: { type: Boolean, default: false },
});

const MeasurementProfileSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    profileName: String,
    measurements: Object,
    notes: String,
    lastUpdated: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    phone: String,
    email: String,
    name: String,
    password: String,
    isGuest: { type: Boolean, default: false },
    addresses: [AddressSchema],
    measurementProfiles: [MeasurementProfileSchema],
    wishlist: [String],
    createdAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
