// utils/roleBasedRedirect.js
export function roleBasedRedirect(user) {
  if (!user) return "/login";
  if (user.role === "admin") return "/admin";
  if (user.role === "owner") return "/my-properties";
  return "/";
}
