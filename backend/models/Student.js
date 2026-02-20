const pool = require('../config/database');
const bcrypt = require('bcrypt');

class Student {
  // Register new student
  static async create(srn, pin, name = null) {
    const pinHash = await bcrypt.hash(pin, 10);
    
    const query = `
      INSERT INTO students (srn, pin_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id, srn, name, created_at
    `;
    
    try {
      const result = await pool.query(query, [srn, pinHash, name]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('SRN already registered');
      }
      throw error;
    }
  }

  // Find student by SRN
  static async findBySRN(srn) {
    const query = 'SELECT * FROM students WHERE srn = $1';
    const result = await pool.query(query, [srn]);
    return result.rows[0];
  }

  // Verify PIN
  static async verifyPin(srn, pin) {
    const student = await this.findBySRN(srn);
    if (!student) return null;
    
    const isValid = await bcrypt.compare(pin, student.pin_hash);
    if (!isValid) return null;
    
    return student;
  }

  // Update student profile
  static async updateProfile(id, data) {
    const query = `
      UPDATE students 
      SET name = COALESCE($2, name),
          phone = COALESCE($3, phone),
          email = COALESCE($4, email),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, srn, name, phone, email
    `;
    
    const result = await pool.query(query, [
      id,
      data.name,
      data.phone,
      data.email
    ]);
    
    return result.rows[0];
  }
}

module.exports = Student;