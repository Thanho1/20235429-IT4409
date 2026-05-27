require("dotenv").config();  
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB của bạn [cite: 229]
const mongoURI = "mongodb+srv://20235429:20235429@cluster0.e53fuvk.mongodb.net/IT4409-db";
mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB Error:", err));

// Định nghĩa Schema và Model [cite: 22, 235]
const UserSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Tên không được để trống'], minlength: 2 },
    age: { type: Number, required: [true, 'Tuổi không được để trống'], min: 0 },
    email: { 
        type: String, 
        required: [true, 'Email không được để trống'], 
        unique: true, // Đảm bảo email là duy nhất để xử lý yêu cầu báo lỗi tồn tại
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'] 
    },
    address: { type: String }
});
const User = mongoose.model("User", UserSchema);

// 2.1. GET - Phân trang + Tìm kiếm 
app.get("/api/users", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";

        const filter = search ? {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } }
            ]
        } : {};

        const skip = (page - 1) * limit;
        // Sử dụng Promise.all để tối ưu hóa truy vấn [cite: 278]
        const [users, total] = await Promise.all([
            User.find(filter).skip(skip).limit(limit),
            User.countDocuments(filter)
        ]);

        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: users
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2.2. POST - Tạo user mới [cite: 71, 269]
app.post("/api/users", async (req, res) => {
    try {
        const { name, age, email, address } = req.body;
        // Kiểm tra email tồn tại trước khi tạo [Yêu cầu trong ảnh]
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email đã tồn tại trong hệ thống" });
        }
        const newUser = await User.create({ name, age, email, address });
        res.status(201).json({ message: "Tạo người dùng thành công", data: newUser });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2.3. PUT - Cập nhật [cite: 97, 270]
app.put("/api/users/:id", async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } 
        );
        if (!updatedUser) return res.status(404).json({ error: "Không tìm thấy người dùng" });
        res.json({ message: "Cập nhật người dùng thành công", data: updatedUser });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2.4. DELETE - Xóa [cite: 117, 275]
app.delete("/api/users/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: "Không tìm thấy người dùng" });
        res.json({ message: "Xóa người dùng thành công" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));