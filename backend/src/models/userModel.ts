import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

export interface User extends RowDataPacket {
  user_id: number;
  email: string;
  password_hash: string;
  full_name: string;
  profile_picture_url?: string;
  role: 'Admin' | 'Customer';
  token?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<User[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(userId: number): Promise<User | null> {
    const [rows] = await pool.execute<User[]>(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  }

  static async create(userData: {
    email: string;
    password: string;
    full_name: string;
    profile_picture_url?: string;
    role?: 'Admin' | 'Customer';
  }): Promise<number> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, full_name, profile_picture_url, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userData.email,
        hashedPassword,
        userData.full_name,
        userData.profile_picture_url || null,
        userData.role || 'Customer'
      ]
    );

    return result.insertId;
  }

  static async updateProfile(userId: number, updateData: {
    full_name?: string;
    profile_picture_url?: string;
    is_active?: boolean;
  }): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) return false;

    values.push(userId);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async updateLastLogin(userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
      [userId]
    );

    return result.affectedRows > 0;
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }
}