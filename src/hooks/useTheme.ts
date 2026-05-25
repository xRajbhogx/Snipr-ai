import { COLORS, Theme } from "@/constants/theme";
import { useColorScheme } from "react-native";

const scheme = useColorScheme();  
export function useTheme(): Theme {
    //  'light' | 'dark' | null
    return COLORS[scheme === "light" ? "light" : "dark"]; 
}