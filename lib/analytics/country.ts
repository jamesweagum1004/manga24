export function getCountryCode(headers: Headers) {
  const value = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? headers.get("x-country-code") ?? headers.get("cdn-requestcountrycode");
  return value && /^[A-Za-z]{2}$/u.test(value) ? value.toUpperCase() : null;
}
