import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
    {
        label: { type: String, trim: true },
        fullName: { type: String, trim: true },
        phone: { type: String, trim: true },
        addressLine1: { type: String, trim: true },
        addressLine2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, default: "Qatar" },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true}
);

const MeasurementsSchema = new mongoose.Schema(
    {
        bust: { type: Number, required: true },
        waist: { type: Number, required: true },
        hips: { type: Number, required: true },
        shoulder: { type: Number, required: true },
        sleeve_length: { type: Number },
        dress_length: { type: Number },
    },
    { timestamps: true}
);

const MeasurementProfileSchema = new mongoose.Schema(
    {
        profileName: { type: String, trim: true, required: true }, // e.g. "My Size", "Mom", "Office Wear"
        measurements: {
            type: MeasurementsSchema,
            required: true,
        },
        notes: { type: String, trim: true },
    },
    { timestamps: true}
);

const UserSchema = new mongoose.Schema(
    {
        phone: { type: String, trim: true, index: true },
        email: { type: String, trim: true, lowercase: true, index: true },
        name: { type: String, trim: true },
        password: { type: String },
        isGuest: { type: Boolean, default: false },
        isAdmin: { type: Boolean, default: false },
        addresses: [AddressSchema],
        measurementProfiles: [MeasurementProfileSchema],
        wishlist: [{ type: String }],
    },
    { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
