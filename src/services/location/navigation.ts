import {
  Linking,
  Platform,
} from "react-native";

export async function openExternalNavigation(
  address: string,
) {
  const destination =
    encodeURIComponent(address);

  const url =
    Platform.OS === "ios"
      ? "http://maps.apple.com/?daddr=" +
        destination
      : "https://www.google.com/maps/dir/?api=1&destination=" +
        destination;

  await Linking.openURL(url);
}

export async function callPhone(
  phone: string,
) {
  const value =
    phone.replace(/\s+/g, "");

  await Linking.openURL(
    "tel:" + value,
  );
}

