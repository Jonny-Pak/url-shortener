import { User } from '../database/entities/user.entity';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { UpdateUserDto } from '../auth/dto/update-user.dto';
import { UserRepository } from '../users/users.repository';
import { UserValidator } from '../users/validators';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { promises } from 'dns';

/**
 * Service class containing business logic for student operations
 */
@Injectable()
export class UserService {
    private repository: UserRepository;

    constructor(repository: UserRepository) {
        this.repository = repository;
    }

    /**
     * Creates a new student with validation
     */
    async createStudent(input: CreateUserDto): Promise<{ success: boolean; student?: User; error?: string }> {
        // Validate input data

        if (!UserValidator.isValidEmail(input.email)) {
            return { success: false, error: 'Email không đúng định dạng.' };
        }

        // Check for duplicate email
        const existingStudents = await this.repository.findAll();

        const checkEmail  = await this.checkEmailDulicate(input.email, existingStudents);
        if (checkEmail) {
                return { success: false, error: 'Email đã tồn tại trong hệ thống.' };
        }



        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Create new student manually (fix lỗi 'create' not exist)
        const now = new Date();
        const user = new User();
        user.email = input.email;
        user.password = hashedPassword;
        user.role = input.role && input.role.length > 0 ? input.role : ['user'];
        user.createdAt = now;
        student.updatedAt = now;

        const savedStudent = await this.repository.save(student);
        return { success: true, student: savedStudent };
    }

    // Check for duplicate phone
    async checkPhoneDulicate (phone: string, existingStudents: Student[] ): Promise<boolean> { 
        for (let i = 0; i < existingStudents.length; i++) {
            if (existingStudents[i].phone === phone) {
                return true;
            }
        }
        return false;
    }

    // Check for duplicate email
    async checkEmailDulicate (email: string, existingStudents: Student[] ): Promise<boolean> {
        for (let i = 0; i < existingStudents.length; i++) {
            if (existingStudents[i].email === email) {
                return true;
            }
        }
        return false;
    }
    /**
     * Retrieves all students
     */
    async getAllStudents(): Promise<Student[]> {
        return await this.repository.findAll();
    }

    async findbyid(id: number) {
        const students = await this.repository.findAll();

        if (students.length === 0) {
            return null; // danh sách rỗng, không có sinh viên
        }

        let foundid: number = students[0].id;

        for (let i = 1; i < students.length; i++) {
            if (students[i].id > id) {
                foundid = students[i].id;
            }
        }
        return foundid;
    }

    /**
     * Finds a student by ID
     */
    async getStudentById(id: number): Promise<Student | null> {
        const students = await this.repository.findAll(); // Lấy danh sách sinh viên
        if (students.length === 0) {
            return null; // danh sách rỗng, không có sinh viên
        }
        for (let i = 0; i < students.length; i++) {
            if (students[i].id === id) {
                return students[i];
            }
        }
        return null;
    }

    /**
     * Updates an existing student
     */
    async updateStudent(input: UpdateStudentDto): Promise<{ success: boolean; student?: Student; error?: string }> {
        const find_student = await this.repository.findById(input.id);
        if (!find_student) {
            return { success: false, error: 'Không tìm thấy sinh viên.' };
        }
        // if(find_student.gpa >= 3){
        //     return { success: false, error: 'Sinh viên có điểm GPA lớn hơn 3, không được update!.' };
        // }
        // update student
        const update: Student = {
            ...find_student,
            ...input,
            updatedAt: new Date()
        };

        if (input.password) {
            update.password = await bcrypt.hash(input.password, 10);
        }
        // Validate input data - Xacs thực dữ liệu đầu vào
        if (input.fullName && !StudentValidator.isValidFullName(input.fullName)) {
            return { success: false, error: 'Tên không hợp lệ. Vui lòng nhập tên có ít nhất 1 ký tự và chỉ chứa chữ cái.' };
        }

        if (input.age !== undefined && !StudentValidator.isValidAge(input.age)) {
            return { success: false, error: 'Tuổi phải là số nguyên dương.' };
        }

        if (input.email && !StudentValidator.isValidEmail(input.email)) {
            return { success: false, error: 'Email không đúng định dạng.' };
        }

        if (input.major && !StudentValidator.isValidMajor(input.major)) {
            return { success: false, error: 'Chuyên ngành không được để trống.' };
        }

        if (input.gpa && !StudentValidator.isValidGPA(input.gpa)) {
            return { success: false, error: 'GPA phải nằm trong khoảng từ 0.0 đến 4.0.' };
        }

        // Check for duplicate email
        const existingStudents = await this.repository.findAll();

        const checkEmail  = await this.checkEmailDulicate(input.email, existingStudents);
        if (checkEmail) {
                return { success: false, error: 'Email đã tồn tại trong hệ thống.' };
        }


        const checkPhone = this.checkPhoneDulicate(input.phone, existingStudents);
        if(checkPhone){
            return { success: false, error: 'Số điện thoại đã tồn tại trong hệ thống.' };
        }

        const savedStudent = await this.repository.update(update);
        if (!savedStudent) {
            return { success: false, error: 'Cập nhật thất bại.' };
        }
        return { success: true, student: savedStudent };
    }

    /**
     * Deletes a student by ID
     */
    async deleteStudent(id: number): Promise<{ success: boolean; error?: string }> {
        const delete_student = await this.repository.deleteById(id); // đọc và tìm sinh viên theo id
        if (delete_student) {
            return { success: true };
        } else {
            return { success: false, error: "Lỗi không thể xóa sinh viên này" };
        }
    }

    /**
     * Searches students by query string
     */
    async searchStudents(query: string): Promise<Student[]> {
        const students = await this.repository.findAll();
        const results: Student[] = [];
        const lowerQuery = query.toLowerCase();

        for (let i = 0; i < students.length; i++) {
            const fullName = students[i].fullName.toLowerCase();
            const email = students[i].email.toLowerCase();
            if (fullName.includes(lowerQuery) || email.includes(lowerQuery)) {
                results.push(students[i]);
            }
        }
        return results;
    }

    async testConnection() {
        try {
            await this.repository.query('SELECT 1');  // Gọi method public của repository
            return 'Kết nối DB thành công!';
        } catch (error) {
            return `Lỗi: ${error.message}`;
        }
    }

    /**
     * Gets statistics about students
     */
    // async getStatistics(): Promise<{ totalStudents: number; averageGPA: number; majorCounts: Record<string, number> }> {


    // }


}
