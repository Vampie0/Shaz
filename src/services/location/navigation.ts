import { Linking, Platform } from "react-native";

/**
 * Smart Navigation Logic:
 * Yeh function check karta hai ke device konsi hai.
 * Agar iPhone (iOS) hai toh Apple Maps kholta hai.
 * Agar Android hai toh Google Maps kholta hai.
 */
export async function openExternalNavigation(address: string) {
  const destination = encodeURIComponent(address);

  // iOS ke liye Apple Maps ka schema aur Android ke liye Google Maps ka
  const url =
    Platform.OS === "ios"
      ? "http://maps.apple.com/?daddr=" + destination
      : "https://www.google.com/maps/dir/?api=1&destination=" + destination;

  try {
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Agar kisi wajah se default app na khule toh browser mein Google Maps khol den (Universal fallback)
      await Linking.openURL(
        "https://www.google.com/maps/search/?api=1&query=" + destination,
      );
    }
  } catch (error) {
    console.error("Navigation Error:", error);
  }
}

/**
 * Direct Call Logic:
 * Customer ke phone number par click karne se dialer khul jaye ga.
 */
export async function callPhone(phone: string) {
  const value = phone.replace(/\s+/g, "");

  await Linking.openURL("tel:" + value);
}
