import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
    {
        label: { type: String, trim: true }, // e.g. "Home", "Office"

        fullName: { type: String, trim: true, required: true },
        phone: { type: String, trim: true, required: true },

        addressType: {
            type: String,
            enum: ["villa", "apartment"],
            required: true,
        },

        // Common Qatar address fields

        streetNo: { type: String, trim: true, required: true },
        zoneNo: { type: String, trim: true, required: true },

        // Villa specific
        villaNo: { type: String, trim: true },

        // Apartment specific
        buildingNo: { type: String, trim: true },
        floorNo: { type: String, trim: true },
        roomNo: { type: String, trim: true },

        city: { type: String, default: "Doha" },
        country: { type: String, default: "Qatar" },

        isDefault: { type: Boolean, default: false },
        location: {
            lat: { type: Number },
            lng: { type: Number },
        },

    },
    { timestamps: true }
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
    { _id: false }
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
    { timestamps: true }
);

const UserSchema = new mongoose.Schema(
    {
        phone: { type: String, trim: true, index: true },
        email: { type: String, trim: true, lowercase: true, index: true },
        name: { type: String, trim: true },
        password: { type: String },
        terms: { type: String },
        isGuest: { type: Boolean, default: false },
        isAdmin: { type: Boolean, default: false },
        deliveryfee: Number,
        addresses: [AddressSchema],
        measurementProfiles: [MeasurementProfileSchema],
        wishlist: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        }],
    },
    { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
