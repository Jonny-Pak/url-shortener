
/**
 * Utility functions for validating student data
 */
export class UserValidator {
  /**
   * Validates email format using regex
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates GPA is within acceptable range (0.0 - 4.0)
   */
  // static isValidGPA(gpa: number): boolean {
  //   return gpa >= 0.0 && gpa <= 4.0;
  // }

  /**
   * Validates age is positive integer
   */
  // static isValidAge(age: number): boolean {
  //   return age > 0 && Number.isInteger(age);
  // }

  /**
   * Validates full name is not empty and contains only valid characters
   */
  // static isValidFullName(fullName: string): boolean {
  //   return fullName.trim().length > 0 && /^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF]+$/.test(fullName);
  // }

  /**
   * Validates major is not empty
   */
  // static isValidMajor(major: string): boolean {
  //   return major.trim().length > 0;
  // }
}
