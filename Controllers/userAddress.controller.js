import UserModel from "../Models/user.model.js";


export const addUserAddress = async (req, res) => {

    try {
        const { userId, address } = req.body;
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (address?.isDefault) {
            user?.addresses?.forEach(a => (a.isDefault = false));
        }
        user.addresses.push(address);
        await user.save();
        res.json({ success: true, message: "Address added" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserAddress = async (req, res) => {
    const id = req.params.userId;
    try {
        const user = await UserModel.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ addresses: user.addresses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const removeUserAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body;

    if (!userId || !addressId) {
      return res.status(400).json({ message: "userId and addressId are required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const beforeCount = user.addresses.length;

    // 🗑️ Remove the address by _id
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== addressId.toString()
    );

    if (user.addresses.length === beforeCount) {
      return res.status(404).json({ message: "Address not found" });
    }

    await user.save();

    return res.json({
      success: true,
      message: "Address removed successfully",
      addresses: user.addresses, // return updated list (optional but useful)
    });
  } catch (err) {
    console.error("Remove address error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

