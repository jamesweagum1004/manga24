export function getAdminAuthStatus() {
  const configured = Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);

  return {
    configured,
    developmentBypass: !configured && process.env.NODE_ENV !== "production"
  };
}
