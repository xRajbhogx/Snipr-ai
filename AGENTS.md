## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v55.0.0/ before writing any code.


## Snipr AI — Detailed Product Description
Overview

Snipr AI is an offline-first mobile application designed specifically for developers to store, organize, search, manage, and sync reusable code snippets and development resources directly from their mobile device. The application combines local-first architecture, intelligent AI-powered tooling, cloud synchronization, and advanced search capabilities into a single developer utility platform.

The app is built to function seamlessly without an internet connection while still providing optional online synchronization through Turso whenever connectivity becomes available. Snipr AI acts as a personal developer knowledge base where users can save frequently used code, organize technical resources, manage local development files, scan code from screenshots, and leverage AI to understand or improve snippets.

The primary goal of the application is to provide developers with a lightweight yet powerful mobile coding companion that improves productivity, accelerates development workflows, and ensures important code snippets remain accessible anytime and anywhere.

Problem Statement

Developers frequently reuse boilerplate code, utility functions, API integrations, configuration files, and debugging snippets across multiple projects. Existing note-taking or snippet management tools often rely heavily on internet connectivity, lack proper offline support, provide limited organization capabilities, or fail to integrate intelligent AI-powered developer assistance.

Additionally, developers commonly encounter useful code snippets on platforms such as:

YouTube tutorials
Technical blogs
Documentation
PDFs
Social media
Screenshots
Online forums

but lack a fast and organized method to store and retrieve this information efficiently on mobile devices.

Snipr AI addresses these issues by offering:

complete offline functionality
intelligent semantic search
AI-powered code explanations
OCR-based code extraction
cloud synchronization
local file management
export and sharing utilities

within a single unified mobile application.



## How the theme should be implemented example:
import { FONT_SIZE, FONT_WEIGHT, Theme } from "@/constants/theme";
import { useGlobalStyles } from "@/constants/useGlobalStyles";
import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const HomeScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = makeStyles(theme);

  return (
    <View style={globalStyles.screenContainer}>
      <Text style={styles.title}>HomeScreen</Text>
    </View>
  );
};

export default HomeScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    title: {
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
    },
  });

### ALWAYS USE REACT-NATIVE-REANIMATED for animations
https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started

### IMPORTANT: 
- dont use inline styles at all
- always use stylesheet which will be at the end, export should be before it just like the given example
- always use constants for everything like FONT_SIZE, FONT_WEIGHT, SHADOW, etc from the constants/theme
-If there exists an icon in expo vector icon, no need to use emojis at all