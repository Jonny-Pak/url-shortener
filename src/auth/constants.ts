// constants.ts
export const jwtConstants = {
  secret: 'your-secret-key', // Thay bằng secret thật, lưu trong .env
  expiresIn: 3600, // 1 giờ (số giây)
  refreshSecret: 'your-refresh-secret-key',
  refreshExpiresIn: 604800, // 7 ngày (số giây)
};
