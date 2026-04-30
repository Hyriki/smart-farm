export const validateFullName = (name: string): string | null => {
  if (!name.trim()) return "Full Name is required";
  if (!/^[a-zA-Z\s]+$/.test(name)) return "Full Name can only contain letters and spaces";
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email format";
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters long";
  return null;
};
