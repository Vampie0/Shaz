export type CustomerTabHref =
  | "/(customer)/(tabs)/overview"
  | "/(customer)/(tabs)/my-cars"
  | "/(customer)/(tabs)/garage"
  | "/(customer)/(tabs)/bookings"
  | "/(customer)/(tabs)/inspections";

let drawerOrigin:
  | CustomerTabHref
  | null = null;

function normalisePathname(
  pathname: string,
) {
  const clean =
    pathname
      .split("?")[0]
      .split("#")[0]
      .replace(/\\/g, "/")
      .replace(/\/+$/, "");

  return clean || "/";
}

function tabHrefFromPathname(
  pathname: string,
): CustomerTabHref {
  const current =
    normalisePathname(
      pathname,
    );

  if (
    current.endsWith(
      "/my-cars",
    )
  ) {
    return "/(customer)/(tabs)/my-cars";
  }

  if (
    current.endsWith(
      "/garage",
    )
  ) {
    return "/(customer)/(tabs)/garage";
  }

  if (
    current.endsWith(
      "/bookings",
    )
  ) {
    return "/(customer)/(tabs)/bookings";
  }

  if (
    current.endsWith(
      "/inspections",
    )
  ) {
    return "/(customer)/(tabs)/inspections";
  }

  return "/(customer)/(tabs)/overview";
}

const drawerDestinationSuffixes = [
  "/buy-cars",
  "/parts",
  "/sell-my-car",
  "/vehicle-inspection",
  "/mobile-services",
  "/about",
  "/account",
] as const;

export function rememberCustomerDrawerOrigin(
  pathname: string,
) {
  drawerOrigin =
    tabHrefFromPathname(
      pathname,
    );
}

export function takeCustomerDrawerOrigin() {
  const origin =
    drawerOrigin;

  drawerOrigin = null;

  return origin;
}

export function isCustomerDrawerDestination(
  pathname: string,
) {
  const current =
    normalisePathname(
      pathname,
    );

  return drawerDestinationSuffixes.some(
    (suffix) =>
      current.endsWith(
        suffix,
      ),
  );
}
