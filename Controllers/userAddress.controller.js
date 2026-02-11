import UserModel from "../Models/user.model.js";                                                                                  


export const addUserAddress = async (req, res) => {
    const { userId, address } = req.body;

    const user = await UserModel.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (address.isDefault) {
        user.addresses.forEach(a => (a.isDefault = false));
    }

    user.addresses.push(address);
    await user.save();

    res.json({ success: true, message: "Address added" });
};

export const getUserAddress = async (req, res) => {
    const user = await UserModel.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ addresses: user.addresses });
};


