import crypto from "crypto";

/**
 * Tạo hash ẩn danh (One-way HMAC-SHA256) cho tác giả review.
 * Đảm bảo:
 * 1. Không thể giải mã ngược để tìm ra user_id gốc.
 * 2. Cùng 1 user_id sẽ luôn ra cùng 1 hash (khi cùng salt) -> cho phép hệ thống chặn spam/duplicate.
 * 3. Nếu DB bị lộ, kẻ tấn công cũng không biết ai là người viết review nếu không có ANONYMOUS_SALT_SECRET.
 */
export function generateAuthorHash(userId: string): string {
  const secret = process.env.ANONYMOUS_SALT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[Security Violation] ANONYMOUS_SALT_SECRET bắt buộc phải được thiết lập trên môi trường Production để bảo vệ danh tính người dùng!"
      );
    }
    return crypto
      .createHmac("sha256", "default_dev_salt_linkedout_2026_super_secure")
      .update(userId)
      .digest("hex");
  }
  return crypto.createHmac("sha256", secret).update(userId).digest("hex");
}
