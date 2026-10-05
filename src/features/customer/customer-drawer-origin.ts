// // File: src/features/customer/customer-drawer-origin.ts

// export type CustomerTabHref =
//   | "/(customer)/(tabs)/overview"
//   | "/(customer)/(tabs)/my-cars"
//   | "/(customer)/(tabs)/garage"
//   | "/(customer)/(tabs)/bookings"
//   | "/(customer)/(tabs)/inspections";

// let drawerOrigin: CustomerTabHref | null = null;

// export function rememberCustomerDrawerOrigin(pathname: string) {
//   // Agar user kisi tab par hai, to usay origin ke tor par save kar lo
//   if (pathname.includes("/overview"))
//     drawerOrigin = "/(customer)/(tabs)/overview";
//   else if (pathname.includes("/my-cars"))
//     drawerOrigin = "/(customer)/(tabs)/my-cars";
//   else if (pathname.includes("/garage"))
//     drawerOrigin = "/(customer)/(tabs)/garage";
//   else if (pathname.includes("/bookings"))
//     drawerOrigin = "/(customer)/(tabs)/bookings";
//   else if (pathname.includes("/inspections"))
//     drawerOrigin = "/(customer)/(tabs)/inspections";
// }

// export function takeCustomerDrawerOrigin() {
//   const origin = drawerOrigin;
//   // Use karne ke baad clear nahi karenge taake multiple backs sahi chalein
//   return origin;
// }
