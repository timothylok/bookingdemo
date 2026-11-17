import type { NavigationItemType } from "../shell/navigation/NavigationItem";

export const clinicNavigationItems: NavigationItemType[] = [
  {
    name: "clinic_reception",
    href: "/clinic/reception",
    icon: "layout-dashboard",
  },
  {
    name: "clinic_services",
    href: "/clinic/services",
    icon: "clipboard",
    moreOnMobile: true,
  },
  {
    name: "clinic_locations",
    href: "/clinic/locations",
    icon: "map-pin",
    moreOnMobile: true,
  },
  {
    name: "clinic_patients",
    href: "/clinic/patients",
    icon: "users",
    moreOnMobile: true,
  },
];
