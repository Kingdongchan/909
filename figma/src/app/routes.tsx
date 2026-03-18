import { createBrowserRouter } from "react-router";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import CommunityPage from "./pages/CommunityPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/map",
    Component: MapPage,
  },
  {
    path: "/community/:placeName?",
    Component: CommunityPage,
  },
]);
