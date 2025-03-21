"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserModel {
    static async findByEmail(email) {
        const [rows] = await database_1.pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    }
    static async findById(userId) {
        const [rows] = await database_1.pool.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        return rows[0] || null;
    }
    static async create(userData) {
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, 10);
        const [result] = await database_1.pool.execute(`INSERT INTO users (email, password_hash, full_name, profile_picture_url, role)
       VALUES (?, ?, ?, ?, ?)`, [
            userData.email,
            hashedPassword,
            userData.full_name,
            userData.profile_picture_url || null,
            userData.role || 'Customer'
        ]);
        return result.insertId;
    }
    static async updateProfile(userId, updateData) {
        const updates = [];
        const values = [];
        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        });
        if (updates.length === 0)
            return false;
        values.push(userId);
        const [result] = await database_1.pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, values);
        return result.affectedRows > 0;
    }
    static async updateLastLogin(userId) {
        const [result] = await database_1.pool.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?', [userId]);
        return result.affectedRows > 0;
    }
    static async validatePassword(user, password) {
        return bcryptjs_1.default.compare(password, user.password_hash);
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=userModel.js.map